@echo off
REM Backup wrapper invoked by Task Scheduler every 12h.
cd /d "C:\Users\YUNE\Desktop\To-do APP v.2"
"C:\Program Files\nodejs\node.exe" "scripts\backup.mjs" >> "scripts\backup.log" 2>&1
