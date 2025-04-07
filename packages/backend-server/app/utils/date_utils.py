from datetime import datetime, timedelta

import pytz


def get_expire_timestamp(ttl, days=None):
    if ttl:
        d = datetime.now() + timedelta(seconds=ttl)
    else:
        d = datetime.now() + timedelta(days=days)
    return pytz.timezone("UTC").localize(d)


def create_timestamp():
    date_time = datetime.now()
    pst = pytz.timezone("UTC")
    date_time = pst.localize(date_time)
    return date_time.isoformat()

