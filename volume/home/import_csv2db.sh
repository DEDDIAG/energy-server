#!/bin/bash

set -e

TP_LINK_REGEX=^tplink_smarthome_tplink_hs110_[0-9a-fA-F]{40}_power$
MODBUS_REGEX=^modbussmartmeter_modbus_[0-9a-fA-F]{8}_phase$

shopt -s nullglob # no empty directories
chmod -R 755 `ls -d /home/house*`

# /home/{house}/data/{item_name}/{filename}.csv
for filename in /home/*/data/**/*.csv
do
    if [ -f ${filename} ]
    then
        item_name=$(echo ${filename} | awk '{split($0,a,"/"); print a[5]}')
        path=$(dirname ${filename})
        house_name=$(echo ${filename} | awk '{split($0,a,"/"); print a[3]}')
        house_number=$(echo ${house_name} | tr -dc '0-9') # escape house from house9999 -> result: 9999

        if ! [[ ${item_name} =~ ${TP_LINK_REGEX} ||  ${item_name} =~ ${MODBUS_REGEX} ]]
        then
            echo "WARNING: REGEX does not match for ${item_name}"
            continue
        fi

        filename_short=${filename%.csv} # delete the path
        checksum=$(echo "${filename_short##*/}")
        set +e
        # very important!! TWO SPACES between checksum and filename
        echo "${checksum}  ${filename}" | sha1sum -c -s -
        state="$?" #0 or 1

        if [ "${state}" -ne 0 ]
        then
            >&2 echo "file [ \"${filename}\" ] has an invalid checksum, skipping to next file"
            continue
        fi

        meta=$(<"${path}/meta.json")
        meta=$(echo ${meta} | tr -d "'") # escapes all high comma in JSON-String to prevent SQL-Injection

        echo "SELECT import_CSV('${filename}', '${item_name}', ${house_number}, '${meta}')" | psql -U postgres -v "ON_ERROR_STOP=1"
        state="$?"

        if [ "${state}" -ne 0 ]
        then
            >&2 echo "Error importing data into database [ \"${filename}\" ]"
            continue
        fi
        rm ${filename}
    fi
done

echo "Update item_view";
echo "SELECT create_items_view();" | psql -U postgres

