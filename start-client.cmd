@echo off
setlocal
cd /d "%~dp0"
set "CLIENT_NODE=%~dp0..\.client-tools\node\node-v24.22.0-win-x64\node.exe"
if exist "%CLIENT_NODE%" (
  "%CLIENT_NODE%" scripts\serve-client.mjs
) else (
  node scripts\serve-client.mjs
)
