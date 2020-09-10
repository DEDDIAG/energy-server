from flask_restplus import fields


class UtcDateTime(fields.DateTime):
    def format_iso8601(self, dt):
        '''
        Turn a datetime object into an ISO8601 formatted date including the UTC Z

        :param datetime dt: The datetime to transform
        :return: A ISO 8601 formatted date string
        '''
        return dt.isoformat() + 'Z'
