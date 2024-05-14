import fs from 'fs'
try { fs.mkdirSync("static_host") } catch{}
try { fs.writeFileSync("static_host/announcement-cache.json", "[]") } catch{}
try { fs.writeFileSync("static_host/banners-cache.json", "[]") } catch{}
try { fs.mkdirSync("static_host/app/doc-thumbnails") } catch{}
try { fs.writeFileSync("/etc/systemd/system/rywld.service", `
[Unit]
Description=RYWL Service
After=network.target
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=1
ExecStart=bash /rywl-fetch-v2/run.sh

[Install]
WantedBy=multi-user.target`) } catch(e) {console.log(e)}