import chalk from 'chalk';
import { IndieLogConfig } from '../core/config.js';
import { Commit } from '../git/git.js';
import { BaseAIProvider, AIProviderConfig } from './provider.js';
import { OpenAIProvider } from './providers/openai.js';
import { ClaudeProvider } from './providers/claude.js';
import { LlamaProvider } from './providers/llama.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export class AISummarizer {
  private config: IndieLogConfig;
  private provider: BaseAIProvider;

  constructor(config: IndieLogConfig) {
    this.config = config;

    // Get API key from environment (only required for cloud providers)
    let apiKey: string | undefined;
    if (config.ai.provider === 'openai') {
      apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.error(chalk.red('❌ OPENAI_API_KEY not found in environment'));
        console.log(chalk.dim('Set it in .env file or export it:'));
        console.log(chalk.cyan('export OPENAI_API_KEY=your_key_here'));
        process.exit(1);
      }
    } else if (config.ai.provider === 'claude') {
      apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        console.error(chalk.red('❌ ANTHROPIC_API_KEY not found in environment'));
        console.log(chalk.dim('Set it in .env file or export it:'));
        console.log(chalk.cyan('export ANTHROPIC_API_KEY=your_key_here'));
        process.exit(1);
      }
    }
    // Note: llama/ollama don't require API keys

    // Build provider config
    const providerConfig: AIProviderConfig = {
      apiKey,
      model: config.ai.model,
      baseUrl: config.ai.baseUrl,
      temperature: config.ai.temperature,
      maxTokens: config.ai.maxTokens,
    };

    // Initialize the appropriate AI provider
    if (config.ai.provider === 'openai') {
      this.provider = new OpenAIProvider(providerConfig);
    } else if (config.ai.provider === 'claude') {
      this.provider = new ClaudeProvider(providerConfig);
    } else if (config.ai.provider === 'llama' || config.ai.provider === 'ollama') {
      this.provider = new LlamaProvider(providerConfig);
    } else {
      throw new Error(`Unsupported AI provider: ${config.ai.provider}`);
    }
  }

  /**
   * Generate a summary of commits using AI
   * @param commits Array of commits to summarize
   * @returns Generated post text
   */
  async generateSummary(commits: Commit[]): Promise<string> {
    if (commits.length === 0) {
      return '';
    }

    try {
      console.log(chalk.blue(`🧠 Generating summary with ${this.provider.name}...`));

      // Convert commits to DevlogContext
      const context = {
        commits: commits.map(c => ({
          hash: c.hash,
          message: c.message,
          author: c.author,
          date: c.date,
        })),
        projectName: this.config.projectName,
        style: this.config.ai.promptStyle,
        platform: 'X/Twitter',
      };

      const response = await this.provider.generateDevlog(context);
      return response.content;
    } catch (error) {
      console.error(chalk.red('❌ AI generation failed:'), error);
      throw error;
    }
  }

  /**
   * Display the generated summary
   */
  static display(summary: string): void {
    console.log();
    console.log(chalk.cyan('📝 AI Generated Summary:'));
    console.log(chalk.dim('─'.repeat(50)));
    console.log(chalk.white(summary));
    console.log(chalk.dim('─'.repeat(50)));
    console.log(chalk.dim(`Length: ${summary.length} characters`));
    console.log();
  }
}
