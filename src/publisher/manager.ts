/**
 * Publisher Manager - Phase 4
 * Handles parallel publishing to multiple platforms
 */

import { Publisher, PublishResult, PublisherConfig } from './base.js';
import { XPublisher } from './publishers/x.js';
import { RedditPublisher } from './publishers/reddit.js';
import { BlueskyPublisher } from './publishers/bluesky.js';
import { IndieLogConfig } from '../core/config.js';
import { logger } from '../core/logger.js';
import chalk from 'chalk';

/**
 * Publisher Manager
 * Coordinates publishing to multiple platforms in parallel
 */
export class PublisherManager {
  private publishers: Publisher[] = [];

  constructor(config: IndieLogConfig) {
    this.loadPublishers(config);
  }

  /**
   * Load all configured publishers
   */
  private loadPublishers(config: IndieLogConfig): void {
    const publishers = config.publishers;

    // Load X/Twitter publisher
    if (publishers.x?.enabled) {
      try {
        const xPublisher = new XPublisher(publishers.x);
        if (xPublisher.validateConfig()) {
          this.publishers.push(xPublisher);
          logger.debug('Loaded X Publisher');
        }
      } catch (error) {
        logger.warning('Failed to load X Publisher', String(error));
      }
    }

    // Load Reddit publisher
    if (publishers.reddit?.enabled) {
      try {
        const redditPublisher = new RedditPublisher(publishers.reddit);
        if (redditPublisher.validateConfig()) {
          this.publishers.push(redditPublisher);
          logger.debug('Loaded Reddit Publisher');
        }
      } catch (error) {
        logger.warning('Failed to load Reddit Publisher', String(error));
      }
    }

    // Load Bluesky publisher
    if (publishers.bluesky?.enabled) {
      try {
        const blueskyPublisher = new BlueskyPublisher(publishers.bluesky);
        if (blueskyPublisher.validateConfig()) {
          this.publishers.push(blueskyPublisher);
          logger.debug('Loaded Bluesky Publisher');
        }
      } catch (error) {
        logger.warning('Failed to load Bluesky Publisher', String(error));
      }
    }

    if (this.publishers.length === 0) {
      logger.warning('No publishers configured or all failed to load');
    } else {
      logger.info(`Loaded ${this.publishers.length} publisher(s)`);
    }
  }

  /**
   * Publish content to all enabled platforms in parallel
   */
  async publishAll(content: string): Promise<PublishResult[]> {
    if (this.publishers.length === 0) {
      logger.warning('No publishers available');
      return [];
    }

    logger.info(`Publishing to ${this.publishers.length} platform(s)...`);

    // Publish to all platforms in parallel
    const publishPromises = this.publishers.map((publisher) =>
      publisher.publish(content).catch((error) => ({
        success: false,
        platform: publisher.platform,
        error: error instanceof Error ? error.message : String(error),
      }))
    );

    const results = await Promise.all(publishPromises);

    return results;
  }

  /**
   * Publish to a specific platform
   */
  async publishTo(platform: string, content: string): Promise<PublishResult> {
    const publisher = this.publishers.find(
      (p) => p.platform.toLowerCase() === platform.toLowerCase()
    );

    if (!publisher) {
      logger.error(`Publisher not found: ${platform}`);
      return {
        success: false,
        platform,
        error: 'Publisher not configured or not found',
      };
    }

    return await publisher.publish(content);
  }

  /**
   * Get list of enabled platforms
   */
  getEnabledPlatforms(): string[] {
    return this.publishers.map((p) => p.platform);
  }

  /**
   * Display publishing summary
   */
  static displaySummary(results: PublishResult[]): void {
    logger.separator();
    logger.header('📤 Publishing Results');

    if (results.length === 0) {
      logger.warning('No results to display');
      logger.footer();
      return;
    }

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    // Display successful publishes
    if (successful.length > 0) {
      logger.success(`Successfully published to ${successful.length} platform(s)`);
      successful.forEach((result) => {
        console.log(chalk.green('  ✓'), chalk.white(result.platform));
        if (result.url) {
          console.log(chalk.dim(`    ${result.url}`));
        }
        if (result.retries && result.retries > 0) {
          console.log(chalk.dim(`    (succeeded after ${result.retries} retries)`));
        }
      });
      logger.separator();
    }

    // Display failed publishes
    if (failed.length > 0) {
      logger.error(`Failed to publish to ${failed.length} platform(s)`);
      failed.forEach((result) => {
        console.log(chalk.red('  ✗'), chalk.white(result.platform));
        if (result.error) {
          console.log(chalk.dim(`    ${result.error}`));
        }
      });
      logger.separator();
    }

    logger.footer();
  }
}
