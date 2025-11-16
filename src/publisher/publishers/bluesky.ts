import { Publisher, PublisherConfig } from '../base.js';
import { logger } from '../../core/logger.js';

/**
 * Bluesky Publisher Implementation
 * Uses AT Protocol API
 */
export class BlueskyPublisher extends Publisher {
  readonly name = 'Bluesky Publisher';
  readonly platform = 'Bluesky';

  private handle?: string;
  private password?: string;
  private accessToken?: string;
  private did?: string;

  constructor(config: PublisherConfig) {
    super(config);

    // Load credentials from environment
    this.handle = process.env.BLUESKY_HANDLE;
    this.password = process.env.BLUESKY_PASSWORD;
  }

  validateConfig(): boolean {
    const hasAllCredentials = !!this.handle && !!this.password;

    if (!hasAllCredentials) {
      logger.debug('Bluesky Publisher: Missing credentials in environment variables');
      logger.debug('Required: BLUESKY_HANDLE, BLUESKY_PASSWORD');
    }

    return hasAllCredentials;
  }

  /**
   * Create session and get access token
   */
  private async createSession(): Promise<void> {
    if (this.accessToken && this.did) {
      return;
    }

    try {
      const response = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: this.handle,
          password: this.password,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create session: ${error}`);
      }

      const data: any = await response.json();
      this.accessToken = data.accessJwt;
      this.did = data.did;
    } catch (error) {
      logger.error('Bluesky Publisher: Failed to create session', String(error));
      throw error;
    }
  }

  protected async publishContent(content: string): Promise<string> {
    try {
      // Create session
      await this.createSession();

      // Truncate to Bluesky's character limit (300)
      const text = this.truncateContent(content, 300);

      // Create post
      const now = new Date().toISOString();

      const post = {
        repo: this.did,
        collection: 'app.bsky.feed.post',
        record: {
          $type: 'app.bsky.feed.post',
          text,
          createdAt: now,
        },
      };

      const response = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(post),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to publish to Bluesky: ${error}`);
      }

      const data: any = await response.json();

      // Extract post URL
      const rkey = data.uri?.split('/').pop() || '';
      const url = `https://bsky.app/profile/${this.handle}/post/${rkey}`;

      return url;
    } catch (error) {
      logger.error('Bluesky Publisher: API error', String(error));
      throw error;
    }
  }
}
