import OpenAI from 'openai';
import { BaseAIProvider, AIProviderConfig, DevlogContext, AIResponse } from '../provider.js';
import { logger } from '../../core/logger.js';

/**
 * OpenAI Provider Implementation
 */
export class OpenAIProvider extends BaseAIProvider {
  name = 'OpenAI';
  private client: OpenAI;
  private model: string;

  constructor(config: AIProviderConfig) {
    super(config);

    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey: config.apiKey,
    });

    this.model = config.model || 'gpt-4o-mini';
  }

  async generateDevlog(context: DevlogContext): Promise<AIResponse> {
    try {
      const prompt = this.buildDevlogPrompt(context);

      logger.debug('OpenAI: Generating devlog', `Model: ${this.model}`);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates engaging "build in public" social media posts for indie developers.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.config.temperature ?? 0.7,
        max_tokens: this.config.maxTokens ?? 500,
      });

      const content = response.choices[0]?.message?.content || '';

      return {
        content: content.trim(),
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
        model: this.model,
        provider: this.name,
      };
    } catch (error) {
      logger.error('OpenAI: Failed to generate devlog', String(error));
      throw error;
    }
  }

  async summarizeCommit(message: string, style?: string): Promise<AIResponse> {
    try {
      const prompt = this.buildCommitPrompt(message, style);

      logger.debug('OpenAI: Summarizing commit', `Model: ${this.model}`);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes git commit messages.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.config.temperature ?? 0.5,
        max_tokens: this.config.maxTokens ?? 150,
      });

      const content = response.choices[0]?.message?.content || '';

      return {
        content: content.trim(),
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
        model: this.model,
        provider: this.name,
      };
    } catch (error) {
      logger.error('OpenAI: Failed to summarize commit', String(error));
      throw error;
    }
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }
}
