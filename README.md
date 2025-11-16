# IndieLog

Open Devlog Automation Tool - Build in public, automated.

> Automatically share your daily dev progress on social media. Fetch commits, generate AI summaries, and post to X/Twitter, Reddit, and Bluesky — all in one command.

## Features

### Core Pipeline
- 🚀 **Automated Pipeline** - One command to fetch, summarize, and publish
- 📦 **Git Integration** - Automatically fetches commits with detailed file change analysis
- 🧠 **Multi-AI Support** - OpenAI, Claude, or Local LLaMA/Ollama
- 🎨 **Three Prompt Styles** - Friendly, Technical, or Funny tone
- 🌐 **Multi-Platform Publishing** - X/Twitter, Reddit, and Bluesky
- ⚙️ **Flexible Config** - Supports both YAML and JSON
- 🔒 **Type-Safe** - Built with TypeScript and Zod validation

### Advanced Features
- 🎯 **Job Queue System** - Daily, weekly, and manual job scheduling
- 📊 **JSON Logging** - Persistent job history with rotation
- 🔄 **Retry Logic** - Automatic retry with exponential backoff
- 🛑 **Cancellation Support** - Cancel running jobs gracefully
- 🌐 **REST API** - Full HTTP API with SSE (Server-Sent Events)
- ✨ **Beautiful CLI** - Emoji-rich logging with progress tracking
- 🏃 **Dry Run Mode** - Preview before publishing
- ⏱️ **Performance Metrics** - Track pipeline execution time

## Installation

```bash
npm install -g indielog
```

Or use locally:

```bash
git clone <repo-url>
cd IndieLog
npm install
npm run build
```

## Quick Start

### 1. Initialize Configuration

```bash
npx indielog init
```

This creates `indielog.config.yaml` (or `.json`) with default settings.

### 2. Set Up Environment Variables

Create a `.env` file in your project root:

```bash
# AI Provider (choose one)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# For X/Twitter (if enabled)
X_API_KEY=your_api_key
X_API_SECRET=your_api_secret
X_ACCESS_TOKEN=your_access_token
X_ACCESS_SECRET=your_access_secret

# For Reddit (if enabled)
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USERNAME=your_username
REDDIT_PASSWORD=your_password
REDDIT_SUBREDDIT=your_subreddit

# For Bluesky (if enabled)
BLUESKY_HANDLE=your.handle.bsky.social
BLUESKY_PASSWORD=your_password
```

### 3. Run Your First Devlog

```bash
# Preview without publishing
npx indielog preview

# Publish to configured platforms
npx indielog publish
```

## CLI Commands

### Core Commands

```bash
# Initialize config file
indielog init

# Preview devlog (no publishing)
indielog preview [options]

# Publish devlog to platforms
indielog publish [options]

# Generate automation workflows
indielog schedule [options]

# Start REST API server
indielog server [options]

# Legacy run command (use publish instead)
indielog run [options]
```

### Command Options

#### Preview Command
```bash
indielog preview [options]

Options:
  --config <path>     Custom config file path
  --since <date>      Get commits since date (default: "today")
  --style <style>     Override prompt style (friendly|technical|funny)
```

#### Publish Command
```bash
indielog publish [options]

Options:
  --config <path>      Custom config file path
  --since <date>       Get commits since date
  --platforms <list>   Comma-separated platform list (e.g., "x,reddit")
  --save-output        Save generated summary to file
```

#### Schedule Command
```bash
indielog schedule [options]

Options:
  --type <type>       Schedule type: github-actions|cron (default: "github-actions")
  --frequency <freq>  daily|weekly (default: "daily")
  --time <time>       Time to run (e.g., "09:00") (default: "09:00")
  --output <path>     Output file path
```

#### Server Command
```bash
indielog server [options]

Options:
  --port <port>       Server port (default: 3000)
  --host <host>       Server host (default: "localhost")
  --config <path>     Custom config file path
```

### Date Filtering Examples

```bash
# Get today's commits (default)
indielog publish

# Get commits since yesterday
indielog publish --since yesterday

# Get commits from last 7 days
indielog publish --since "7 days ago"

# Get commits since specific date
indielog publish --since 2024-11-01

# Preview with custom date range
indielog preview --since "3 days ago"
```

Supported date formats:
- `today` - Commits from today
- `yesterday` - Commits from yesterday
- `X days ago` - Relative days (e.g., "7 days ago")
- `X weeks ago` - Relative weeks (e.g., "2 weeks ago")
- `X months ago` - Relative months (e.g., "1 month ago")
- ISO date format (e.g., `2024-11-01`)

## Configuration

IndieLog supports both **YAML** and **JSON** config files.

### YAML Example (`indielog.config.yaml`)

```yaml
projectName: "MyAwesomeProject"

sources:
  type: git
  path: "."  # Current directory

ai:
  provider: openai  # Options: openai, claude, llama, ollama
  model: gpt-4o-mini
  promptStyle: friendly  # Options: friendly, technical, funny

  # Optional AI settings
  temperature: 0.7
  maxTokens: 500

  # For local Llama/Ollama only
  # baseUrl: http://localhost:11434/v1

publishers:
  x:
    enabled: true
    maxRetries: 3
    retryDelay: 1000  # milliseconds

  reddit:
    enabled: false
    maxRetries: 3
    retryDelay: 1000

  bluesky:
    enabled: false
    maxRetries: 3
    retryDelay: 1000
```

### JSON Example (`indielog.config.json`)

```json
{
  "projectName": "MyAwesomeProject",
  "sources": {
    "type": "git",
    "path": "."
  },
  "ai": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "promptStyle": "friendly",
    "temperature": 0.7,
    "maxTokens": 500
  },
  "publishers": {
    "x": {
      "enabled": true,
      "maxRetries": 3,
      "retryDelay": 1000
    },
    "reddit": {
      "enabled": false
    },
    "bluesky": {
      "enabled": false
    }
  }
}
```

### Configuration Options

#### AI Providers

**OpenAI**
```yaml
ai:
  provider: openai
  model: gpt-4o-mini  # or gpt-4, gpt-3.5-turbo
  temperature: 0.7
  maxTokens: 500
```

**Claude/Anthropic**
```yaml
ai:
  provider: claude
  model: claude-3-5-sonnet-20241022  # or other Claude models
  temperature: 0.7
  maxTokens: 500
```

**Local LLaMA/Ollama**
```yaml
ai:
  provider: ollama  # or llama
  model: llama2  # or your local model name
  baseUrl: http://localhost:11434/v1
  temperature: 0.7
  maxTokens: 500
```

#### Publisher Settings

Each publisher supports:
- `enabled` - Enable/disable the publisher
- `maxRetries` - Number of retry attempts (default: 3)
- `retryDelay` - Delay between retries in ms (default: 1000)

### AI Prompt Styles

Choose a style that matches your personality:

**Friendly** (default)
- Warm, approachable tone
- Like chatting with a friend
- Shows enthusiasm and personality

Example: *"Day 12 building MyProject ☕️ Added smooth animations and fixed some annoying bugs. Feeling productive today! #buildinpublic #indiedev"*

**Technical**
- Professional, informative tone
- Mentions specific technologies
- Clear and concise

Example: *"MyProject update: Implemented Zod schema validation, integrated simple-git for commit tracking. TypeScript + Node.js pipeline running smoothly. #buildinpublic #indiedev"*

**Funny**
- Humorous and entertaining
- Self-deprecating jokes welcome
- Makes progress sharing fun

Example: *"Another day of pretending I know what I'm doing 😅 Fixed 3 bugs, created 2 new ones, called it 'refactoring'. MyProject is somehow still working! #buildinpublic #indiedev"*

## Platform Setup

### X/Twitter Setup

1. Go to https://developer.twitter.com/
2. Create a new app (or use existing)
3. Enable OAuth 1.0a with Read and Write permissions
4. Generate API keys and access tokens
5. Add to your `.env`:

```bash
X_API_KEY=your_api_key
X_API_SECRET=your_api_secret
X_ACCESS_TOKEN=your_access_token
X_ACCESS_SECRET=your_access_secret
```

### Reddit Setup

1. Go to https://www.reddit.com/prefs/apps
2. Create a new app (script type)
3. Get your client ID and secret
4. Add to your `.env`:

```bash
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USERNAME=your_username
REDDIT_PASSWORD=your_password
REDDIT_SUBREDDIT=your_target_subreddit
```

### Bluesky Setup

1. Create an account at https://bsky.app
2. Generate an app password in settings
3. Add to your `.env`:

```bash
BLUESKY_HANDLE=your.handle.bsky.social
BLUESKY_PASSWORD=your_app_password
```

## Automation

Automate IndieLog to post daily/weekly without manual intervention.

### GitHub Actions (Recommended)

1. Generate workflow file:

```bash
indielog schedule --type github-actions --frequency daily --time "09:00"
```

This creates `.github/workflows/indielog-daily.yml`

2. Add secrets to your GitHub repository:
   - Settings → Secrets and variables → Actions → New repository secret
   - Add: `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`)
   - Add: `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET`
   - Add other platform credentials as needed

3. Push to GitHub and enable Actions

The workflow will run automatically on schedule. You can also trigger it manually from the Actions tab.

### Local Cron (Linux/macOS)

1. Generate cron command:

```bash
indielog schedule --type cron --frequency daily --time "09:00"
```

2. Edit crontab:

```bash
crontab -e
```

3. Add the generated line (example):

```bash
0 9 * * * cd /path/to/project && npx indielog publish >> ~/indielog.log 2>&1
```

### Manual Trigger

For testing or one-off posts:

```bash
# From GitHub Actions UI:
# Actions → IndieLog Daily Post → Run workflow

# Or locally:
npx indielog publish --since "yesterday"
```

## REST API

Start the API server to integrate IndieLog with other tools:

```bash
indielog server --port 3000
```

### API Endpoints

#### System Status
```http
GET /api/status
```

Returns system status, queue stats, and recent jobs.

#### Job Execution
```http
POST /api/run
Content-Type: application/json

{
  "since": "today",
  "dryRun": true
}
```

```http
POST /api/publish
Content-Type: application/json

{
  "since": "today",
  "platforms": ["x", "reddit"]
}
```

#### Logs
```http
GET /api/logs?limit=100&job=job_123
```

Real-time logs with Server-Sent Events:
```http
GET /api/logs/live
```

#### Configuration
```http
GET /api/config

POST /api/config
Content-Type: application/json

{
  "projectName": "MyProject",
  "ai": { ... },
  "publishers": { ... }
}
```

#### Project Management
```http
GET /api/projects

POST /api/projects/select
Content-Type: application/json

{
  "path": "/path/to/project"
}
```

### Example API Usage

```javascript
// Trigger a publish job
const response = await fetch('http://localhost:3000/api/publish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    since: 'today',
    platforms: ['x']
  })
});

const result = await response.json();
console.log(result);
// { success: true, jobId: "job_123", ... }
```

## Architecture

IndieLog is built with a modular, plugin-based architecture:

```
src/
├── cli/          # CLI commands (preview, publish, schedule, server)
├── core/         # Core utilities (config, logger, errors)
├── git/          # Git integration and scanner
├── ai/           # AI provider system (OpenAI, Claude, Llama)
├── publisher/    # Publisher plugins (X, Reddit, Bluesky)
├── jobs/         # Job queue and runner system
├── api/          # REST API server and routes
└── storage/      # Data persistence (logs, status)
```

### Plugin System

**AI Providers**: Implement the `AIProvider` interface to add new AI providers.

**Publishers**: Extend the `Publisher` abstract class to add new platforms.

See examples in:
- `src/ai/providers/` - AI provider implementations
- `src/publisher/publishers/` - Publisher implementations

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Run compiled version
npm start

# Test build
npm test
```

### Project Structure

```
IndieLog/
├── src/                 # TypeScript source code
├── dist/                # Compiled JavaScript (generated)
├── examples/            # Example configs and workflows
├── .github/workflows/   # GitHub Actions (generated)
├── .indielog/           # Runtime data (logs, status)
│   ├── logs/            # Job execution logs
│   └── status/          # Job status files
├── indielog.config.yaml # Your configuration
└── .env                 # Environment variables
```

## Examples

See the `examples/` directory for:
- **config-example.yaml** - Full configuration example
- **github-actions-daily.yml** - GitHub Actions workflow
- **crontab-example.sh** - Local cron setup

## Troubleshooting

### No commits found
```bash
# Check git history
git log --since="today"

# Try a wider date range
indielog preview --since "7 days ago"
```

### AI provider errors
```bash
# Verify API key is set
echo $OPENAI_API_KEY

# Test with different model
# Edit config: model: "gpt-3.5-turbo"
```

### Publisher failures
```bash
# Check credentials in .env
cat .env | grep X_

# Test with dry run first
indielog preview

# Enable verbose logging (coming soon)
```

### GitHub Actions not running
1. Check workflow file syntax
2. Verify secrets are set in repository settings
3. Check Actions tab for error messages
4. Ensure Actions are enabled for the repository

## Contributing

Contributions welcome! Areas for improvement:
- Additional AI providers (Gemini, Cohere, etc.)
- More publishers (LinkedIn, Mastodon, Dev.to)
- Enhanced scheduling options
- Web UI dashboard
- Analytics and metrics

## Roadmap

- [ ] LinkedIn publisher
- [ ] Mastodon publisher
- [ ] Dev.to publisher
- [ ] Web UI dashboard
- [ ] Analytics and insights
- [ ] Template system for posts
- [ ] Media attachment support
- [ ] Multi-project management
- [ ] Webhook integrations

## License

MIT

## Credits

Built for indie developers, by indie developers. 🚀

Special thanks to the open-source community for the amazing tools that made this possible.
