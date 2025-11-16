/**
 * Publisher Base Classes - Phase 4
 * Abstract Publisher class and interfaces
 */

import { logger } from '../core/logger.js';

export interface PublisherConfig {
  enabled: boolean;
  maxRetries?: number;
  retryDelay?: number; // milliseconds
}

export interface PublishResult {
  success: boolean;
  platform: string;
  url?: string;
  error?: string;
  retries?: number;
}

/**
 * Abstract Publisher class
 * All publisher implementations must extend this
 */
export abstract class Publisher {
  abstract readonly name: string;
  abstract readonly platform: string;

  protected config: PublisherConfig;

  constructor(config: PublisherConfig) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      ...config,
    };
  }

  /**
   * Publish content to the platform
   * Subclasses must implement this
   */
  protected abstract publishContent(content: string): Promise<string>;

  /**
   * Validate credentials and configuration
   * Subclasses must implement this
   */
  abstract validateConfig(): boolean;

  /**
   * Public publish method with retry logic
   */
  async publish(content: string): Promise<PublishResult> {
    if (!this.config.enabled) {
      logger.debug(`Publisher ${this.name} is disabled`);
      return {
        success: false,
        platform: this.platform,
        error: 'Publisher is disabled',
      };
    }

    if (!this.validateConfig()) {
      logger.error(`${this.name}: Invalid configuration`);
      return {
        success: false,
        platform: this.platform,
        error: 'Invalid configuration or missing credentials',
      };
    }

    let lastError: Error | null = null;
    const maxRetries = this.config.maxRetries ?? 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        logger.debug(
          `${this.name}: Publishing attempt ${attempt + 1}/${maxRetries + 1}`,
          content.substring(0, 50) + '...'
        );

        const url = await this.publishContent(content);

        logger.success(`${this.name}: Published successfully`, url);

        return {
          success: true,
          platform: this.platform,
          url,
          retries: attempt,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        logger.warning(
          `${this.name}: Publish attempt ${attempt + 1} failed`,
          lastError.message
        );

        // Don't retry on the last attempt
        if (attempt < maxRetries) {
          const delay = this.config.retryDelay ?? 1000;
          logger.debug(`${this.name}: Retrying in ${delay}ms...`);
          await this.sleep(delay * (attempt + 1)); // Exponential backoff
        }
      }
    }

    // All retries failed
    logger.error(`${this.name}: All publish attempts failed`, lastError?.message);

    return {
      success: false,
      platform: this.platform,
      error: lastError?.message || 'Unknown error',
      retries: maxRetries,
    };
  }

  /**
   * Helper: Sleep for a given duration
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Helper: Truncate content to max length
   */
  protected truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength - 3) + '...';
  }
}
