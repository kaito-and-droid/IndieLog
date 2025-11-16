#!/bin/bash
# Example: Local Cron Setup for IndieLog
# This script shows how to set up IndieLog with cron

# Add to crontab with: crontab -e
# Then add one of these lines:

# Daily at 9:00 AM
# 0 9 * * * cd /path/to/your/project && npx indielog publish

# Weekly on Monday at 10:00 AM
# 0 10 * * 1 cd /path/to/your/project && npx indielog publish

# Every 6 hours
# 0 */6 * * * cd /path/to/your/project && npx indielog publish

# With logging
# 0 9 * * * cd /path/to/your/project && npx indielog publish >> /var/log/indielog.log 2>&1

# Make sure environment variables are set:
# export OPENAI_API_KEY=your_key_here
# export X_API_KEY=your_key_here
# ... etc

echo "Add one of the above lines to your crontab"
echo "Run: crontab -e"
