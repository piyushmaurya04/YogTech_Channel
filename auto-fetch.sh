#!/bin/bash
# YogTech Auto-Fetch Videos Script (Linux/Mac)
# This script automatically fetches videos from your YouTube channel
# and updates videos.json
#
# Run this script anytime you upload a new video to fetch the latest!
# chmod +x auto-fetch.sh
# ./auto-fetch.sh

cd "$(dirname "$0")"
node fetch-videos.js UCZQQ2qXXBpO7wwSfwX_8vFg
