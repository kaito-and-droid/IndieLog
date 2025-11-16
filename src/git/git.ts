import simpleGit, { SimpleGit, LogResult } from 'simple-git';
import chalk from 'chalk';
import { IndieLogConfig } from '../core/config.js';

export interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export class GitFetcher {
  private git: SimpleGit;
  private repoPath: string;

  constructor(config: IndieLogConfig) {
    this.repoPath = config.sources.path || '.';
    this.git = simpleGit(this.repoPath);
  }

  /**
   * Fetch commits since a given date
   * @param since Date string (e.g., "2024-01-01" or "today")
   * @returns Array of commits
   */
  async fetchCommits(since?: string): Promise<Commit[]> {
    try {
      // Check if we're in a git repository
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        console.error(chalk.red('❌ Not a git repository:'), this.repoPath);
        console.log(chalk.dim('Initialize git with:'), chalk.cyan('git init'));
        process.exit(1);
      }

      // Parse date - default to today at midnight
      const sinceDate = this.parseDate(since);

      // Fetch commits
      const log: LogResult = await this.git.log({
        '--since': sinceDate,
        '--all': null,
      });

      // Format commits
      const commits: Commit[] = log.all.map((commit) => ({
        hash: commit.hash.substring(0, 7),
        message: commit.message.split('\n')[0], // First line only
        author: commit.author_name,
        date: commit.date,
      }));

      return commits;
    } catch (error) {
      console.error(chalk.red('❌ Failed to fetch commits:'), error);
      process.exit(1);
    }
  }

  /**
   * Parse date string into format git understands
   * @param since Date string or undefined
   * @returns Formatted date string
   */
  private parseDate(since?: string): string {
    if (!since) {
      // Default to today at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today.toISOString();
    }

    // Handle special keywords
    if (since.toLowerCase() === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today.toISOString();
    }

    if (since.toLowerCase() === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      return yesterday.toISOString();
    }

    // Handle relative time (e.g., "7 days ago", "1 week ago")
    const relativeMatch = since.match(/^(\d+)\s+(day|week|month)s?\s+ago$/i);
    if (relativeMatch) {
      const amount = parseInt(relativeMatch[1]);
      const unit = relativeMatch[2].toLowerCase();
      const date = new Date();

      if (unit === 'day') {
        date.setDate(date.getDate() - amount);
      } else if (unit === 'week') {
        date.setDate(date.getDate() - amount * 7);
      } else if (unit === 'month') {
        date.setMonth(date.getMonth() - amount);
      }

      return date.toISOString();
    }

    // Try to parse as ISO date or other standard format
    try {
      const parsedDate = new Date(since);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
      }
    } catch (error) {
      // Fall through to return original
    }

    // Return original string, let git handle it
    return since;
  }

  /**
   * Display commits in a nice format
   */
  static display(commits: Commit[]): void {
    if (commits.length === 0) {
      console.log(chalk.yellow('⚠️  No commits found'));
      console.log();
      return;
    }

    console.log(chalk.cyan(`🧩 ${commits.length} commit${commits.length !== 1 ? 's' : ''} found:`));
    console.log();

    commits.forEach((commit) => {
      console.log(chalk.green('  •'), chalk.white(commit.message));
      console.log(chalk.dim(`    ${commit.hash} by ${commit.author} on ${new Date(commit.date).toLocaleDateString()}`));
    });

    console.log();
  }
}
