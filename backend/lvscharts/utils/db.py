import json
import urllib
import pandas as pd
import sqlalchemy.pool as pool
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


def json_request(url):
    r = urllib.request.urlopen(url)
    data = json.loads(r.read().decode(r.info().get_param('charset') or 'utf-8'))
    return data


Session = sessionmaker()


class Connection(object):

    def __init__(self, db_name, user, host, password, pool_size, max_overflow):
        self._password = password
        self._host = host
        self._user = user
        self._db_name = db_name
        self.__connection_pool = pool.QueuePool(self._get_conn,  pool_size=pool_size, max_overflow=max_overflow)
        self._engine = create_engine('postgresql+psycopg2://', pool_size=20, max_overflow=0, creator=self._get_conn)
        Session.configure(bind=self._engine)
        self.session = None

    def _get_conn(self):
        import psycopg2
        c = psycopg2.connect(user=self._user, host=self._host, dbname=self._db_name, password=self._password)
        return c

    def from_psql(self, query):
        con = self.__connection_pool.connect()
        df = pd.read_sql_query(query, con)
        con.close()

        return df

    @property
    def pool(self):
        return self.__connection_pool

    def open_session(self):
        self.session = Session()

    def close_session(self):
        self.session.close()
