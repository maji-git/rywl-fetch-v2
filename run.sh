#!/bin/bash

cd /rywl-fetch-v2/
sudo git fetch --all
sudo git reset --hard origin/main
sudo git pull
node /rywl-fetch-v2/index.js