--
-- Add digest()
-- http://dba.stackexchange.com/questions/81202/cant-run-digest-on-posrgresql-9-3-on-rds
--
CREATE EXTENSION IF NOT EXISTS pgcrypto;

--
-- Create or refresh item view
-- Must be called before searching for new events
--
CREATE OR REPLACE FUNCTION create_items_view()
  RETURNS VOID
AS
$$
DECLARE view_name TEXT = 'items_view';
BEGIN
  IF exists (SELECT relname FROM pg_class WHERE relkind = 'm' and relname = view_name) THEN
    EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY ' || view_name;
    RETURN;
  ELSE

    EXECUTE $QRY$ CREATE MATERIALIZED VIEW $QRY$ || view_name ||
      $QRY$ AS
        SELECT
          q1.item_id,
          first_date,
          last_date,
          i.house AS house_id,
          i.meta->>'label' AS label,
          i.meta->>'linkedItems' AS item_name
        FROM
          (
          SELECT distinct
            item_id,
            min(time) AS first_date,
            max(time) AS last_date
          FROM measurements
          GROUP BY item_id) as q1
            JOIN
              items AS i
            ON i.id=q1.item_id
        ORDER BY
          q1.item_id
      $QRY$;

    EXECUTE $QRY$ CREATE UNIQUE INDEX  $QRY$ || view_name || $QRY$_idx ON items_view ("item_id") $QRY$;

    RETURN;
  END IF;
END;
$$  LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_all()
  RETURNS VOID
AS
$$
  BEGIN
    PERFORM create_items_view();
  END;
$$ LANGUAGE plpgsql;

create function round_timestamp(timestamp without time zone, integer DEFAULT 1) returns timestamp without time zone
    immutable
    language sql
as
$$
select 'epoch'::timestamp + '1 second'::interval * ($2 *
round(date_part('epoch', $1) / $2));
$$;

--
-- Annotation Tables
--
CREATE TABLE IF NOT EXISTS annotation_labels (
  id SERIAL not null PRIMARY KEY,
  item_id INTEGER DEFAULT null references items(id),
  text TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS annotations (
  id SERIAL not null PRIMARY KEY,
  item_id INTEGER DEFAULT null references items(id),
  label_id INTEGER not null references annotation_labels,
  start_date TIMESTAMP,
  stop_date TIMESTAMP
);

--
-- Create all views an index
-- This must be called after inserting new data
--
DO $$ BEGIN
    PERFORM update_all();
END $$ LANGUAGE plpgsql;
