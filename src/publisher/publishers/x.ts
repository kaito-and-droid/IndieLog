import XApiClient from '@kworq/x-api-post';
import { Publisher, PublisherConfig } from '../base.js';
import { logger } from '../../core/logger.js';

/**
 * X (Twitter) Publisher Implementation
 */
export class XPublisher extends Publisher {
  readonly name = 'X Publisher';
  readonly platform = 'X';

  private client?: XApiClient;
  private apiKey?: string;
  private apiSecret?: string;
  private accessToken?: string;
  private accessSecret?: string;

  constructor(config: PublisherConfig) {
    super(config);

    // Load credentials from environment
    this.apiKey = process.env.X_API_KEY;
    this.apiSecret = process.env.X_API_SECRET;
    this.accessToken = process.env.X_ACCESS_TOKEN;
    this.accessSecret = process.env.X_ACCESS_SECRET;

    if (this.validateConfig()) {
      this.initializeClient();
    }
  }

  private initializeClient(): void {
    if (!this.apiKey || !this.apiSecret || !this.accessToken || !this.accessSecret) {
      return;
    }

    try {
      this.client = new XApiClient({
        X_API_KEY: this.apiKey,
        X_API_SECRET: this.apiSecret,
        X_API_ACCESS_TOKEN: this.accessToken,
        X_API_ACCESS_TOKEN_SECRET: this.accessSecret,
      });
    } catch (error) {
      logger.error('X Publisher: Failed to initialize client', String(error));
    }
  }

  validateConfig(): boolean {
    const hasAllCredentials =
      !!this.apiKey && !!this.apiSecret && !!this.accessToken && !!this.accessSecret;

    if (!hasAllCredentials) {
      logger.debug('X Publisher: Missing credentials in environment variables');
      logger.debug('Required: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET');
    }

    return hasAllCredentials;
  }

  protected async publishContent(content: string): Promise<string> {
    if (!this.client) {
      throw new Error('X client not initialized');
    }

    try {
      // Truncate to Twitter's character limit
      const tweet = this.truncateContent(content, 280);

      // Post the tweet using the correct method
      const result = await this.client.postTweetWithMedia(tweet, []);

      // Validate response
      if (!result || !result.data || !result.data.id) {
        throw new Error('Tweet posted but no ID returned - check API response permissions');
      }

      // Extract tweet URL from result
      const tweetId = result.data.id;
      const url = `https://x.com/i/status/${tweetId}`;

      return url;
    } catch (error) {
      logger.error('X Publisher: API error', String(error));
      throw error;
    }
  }
}
