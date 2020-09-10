CREATE TABLE IF NOT EXISTS items (
    id      SERIAL not null PRIMARY KEY,
    name    VARCHAR(500) not null,
    house   INTEGER not null,
    meta    JSON
);

CREATE TABLE IF NOT EXISTS measurements (
    item_id INTEGER DEFAULT null references items(id),
    time    TIMESTAMP,
    value   FLOAT
);

CREATE INDEX IF NOT EXISTS measurements_id_time_idx ON measurements(item_id, time);

CREATE OR REPLACE FUNCTION import_CSV(var_file_name VARCHAR, var_name VARCHAR, var_house INTEGER, var_meta JSON)
  RETURNS VOID
AS
$$
DECLARE itemid INTEGER; -- every measurement will be assigned to a unique deviceID from table items
BEGIN
    -- create a new device in items if it does not exist already
    IF NOT EXISTS(
    SELECT id
    FROM items
    WHERE items.name=var_name AND items.house=var_house LIMIT 1
    )
    THEN
        INSERT INTO items(name, house, meta)
        VALUES(var_name, var_house, var_meta);
    ELSE
        UPDATE items SET meta=var_meta WHERE items.name=var_name AND items.house=var_house;
    END IF;

    itemid := (
        SELECT id
        FROM items
        WHERE items.name=var_name AND items.house=var_house LIMIT 1
    );
    -- create a temp-table and import all measurements from csv-file to the temp-table only with time/value as columns
    CREATE LOCAL TEMP TABLE measurements_temp (
        time_t  TIMESTAMP,
        value_t FLOAT
    );

    EXECUTE format('COPY measurements_temp FROM ''%s''', var_file_name);
    -- export data from temp-table to measurements-table and adhere the deviceID to every measurement
    INSERT INTO measurements(time, value, item_id) SELECT time_t, value_t, itemid FROM measurements_temp;
END;
$$
LANGUAGE 'plpgsql';
