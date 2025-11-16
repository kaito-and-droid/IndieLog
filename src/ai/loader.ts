import { AIProvider, AIProviderConfig, DevlogContext, AIResponse } from './provider.js';
import { OpenAIProvider } from './providers/openai.js';
import { ClaudeProvider } from './providers/claude.js';
import { LlamaProvider } from './providers/llama.js';
import { logger } from '../core/logger.js';
import { IndieLogConfig } from '../core/config.js';

/**
 * AI Provider Loader with fallback support
 */
export class AIProviderLoader {
  private primaryProvider: AIProvider;
  private fallbackProviders: AIProvider[] = [];

  constructor(config: IndieLogConfig) {
    // Load primary provider
    this.primaryProvider = this.loadProvider(
      config.ai.provider,
      this.getProviderConfig(config)
    );

    // Load fallback providers (if configured)
    // For now, we'll add basic fallback logic
    logger.debug('AI Provider loaded', this.primaryProvider.name);
  }

  /**
   * Load a specific provider by name
   */
  private loadProvider(name: string, config: AIProviderConfig): AIProvider {
    switch (name.toLowerCase()) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'claude':
        return new ClaudeProvider(config);
      case 'llama':
      case 'ollama':
        return new LlamaProvider(config);
      default:
        throw new Error(`Unknown AI provider: ${name}`);
    }
  }

  /**
   * Extract provider config from IndieLog config
   */
  private getProviderConfig(config: IndieLogConfig): AIProviderConfig {
    const provider = config.ai.provider;

    // Get API key from environment
    let apiKey: string | undefined;
    if (provider === 'openai') {
      apiKey = process.env.OPENAI_API_KEY;
    } else if (provider === 'claude') {
      apiKey = process.env.ANTHROPIC_API_KEY;
    }

    return {
      apiKey,
      model: config.ai.model,
      baseUrl: (config.ai as any).baseUrl,
      temperature: (config.ai as any).temperature,
      maxTokens: (config.ai as any).maxTokens,
    };
  }

  /**
   * Generate devlog with fallback support
   */
  async generateDevlog(context: DevlogContext): Promise<AIResponse> {
    try {
      logger.debug('Generating devlog with primary provider', this.primaryProvider.name);
      return await this.primaryProvider.generateDevlog(context);
    } catch (error) {
      logger.warning(
        `Primary provider ${this.primaryProvider.name} failed`,
        String(error)
      );

      // Try fallback providers
      for (const fallback of this.fallbackProviders) {
        try {
          logger.info(`Trying fallback provider: ${fallback.name}`);
          return await fallback.generateDevlog(context);
        } catch (fallbackError) {
          logger.warning(
            `Fallback provider ${fallback.name} failed`,
            String(fallbackError)
          );
          continue;
        }
      }

      // All providers failed
      throw new Error(
        `All AI providers failed. Last error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Summarize commit with fallback support
   */
  async summarizeCommit(message: string, style?: string): Promise<AIResponse> {
    try {
      logger.debug('Summarizing commit with primary provider', this.primaryProvider.name);
      return await this.primaryProvider.summarizeCommit(message, style);
    } catch (error) {
      logger.warning(
        `Primary provider ${this.primaryProvider.name} failed`,
        String(error)
      );

      // Try fallback providers
      for (const fallback of this.fallbackProviders) {
        try {
          logger.info(`Trying fallback provider: ${fallback.name}`);
          return await fallback.summarizeCommit(message, style);
        } catch (fallbackError) {
          logger.warning(
            `Fallback provider ${fallback.name} failed`,
            String(fallbackError)
          );
          continue;
        }
      }

      // All providers failed
      throw new Error(
        `All AI providers failed. Last error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Add a fallback provider
   */
  addFallback(provider: AIProvider): void {
    if (provider.isConfigured()) {
      this.fallbackProviders.push(provider);
      logger.debug('Added fallback provider', provider.name);
    }
  }

  /**
   * Get the primary provider
   */
  getPrimaryProvider(): AIProvider {
    return this.primaryProvider;
  }
}
