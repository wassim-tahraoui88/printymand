#!/bin/bash

DATE=$(date +"%Y.%m.%d")

COUNT=$(ls . 2>/dev/null | grep "^$DATE-" | wc -l)
NUM=$(printf "%02d" $((COUNT+1)))

read -p "Migration name: " NAME

FILE="${DATE}-${NUM}__${NAME}.sql"

touch "$FILE"

git add "$FILE"