FROM alpine:3.12.0

RUN apk add --no-cache --virtual build-deps curl \
  && apk add --no-cache openssh rsync bash shadow perl \
  && curl -o /usr/bin/rrsync https://download.samba.org/pub/unpacked/rsync/support/rrsync \
  && chmod +x /usr/bin/rrsync \
  && apk del build-deps

ADD myrun.sh /

RUN mkdir /var/run/sshd \
  && chmod 0755 /var/run/sshd

RUN echo -e "PermitRootLogin no\nPasswordAuthentication no\nMaxStartups 100" >> /etc/ssh/sshd_config

EXPOSE 22
CMD ["/myrun.sh"]
