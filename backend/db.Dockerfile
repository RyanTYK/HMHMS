# syntax=docker/dockerfile:1
#
# Bakes mysql-schema.sql into the image so a fresh database self-initializes
# with no host bind-mount required. Compose previously mounted
# ./backend/mysql-schema.sql directly from the host, which only works when
# running from a full source checkout - a bare docker-compose.yml + .env
# (no source, see COMPLETE-SETUP-GUIDE.md's Quick Start) has no such file,
# and Docker silently turns a missing bind-mount source into an empty
# directory, silently skipping schema init entirely.

FROM mariadb:10.11

COPY mysql-schema.sql /docker-entrypoint-initdb.d/01-schema.sql
