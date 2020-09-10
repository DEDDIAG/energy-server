# LVS Charts API

## Install
For setup see [lvs-charts-docker](https://inf-git.fh-rosenheim.de/lv/lvs-ext-docker) repository

## Add Database User
```
createuser -W -R -P -D new_user -U postgres
```
```
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO remote;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO remote;
```
