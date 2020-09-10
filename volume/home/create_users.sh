#!/bin/bash

set -e

while IFS=, read HOUSE RSA
do
    echo -n "$HOUSE"
    if ! id "$HOUSE" > /dev/null 2>&1
    then
        adduser -D -g '' $HOUSE
        usermod -p "*" $HOUSE
        mkdir -p /home/$HOUSE/.ssh
        mkdir -p /home/$HOUSE/data
        echo "command=\"/usr/bin/rrsync /home/$HOUSE/data\",no-agent-forwarding,no-port-forwarding,no-pty,no-user-rc,no-X11-forwarding $RSA" > /home/$HOUSE/.ssh/authorized_keys

        chown -R $HOUSE:$HOUSE /home/$HOUSE/.ssh/ && chmod -R go-rwx /home/$HOUSE/.ssh/
        chown -R $HOUSE:$HOUSE /home/$HOUSE/data/ && chmod -R go-rwx /home/$HOUSE/data/
        echo " created"
    else
        echo " already exists"
    fi
done < /home/users.conf

