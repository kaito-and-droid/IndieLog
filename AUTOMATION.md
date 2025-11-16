# Automation Guide

This guide shows how to automate IndieLog to post your daily development updates automatically.

## Table of Contents

- [GitHub Actions (Recommended)](#github-actions-recommended)
- [Local Cron Jobs](#local-cron-jobs)
- [Docker Automation](#docker-automation)
- [Custom Scheduling](#custom-scheduling)

---

## GitHub Actions (Recommended)

GitHub Actions is the easiest way to automate IndieLog. It runs in the cloud, requires no local setup, and is free for public repositories.

### Setup Steps

1. **Copy the workflow file to your project:**

```bash
mkdir -p .github/workflows
cp node_modules/indielog/.github/workflows/daily-post.yml .github/workflows/
```

Or create `.github/workflows/daily-post.yml` manually:

```yaml
name: IndieLog Daily Post

on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM UTC daily
  workflow_dispatch:

jobs:
  post-update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npx indielog run
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          X_API_KEY: ${{ secrets.X_API_KEY }}
          X_API_SECRET: ${{ secrets.X_API_SECRET }}
          X_ACCESS_TOKEN: ${{ secrets.X_ACCESS_TOKEN }}
          X_ACCESS_SECRET: ${{ secrets.X_ACCESS_SECRET }}
```

2. **Add secrets to your GitHub repository:**

Go to: `Settings > Secrets and variables > Actions > New repository secret`

Add these secrets:
- `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`)
- `X_API_KEY`
- `X_API_SECRET`
- `X_ACCESS_TOKEN`
- `X_ACCESS_SECRET`

3. **Push to GitHub:**

```bash
git add .github/workflows/daily-post.yml indielog.config.json
git commit -m "Add IndieLog automation"
git push
```

4. **Test the workflow:**

Go to: `Actions > IndieLog Daily Post > Run workflow`

Click "Run workflow" to test manually before the scheduled run.

### Scheduling Options

The cron expression `'0 9 * * *'` runs at 9 AM UTC daily. Customize it:

```yaml
# Every day at 9 AM UTC
- cron: '0 9 * * *'

# Every weekday at 5 PM UTC
- cron: '0 17 * * 1-5'

# Twice daily (9 AM and 5 PM UTC)
schedule:
  - cron: '0 9 * * *'
  - cron: '0 17 * * *'

# Weekly on Monday at 9 AM UTC
- cron: '0 9 * * 1'
```

**Cron syntax:** `minute hour day month weekday`

Use [crontab.guru](https://crontab.guru) to generate cron expressions.

### Advanced: Conditional Posting

Only post if there are commits:

```yaml
- name: Check for commits
  id: check
  run: |
    if [ $(git log --since="24 hours ago" --oneline | wc -l) -eq 0 ]; then
      echo "skip=true" >> $GITHUB_OUTPUT
    fi

- name: Run IndieLog
  if: steps.check.outputs.skip != 'true'
  run: npx indielog run
```

---

## Local Cron Jobs

For local development or self-hosted automation.

### Linux/macOS

1. **Create a wrapper script:**

```bash
#!/bin/bash
# ~/indielog-daily.sh

cd /path/to/your/project
source .env
npx indielog run --since today >> ~/indielog.log 2>&1
```

2. **Make it executable:**

```bash
chmod +x ~/indielog-daily.sh
```

3. **Add to crontab:**

```bash
crontab -e
```

Add this line:

```bash
# Run daily at 9 AM
0 9 * * * /home/youruser/indielog-daily.sh
```

4. **Test it:**

```bash
./indielog-daily.sh
```

### Windows Task Scheduler

1. **Create a batch script:**

```batch
@echo off
cd C:\path\to\your\project
call npx indielog run --since today >> C:\indielog.log 2>&1
```

2. **Open Task Scheduler:**
   - Search "Task Scheduler" in Windows
   - Click "Create Basic Task"
   - Name: "IndieLog Daily Post"
   - Trigger: Daily at 9 AM
   - Action: Start a program
   - Program: `C:\path\to\indielog-daily.bat`

---

## Docker Automation

Run IndieLog in a container with scheduled execution.

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build
RUN npm run build

# Run at container start
CMD ["npx", "indielog", "run"]
```

### docker-compose.yml with scheduling

```yaml
version: '3.8'

services:
  indielog:
    build: .
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - X_API_KEY=${X_API_KEY}
      - X_API_SECRET=${X_API_SECRET}
      - X_ACCESS_TOKEN=${X_ACCESS_TOKEN}
      - X_ACCESS_SECRET=${X_ACCESS_SECRET}
    volumes:
      - .:/app
    restart: unless-stopped

  # Use a cron container to trigger IndieLog
  cron:
    image: alpine:latest
    command: sh -c "while true; do sleep 86400; docker-compose run indielog; done"
    restart: unless-stopped
```

### Run with Docker

```bash
docker-compose build
docker-compose up -d
```

---

## Custom Scheduling

### Node.js with node-cron

For advanced scheduling logic in Node.js:

```bash
npm install node-cron
```

Create `scheduler.js`:

```javascript
import cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Run daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running IndieLog...');

  try {
    const { stdout, stderr } = await execAsync('npx indielog run');
    console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    console.error('IndieLog failed:', error);
  }
});

console.log('IndieLog scheduler started');
```

Run with:

```bash
node scheduler.js
```

Keep it running with PM2:

```bash
npm install -g pm2
pm2 start scheduler.js --name indielog-scheduler
pm2 save
pm2 startup
```

---

## Best Practices

### 1. Test with Dry Run First

Always test with `--dry-run` before enabling automation:

```bash
npx indielog run --dry-run --since today
```

### 2. Monitor Logs

Check logs regularly to ensure posts are successful:

```bash
# GitHub Actions
# Go to Actions tab > Select workflow run

# Local cron
tail -f ~/indielog.log

# Docker
docker-compose logs -f indielog
```

### 3. Handle Errors Gracefully

Add error notifications to your workflow:

```yaml
- name: Notify on failure
  if: failure()
  run: |
    echo "IndieLog failed! Check the logs."
    # Add notification service (email, Slack, etc.)
```

### 4. Adjust Timing for Your Timezone

Convert UTC to your local timezone:

```bash
# If you want 9 AM EST (UTC-5)
# Use: 14 (9 + 5) in cron
- cron: '0 14 * * *'

# If you want 9 AM PST (UTC-8)
# Use: 17 (9 + 8) in cron
- cron: '0 17 * * *'
```

### 5. Backup Configurations

Keep your config and secrets backed up securely:

```bash
# Config
git add indielog.config.json

# Secrets (DON'T commit to git!)
# Store in password manager or environment variables
```

---

## Troubleshooting

### "No commits found" message

This means no commits were made since the specified time. Adjust `--since`:

```bash
# Try yesterday instead of today
npx indielog run --since yesterday

# Or last 7 days
npx indielog run --since "7 days ago"
```

### API rate limits

If you hit rate limits:

1. Reduce posting frequency
2. Check your API usage quotas
3. Consider upgrading API plans if needed

### GitHub Actions not triggering

1. Ensure workflow file is in `.github/workflows/`
2. Check that secrets are added correctly
3. Verify cron syntax at [crontab.guru](https://crontab.guru)
4. GitHub requires at least one commit in the last 60 days

---

## Examples

### Weekly Summary (Mondays at 9 AM)

```yaml
on:
  schedule:
    - cron: '0 9 * * 1'  # Monday
```

```bash
npx indielog run --since "7 days ago"
```

### End-of-Day Update (5 PM)

```yaml
on:
  schedule:
    - cron: '0 17 * * *'  # 5 PM UTC
```

### Multiple Platforms

Enable in `indielog.config.json`:

```json
{
  "publishers": {
    "x": { "enabled": true },
    "reddit": { "enabled": true },
    "devto": { "enabled": true }
  }
}
```

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/kaito-and-droid/indielog/issues
- Documentation: https://github.com/kaito-and-droid/indielog
