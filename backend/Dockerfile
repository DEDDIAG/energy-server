FROM alpine:3.12.0

# Add requirements first
ADD requirements.txt /work/requirements.txt
# Install requirements
RUN cd /work && \
    apk --no-cache add \
        python3 \
        py3-pip \
        postgresql-libs \
        libstdc++ \
        uwsgi-python3 \
        uwsgi \
        uwsgi-http \
        && \
    pip3 install --no-cache-dir --upgrade pip setuptools && \
    apk add --no-cache --virtual .build-deps \
        build-base \
        postgresql-dev \
        python3-dev \
         && \
    ln -s /usr/include/locale.h /usr/include/xlocale.h && \
    pip3 install --no-cache-dir numpy && \
    pip3 install --no-cache-dir -r requirements.txt && \
    rm -fr /root/.cache && \
    rm /usr/include/xlocale.h && \
    apk del .build-deps

ARG UID=2000
# Analoguous to UID.
ARG GID=2000
ARG USER=jc
ARG GROUP=jc


# add user with homedir
RUN addgroup -S $GROUP -g $GID && adduser -S $USER -G $GROUP -u $UID

# TODO: Installing package does not work with restplus
#       Tracked in Issues-187: https://github.com/noirbizarre/flask-restplus/issues/187
#       > python setup.py install

ADD uwsgi.ini /work/uwsgi.ini
# Add lvs-charts-api
ADD lvscharts /work/lvscharts
RUN chown -R $USER:$GROUP /work

USER $USER
WORKDIR /work

CMD ["uwsgi", "--plugins", "python3,http", "uwsgi.ini"]
