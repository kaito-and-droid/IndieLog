import { Publisher, PublisherConfig } from '../base.js';
import { logger } from '../../core/logger.js';

/**
 * Mastodon Publisher Implementation
 * Uses Mastodon REST API v1
 */
export class MastodonPublisher extends Publisher {
  readonly name = 'Mastodon Publisher';
  readonly platform = 'Mastodon';

  private server?: string;
  private accessToken?: string;

  constructor(config: PublisherConfig) {
    super(config);

    // Load credentials from environment
    this.server = process.env.MASTODON_SERVER;
    this.accessToken = process.env.MASTODON_ACCESS_TOKEN;
  }

  validateConfig(): boolean {
    const hasAllCredentials = !!this.server && !!this.accessToken;

    if (!hasAllCredentials) {
      logger.debug('Mastodon Publisher: Missing credentials in environment variables');
      logger.debug('Required: MASTODON_SERVER, MASTODON_ACCESS_TOKEN');
    }

    // Validate server URL format
    if (this.server && !this.server.startsWith('http')) {
      logger.debug('Mastodon Publisher: MASTODON_SERVER must start with http:// or https://');
      return false;
    }

    return hasAllCredentials;
  }

  protected async publishContent(content: string): Promise<string> {
    try {
      // Truncate to Mastodon's character limit (500 is default, but can vary by instance)
      const status = this.truncateContent(content, 500);

      // Create post (toot)
      const response = await fetch(`${this.server}/api/v1/statuses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          visibility: 'public', // Can be 'public', 'unlisted', 'private', 'direct'
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to publish to Mastodon: ${error}`);
      }

      const data: any = await response.json();

      // Return the post URL
      return data.url || data.uri;
    } catch (error) {
      logger.error('Mastodon Publisher: API error', String(error));
      throw error;
    }
  }
}
