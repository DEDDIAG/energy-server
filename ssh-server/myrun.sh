#!/bin/bash

set -e

function create_key {
    key_type=$1
    key_file=/etc/ssh/ssh_host_${key_type}_key
    if [ ! -f "${key_file}" ]; then
        ssh-keygen -t ${key_type} -f ${key_file}
    fi
}

create_key rsa
create_key dsa
create_key ecdsa
create_key ed25519

/home/create_users.sh
exec /usr/sbin/sshd -eD

