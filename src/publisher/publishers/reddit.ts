import { Publisher, PublisherConfig } from '../base.js';
import { logger } from '../../core/logger.js';

/**
 * Reddit Publisher Implementation
 * Uses Reddit API for posting
 */
export class RedditPublisher extends Publisher {
  readonly name = 'Reddit Publisher';
  readonly platform = 'Reddit';

  private clientId?: string;
  private clientSecret?: string;
  private username?: string;
  private password?: string;
  private subreddit?: string;
  private accessToken?: string;

  constructor(config: PublisherConfig) {
    super(config);

    // Load credentials from environment
    this.clientId = process.env.REDDIT_CLIENT_ID;
    this.clientSecret = process.env.REDDIT_CLIENT_SECRET;
    this.username = process.env.REDDIT_USERNAME;
    this.password = process.env.REDDIT_PASSWORD;
    this.subreddit = process.env.REDDIT_SUBREDDIT || 'test';
  }

  validateConfig(): boolean {
    const hasAllCredentials =
      !!this.clientId && !!this.clientSecret && !!this.username && !!this.password;

    if (!hasAllCredentials) {
      logger.debug('Reddit Publisher: Missing credentials in environment variables');
      logger.debug('Required: REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD');
    }

    return hasAllCredentials;
  }

  /**
   * Get OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    try {
      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'IndieLog/0.1.0',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          username: this.username!,
          password: this.password!,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get access token: ${error}`);
      }

      const data: any = await response.json();
      this.accessToken = data.access_token;

      return this.accessToken!;
    } catch (error) {
      logger.error('Reddit Publisher: Failed to get access token', String(error));
      throw error;
    }
  }

  protected async publishContent(content: string): Promise<string> {
    try {
      // Get access token
      const token = await this.getAccessToken();

      // Create post title and body
      const title = this.extractTitle(content);
      const selftext = content;

      // Submit post to subreddit
      const response = await fetch('https://oauth.reddit.com/api/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'IndieLog/0.1.0',
        },
        body: new URLSearchParams({
          sr: this.subreddit!,
          kind: 'self',
          title,
          text: selftext,
          api_type: 'json',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to publish to Reddit: ${error}`);
      }

      const data: any = await response.json();

      // Check for errors in response
      if (data.json?.errors && data.json.errors.length > 0) {
        throw new Error(`Reddit API error: ${JSON.stringify(data.json.errors)}`);
      }

      // Extract post URL
      const postUrl = data.json?.data?.url || 'https://reddit.com/r/' + this.subreddit;

      return postUrl;
    } catch (error) {
      logger.error('Reddit Publisher: API error', String(error));
      throw error;
    }
  }

  /**
   * Extract a title from the content (first line or first 100 chars)
   */
  private extractTitle(content: string): string {
    const firstLine = content.split('\n')[0];
    const title = firstLine.length > 100 ? firstLine.substring(0, 97) + '...' : firstLine;
    return title || 'Build Log Update';
  }
}
