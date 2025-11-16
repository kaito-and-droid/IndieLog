import Anthropic from '@anthropic-ai/sdk';
import { BaseAIProvider, AIProviderConfig, DevlogContext, AIResponse } from '../provider.js';
import { logger } from '../../core/logger.js';

/**
 * Claude (Anthropic) Provider Implementation
 */
export class ClaudeProvider extends BaseAIProvider {
  name = 'Claude';
  private client: Anthropic;
  private model: string;

  constructor(config: AIProviderConfig) {
    super(config);

    if (!config.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    this.client = new Anthropic({
      apiKey: config.apiKey,
    });

    this.model = config.model || 'claude-3-5-haiku-20241022';
  }

  async generateDevlog(context: DevlogContext): Promise<AIResponse> {
    try {
      const prompt = this.buildDevlogPrompt(context);

      logger.debug('Claude: Generating devlog', `Model: ${this.model}`);

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.config.maxTokens ?? 500,
        temperature: this.config.temperature ?? 0.7,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0]?.type === 'text' ? response.content[0].text : '';

      return {
        content: content.trim(),
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        model: this.model,
        provider: this.name,
      };
    } catch (error) {
      logger.error('Claude: Failed to generate devlog', String(error));
      throw error;
    }
  }

  async summarizeCommit(message: string, style?: string): Promise<AIResponse> {
    try {
      const prompt = this.buildCommitPrompt(message, style);

      logger.debug('Claude: Summarizing commit', `Model: ${this.model}`);

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.config.maxTokens ?? 150,
        temperature: this.config.temperature ?? 0.5,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0]?.type === 'text' ? response.content[0].text : '';

      return {
        content: content.trim(),
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        model: this.model,
        provider: this.name,
      };
    } catch (error) {
      logger.error('Claude: Failed to summarize commit', String(error));
      throw error;
    }
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }
}
