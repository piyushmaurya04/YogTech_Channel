@echo off
REM YogTech Auto-Fetch Videos Script
REM This script automatically fetches videos from your YouTube channel
REM and updates videos.json
REM
REM Run this script anytime you upload a new video to fetch the latest!

cd /d "%~dp0"
node fetch-videos.js UCZQQ2qXXBpO7wwSfwX_8vFg
pause
