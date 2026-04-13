#!/bin/bash
set -e
psql -v ON_ERROR_STOP=1 --username "userexample" --dbname "exampledb" <<-EOSQL
    CREATE DATABASE testdb;
EOSQL
