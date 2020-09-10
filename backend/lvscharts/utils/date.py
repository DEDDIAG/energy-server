import iso8601
ISO8601_FMT = '%Y-%m-%dT%H:%M:%S'


def is_iso8601(date_string):
    try:
        iso8601.parse_date(date_string)
        return True
    except iso8601.ParseError:
        pass
    return False
