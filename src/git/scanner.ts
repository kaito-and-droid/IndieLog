import simpleGit, { SimpleGit, DiffResult } from 'simple-git';
import { logger } from '../core/logger.js';

export interface FileChange {
  path: string;
  type: 'added' | 'modified' | 'deleted';
  insertions: number;
  deletions: number;
}

export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: string;
  email: string;
}

export interface ScanResult {
  commits: CommitInfo[];
  fileChanges: FileChange[];
  totalInsertions: number;
  totalDeletions: number;
  baseline?: string;
  head: string;
}

export interface ScanOptions {
  repoPath?: string;
  since?: string;
  baseline?: string;
  extractSnippets?: boolean;
}

/**
 * Git Scanner Module - Phase 2
 * Scans repository changes and extracts commit information
 */
export class GitScanner {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repoPath: string = '.') {
    this.repoPath = repoPath;
    this.git = simpleGit(repoPath);
  }

  /**
   * Main scan function - implements scanChanges(repoPath)
   * Compares HEAD → previous baseline commit
   */
  async scanChanges(options: ScanOptions = {}): Promise<ScanResult> {
    try {
      // Verify we're in a git repository
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        throw new Error(`Not a git repository: ${this.repoPath}`);
      }

      // Get current HEAD
      const head = await this.getCurrentHead();

      // Determine baseline commit
      const baseline = await this.getBaseline(options);

      // Get commits between baseline and HEAD
      const commits = await this.getCommits(baseline, head, options.since);

      // Get file changes
      const fileChanges = await this.getFileChanges(baseline, head);

      // Calculate statistics
      const totalInsertions = fileChanges.reduce((sum, f) => sum + f.insertions, 0);
      const totalDeletions = fileChanges.reduce((sum, f) => sum + f.deletions, 0);

      return {
        commits,
        fileChanges,
        totalInsertions,
        totalDeletions,
        baseline,
        head,
      };
    } catch (error) {
      logger.error('Git scan failed', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Get current HEAD commit hash
   */
  private async getCurrentHead(): Promise<string> {
    const log = await this.git.log(['-1']);
    return log.latest?.hash || 'HEAD';
  }

  /**
   * Determine baseline commit
   * Priority: options.baseline > previous commit > initial commit
   */
  private async getBaseline(options: ScanOptions): Promise<string | undefined> {
    if (options.baseline) {
      return options.baseline;
    }

    // Get commit count
    const log = await this.git.log();

    if (log.total <= 1) {
      // Only one commit or no commits, no baseline
      return undefined;
    }

    // Use previous commit as baseline
    const previousLog = await this.git.log(['-2']);
    return previousLog.all[1]?.hash;
  }

  /**
   * Get commits between baseline and HEAD
   */
  private async getCommits(
    baseline: string | undefined,
    head: string,
    since?: string
  ): Promise<CommitInfo[]> {
    const options: any = {};

    if (since) {
      options['--since'] = this.parseDateString(since);
    }

    if (baseline) {
      options['--ancestry-path'] = null;
    }

    // Get log
    const range = baseline ? `${baseline}..${head}` : head;
    const log = await this.git.log([range, ...Object.keys(options)]);

    // Format commits
    return log.all.map(commit => ({
      hash: commit.hash.substring(0, 7),
      message: commit.message,
      author: commit.author_name,
      email: commit.author_email,
      date: commit.date,
    }));
  }

  /**
   * Get file changes between baseline and HEAD
   * Detects: added files, modified files, deleted files
   */
  private async getFileChanges(
    baseline: string | undefined,
    head: string
  ): Promise<FileChange[]> {
    const range = baseline ? `${baseline}..${head}` : head;

    try {
      // Get diff summary
      const diffSummary = await this.git.diffSummary([range]);

      // Parse file changes
      const fileChanges: FileChange[] = diffSummary.files.map(file => {
        let type: 'added' | 'modified' | 'deleted' = 'modified';

        // Handle different file types (text vs binary)
        const insertions = 'insertions' in file ? file.insertions : 0;
        const deletions = 'deletions' in file ? file.deletions : 0;

        // Determine change type based on insertions/deletions
        if (insertions > 0 && deletions === 0) {
          type = 'added';
        } else if (insertions === 0 && deletions > 0) {
          type = 'deleted';
        }

        // Check binary flag
        if (file.binary) {
          type = 'modified'; // Binary files are typically modifications
        }

        return {
          path: file.file,
          type,
          insertions,
          deletions,
        };
      });

      return fileChanges;
    } catch (error) {
      logger.warning('Failed to get file changes', String(error));
      return [];
    }
  }

  /**
   * Extract code snippets for specific files (optional feature)
   */
  async extractSnippets(files: string[], baseline?: string): Promise<Map<string, string>> {
    const snippets = new Map<string, string>();

    for (const file of files) {
      try {
        const range = baseline ? `${baseline}..HEAD` : 'HEAD';
        const diff = await this.git.diff([range, '--', file]);

        if (diff) {
          snippets.set(file, diff);
        }
      } catch (error) {
        logger.debug(`Failed to extract snippet for ${file}`, String(error));
      }
    }

    return snippets;
  }

  /**
   * Parse date string into git-compatible format
   */
  private parseDateString(since: string): string {
    if (!since) {
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
   * Display scan results in a nice format
   */
  static displayResults(result: ScanResult): void {
    logger.header('📊 Git Scan Results');

    // Display baseline info
    if (result.baseline) {
      logger.info('Baseline commit', result.baseline);
    }
    logger.info('HEAD commit', result.head);
    logger.separator();

    // Display commits
    if (result.commits.length === 0) {
      logger.warning('No commits found');
    } else {
      logger.info(`Found ${result.commits.length} commit(s)`);
      logger.separator();

      result.commits.forEach((commit, index) => {
        console.log(logger.listItem(
          `[${commit.hash}] ${commit.message}`,
          `by ${commit.author} on ${new Date(commit.date).toLocaleDateString()}`
        ));
      });
    }

    logger.separator();

    // Display file changes
    if (result.fileChanges.length === 0) {
      logger.warning('No file changes detected');
    } else {
      logger.info(`File changes: ${result.fileChanges.length}`);

      const added = result.fileChanges.filter(f => f.type === 'added');
      const modified = result.fileChanges.filter(f => f.type === 'modified');
      const deleted = result.fileChanges.filter(f => f.type === 'deleted');

      if (added.length > 0) {
        logger.success(`Added: ${added.length} file(s)`);
        added.forEach(f => logger.dim(`  + ${f.path}`));
      }

      if (modified.length > 0) {
        logger.info(`Modified: ${modified.length} file(s)`);
        modified.forEach(f => logger.dim(`  ~ ${f.path}`));
      }

      if (deleted.length > 0) {
        logger.error(`Deleted: ${deleted.length} file(s)`);
        deleted.forEach(f => logger.dim(`  - ${f.path}`));
      }

      logger.separator();
      logger.info('Statistics');
      logger.success(`+${result.totalInsertions} insertions`);
      logger.error(`-${result.totalDeletions} deletions`);
    }

    logger.footer();
  }
}

/**
 * Expose module as function (as per Phase 2 spec)
 */
export async function scanChanges(repoPath: string, options?: ScanOptions): Promise<ScanResult> {
  const scanner = new GitScanner(repoPath);
  return scanner.scanChanges(options);
}
