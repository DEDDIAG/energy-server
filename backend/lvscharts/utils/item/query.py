from ...utils.date import is_iso8601
from .exception import InvalidDateFormat


class Query(object):
    _QUERY = None

    def __init__(self):
        self._params = {}

    def request(self, con):
        return con.from_psql(self._format_sql())

    def execute(self, con):
        return con.exec_from_psql(self._format_sql())

    def _format_sql(self):
        return self._QUERY.format(**self._params)


class ItemEvents(Query):
    _QUERY = """
    SELECT
      id as eid,
      start_date,
      stop_date
    FROM
      measurements_events
    WHERE item_id='{item_id}'
    ORDER BY
      start_date DESC"""

    def __init__(self, item_id):
        self._params = {
            'item_id': item_id
        }


class ItemEventValues(Query):
    _QUERY = """
    SELECT
      id as eid,
      start_date,
      stop_date,
      values
    FROM
      measurements_events
    WHERE id='{id}'"""

    def __init__(self, item_id, eid):
        self._params = {
            'item_id': item_id,
            'id': eid
        }


class ItemEventValuesAll(Query):
    _QUERY = """
    SELECT
      id as eid,
      start_date,
      stop_date,
      values
    FROM
      measurements_events"""

    def __init__(self, item_id):
        self._params = {
            'item_id': item_id,
        }


class ItemValues(Query):
    _QUERY = """
    SELECT
      item_id,
      round_timestamp(time) AS time,
      value
    FROM measurements
    WHERE
      time BETWEEN '{start_date}' AND '{stop_date}' AND item_id={item_id} and value < 10000
    ORDER BY time
        """

    def __init__(self, item_id, start_date, stop_date):
        if not is_iso8601(start_date):
            raise InvalidDateFormat(start_date)

        if not is_iso8601(stop_date):
            raise InvalidDateFormat(stop_date)

        self._params = {
            'item_id': item_id,
            'start_date': start_date,
            'stop_date': stop_date,
        }


class ItemEnergy(ItemValues):
    _QUERY = """
    WITH q0 as (
        SELECT
        item_id,
        time as start,
        lead(time) over(ORDER BY time) - time as duration,
        value as power
        FROM measurements
        WHERE
          time BETWEEN '{start_date}' and '{stop_date}'
          AND item_id={item_id}
    )
    SELECT
        '{start_date}' as  start_date,
        '{stop_date}' as  stop_date,
        SUM(EXTRACT(SECONDS FROM duration)*power)/(3600*1000) as energy
    FROM q0"""


class Items(Query):
    _QUERY = """
    SELECT
      item_id,
      first_date,
      last_date,
      house_id,
      label,
      item_name
    FROM
      items_view
    """
