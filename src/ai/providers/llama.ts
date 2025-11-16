import { BaseAIProvider, AIProviderConfig, DevlogContext, AIResponse } from '../provider.js';
import { logger } from '../../core/logger.js';

/**
 * Local Llama HTTP Adapter
 * Compatible with OpenAI-like APIs (Ollama, LM Studio, etc.)
 */
export class LlamaProvider extends BaseAIProvider {
  name = 'Llama';
  private baseUrl: string;
  private model: string;

  constructor(config: AIProviderConfig) {
    super(config);

    this.baseUrl = config.baseUrl || 'http://localhost:11434/v1';
    this.model = config.model || 'llama2';
  }

  async generateDevlog(context: DevlogContext): Promise<AIResponse> {
    try {
      const prompt = this.buildDevlogPrompt(context);

      logger.debug('Llama: Generating devlog', `Model: ${this.model}, URL: ${this.baseUrl}`);

      const response = await this.makeRequest({
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

      const content = response.choices?.[0]?.message?.content || '';

      return {
        content: content.trim(),
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens || 0,
              completionTokens: response.usage.completion_tokens || 0,
              totalTokens: response.usage.total_tokens || 0,
            }
          : undefined,
        model: this.model,
        provider: this.name,
      };
    } catch (error) {
      logger.error('Llama: Failed to generate devlog', String(error));
      throw error;
    }
  }

  async summarizeCommit(message: string, style?: string): Promise<AIResponse> {
    try {
      const prompt = this.buildCommitPrompt(message, style);

      logger.debug('Llama: Summarizing commit', `Model: ${this.model}`);

      const response = await this.makeRequest({
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

      const content = response.choices?.[0]?.message?.content || '';

      return {
        content: content.trim(),
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens || 0,
              completionTokens: response.usage.completion_tokens || 0,
              totalTokens: response.usage.total_tokens || 0,
            }
          : undefined,
        model: this.model,
        provider: this.name,
      };
    } catch (error) {
      logger.error('Llama: Failed to summarize commit', String(error));
      throw error;
    }
  }

  isConfigured(): boolean {
    return !!this.baseUrl;
  }

  /**
   * Make HTTP request to local Llama server
   */
  private async makeRequest(body: any): Promise<any> {
    const url = `${this.baseUrl}/chat/completions`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        throw new Error(
          `Cannot connect to local Llama server at ${this.baseUrl}. ` +
          'Make sure Ollama or your local LLM server is running.'
        );
      }
      throw error;
    }
  }
}
