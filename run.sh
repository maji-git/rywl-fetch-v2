#!/bin/bash

cd /rywl-fetch-v2/
sudo git reset --hard HEAD~1
sudo git pull
node /rywl-fetch-v2/index.js