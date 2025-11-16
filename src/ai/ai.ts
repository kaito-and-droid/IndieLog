import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import { IndieLogConfig } from '../core/config.js';
import { Commit } from '../git/git.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export class AISummarizer {
  private config: IndieLogConfig;
  private openai?: OpenAI;
  private anthropic?: Anthropic;

  constructor(config: IndieLogConfig) {
    this.config = config;

    // Initialize the appropriate AI provider
    if (config.ai.provider === 'openai') {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.error(chalk.red('❌ OPENAI_API_KEY not found in environment'));
        console.log(chalk.dim('Set it in .env file or export it:'));
        console.log(chalk.cyan('export OPENAI_API_KEY=your_key_here'));
        process.exit(1);
      }
      this.openai = new OpenAI({ apiKey });
    } else if (config.ai.provider === 'claude') {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        console.error(chalk.red('❌ ANTHROPIC_API_KEY not found in environment'));
        console.log(chalk.dim('Set it in .env file or export it:'));
        console.log(chalk.cyan('export ANTHROPIC_API_KEY=your_key_here'));
        process.exit(1);
      }
      this.anthropic = new Anthropic({ apiKey });
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

    const prompt = this.buildPrompt(commits);

    try {
      if (this.config.ai.provider === 'openai') {
        return await this.generateWithOpenAI(prompt);
      } else if (this.config.ai.provider === 'claude') {
        return await this.generateWithClaude(prompt);
      }
    } catch (error) {
      console.error(chalk.red('❌ AI generation failed:'), error);
      process.exit(1);
    }

    return '';
  }

  /**
   * Build prompt based on commits and style
   */
  private buildPrompt(commits: Commit[]): string {
    const commitList = commits
      .map((c) => `- ${c.message}`)
      .join('\n');

    const projectName = this.config.projectName;

    const styleInstructions = this.getStyleInstructions();

    return `You are helping an indie developer share their daily progress on social media.

Project: ${projectName}

Today's commits:
${commitList}

${styleInstructions}

Requirements:
- Keep it under 280 characters (X-friendly)
- Use 1-2 relevant emojis
- Include hashtags: #buildinpublic #indiedev
- Make it engaging and authentic
- Focus on what was accomplished, not technical details

Generate the post:`;
  }

  /**
   * Get style-specific instructions
   */
  private getStyleInstructions(): string {
    const style = this.config.ai.promptStyle;

    if (style === 'friendly') {
      return `Write in a warm, approachable tone. Share the progress like you're chatting with a friend. Show enthusiasm and personality.`;
    } else if (style === 'technical') {
      return `Write in a professional, technical tone. Mention specific technologies or approaches. Keep it informative but concise.`;
    } else if (style === 'funny') {
      return `Write with humor and personality. Add a witty comment or self-deprecating joke. Make it entertaining while sharing progress.`;
    }

    return '';
  }

  /**
   * Generate summary using OpenAI
   */
  private async generateWithOpenAI(prompt: string): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    console.log(chalk.blue('🧠 Generating summary with OpenAI...'));

    const response = await this.openai.chat.completions.create({
      model: this.config.ai.model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const summary = response.choices[0]?.message?.content?.trim() || '';
    return summary;
  }

  /**
   * Generate summary using Claude/Anthropic
   */
  private async generateWithClaude(prompt: string): Promise<string> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized');
    }

    console.log(chalk.blue('🧠 Generating summary with Claude...'));

    const response = await this.anthropic.messages.create({
      model: this.config.ai.model,
      max_tokens: 150,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const summary = response.content[0].type === 'text'
      ? response.content[0].text.trim()
      : '';
    
    return summary;
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
