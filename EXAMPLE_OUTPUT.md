# Example Output

This document shows example outputs from running IndieLog with the polished Day 6 UX.

## Initialize Project

```bash
$ npx indielog init
```

```
🎉 Initialize IndieLog
══════════════════════════════════════════════════

✅ Created config file /path/to/indielog.config.json

ℹ️ Next steps:
  1. Edit indielog.config.json with your project details
  2. Set up API keys in .env file
  3. Run: npx indielog run --dry-run
  4. When ready: npx indielog run

📚 Documentation: https://github.com/kaito-and-droid/IndieLog
```

## Dry Run (Preview Mode)

```bash
$ npx indielog run --dry-run --since today
```

```
🚀 IndieLog Pipeline
══════════════════════════════════════════════════

⚠️ Dry run mode - no posts will be published

🔹 Loading configuration...
✅ Loaded config: /path/to/indielog.config.json

📋 Configuration:
──────────────────────────────────────────────────
Project: MyProject
Source: git (.)
AI: openai/gpt-4o-mini [friendly]
Publishers: none enabled
──────────────────────────────────────────────────

🔹 Fetching commits from git...
🧩 3 commits found:

  • Implemented git integration with simple-git
    1dd67a6 by IndieLog Dev on 11/13/2025
  • Added config validation with Zod schemas
    52229fe by IndieLog Dev on 11/13/2025
  • Initial commit: Project setup with TypeScript and CLI framework
    2234d0e by IndieLog Dev on 11/13/2025

🔹 Generating AI summary...

📝 AI Generated Summary:
──────────────────────────────────────────────────
Day 1 of MyProject is in the books! 🎉 Set up the foundation
with TypeScript, added config validation with Zod, and got git
integration working. Feeling great about this progress!
#buildinpublic #indiedev
──────────────────────────────────────────────────
Length: 213 characters

✅ Dry run completed!
Run without --dry-run to publish to your platforms.

✨ Pipeline Summary
──────────────────────────────────────────────────
Commits processed: 3
Summary length: 213 characters
Published to: none (dry run)
Total time: 2.35s
──────────────────────────────────────────────────

✅ Pipeline completed successfully!
```

## Publishing to X (Full Run)

```bash
$ npx indielog run --since today
```

```
🚀 IndieLog Pipeline
══════════════════════════════════════════════════

🔹 Loading configuration...
✅ Loaded config: /path/to/indielog.config.json

📋 Configuration:
──────────────────────────────────────────────────
Project: MyProject
Source: git (.)
AI: openai/gpt-4o-mini [friendly]
Publishers: twitter
──────────────────────────────────────────────────

🔹 Fetching commits from git...
🧩 3 commits found:

  • Implemented git integration with simple-git
    1dd67a6 by IndieLog Dev on 11/13/2025
  • Added config validation with Zod schemas
    52229fe by IndieLog Dev on 11/13/2025
  • Initial commit: Project setup with TypeScript and CLI framework
    2234d0e by IndieLog Dev on 11/13/2025

🔹 Generating AI summary...

📝 AI Generated Summary:
──────────────────────────────────────────────────
Day 1 of MyProject is in the books! 🎉 Set up the foundation
with TypeScript, added config validation with Zod, and got git
integration working. Feeling great about this progress!
#buildinpublic #indiedev
──────────────────────────────────────────────────
Length: 213 characters

🔹 Publishing to platforms...

🚀 Publishing to platforms...

Publishing to X...
✅ Posted to X: https://x.com/i/web/status/1234567890

✨ Publishing completed!

📊 Published to:
  • X: https://x.com/i/web/status/1234567890

✨ Pipeline Summary
──────────────────────────────────────────────────
Commits processed: 3
Summary length: 213 characters
Published to: Twitter
Total time: 3.87s
──────────────────────────────────────────────────

✅ Pipeline completed successfully!
```

## Different Prompt Styles

### Friendly Style
```json
{
  "ai": {
    "promptStyle": "friendly"
  }
}
```

Output: "Day 1 of MyProject is in the books! 🎉 Set up the foundation with TypeScript, added config validation with Zod, and got git integration working. Feeling great about this progress! #buildinpublic #indiedev"

### Technical Style
```json
{
  "ai": {
    "promptStyle": "technical"
  }
}
```

Output: "MyProject v0.1: Implemented TypeScript + Node.js CLI with Zod schema validation, simple-git integration for commit tracking. Config-driven architecture ready for extension. #buildinpublic #indiedev"

### Funny Style
```json
{
  "ai": {
    "promptStyle": "funny"
  }
}
```

Output: "Started MyProject today! 😅 Spent 3 hours setting up TypeScript (classic), added validation because I don't trust past-me, and now git tracks my mistakes automatically. Progress! #buildinpublic #indiedev"

## Error States

### Missing API Key
```
❌ OPENAI_API_KEY not found in environment
Set it in .env file or export it:
export OPENAI_API_KEY=your_key_here
```

### No Git Repository
```
❌ Not a git repository: /path/to/project
Initialize git with: git init
```

### No Commits Found
```
📦 Fetching commits...
⚠️  No commits found

No commits to process. Exiting.
```

### Invalid Config
```
❌ Config validation failed:
  • sources.type - Invalid option: expected one of "git"|"github"
  • ai.promptStyle - Invalid option: expected one of "friendly"|"technical"|"funny"

Please fix your config file and try again.
```
