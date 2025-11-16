import { z } from 'zod';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import chalk from 'chalk';
import YAML from 'yaml';

// Zod schemas for validation
const SourcesSchema = z.object({
  type: z.enum(['git', 'github']),
  path: z.string().optional(),
  repo: z.string().optional(),
});

const AISchema = z.object({
  provider: z.enum(['openai', 'claude', 'llama', 'ollama']),
  model: z.string(),
  promptStyle: z.enum(['friendly', 'technical', 'funny']),
  baseUrl: z.string().optional(), // For local Llama/Ollama
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
});

const PublisherConfigSchema = z.object({
  enabled: z.boolean(),
  maxRetries: z.number().min(0).max(5).optional(),
  retryDelay: z.number().positive().optional(), // milliseconds
});

const PublishersSchema = z.object({
  x: PublisherConfigSchema.optional(),
  reddit: PublisherConfigSchema.optional(),
  bluesky: PublisherConfigSchema.optional(),
  devto: PublisherConfigSchema.optional(),
});

export const IndieLogConfigSchema = z.object({
  projectName: z.string(),
  sources: SourcesSchema,
  ai: AISchema,
  publishers: PublishersSchema,
});

export type IndieLogConfig = z.infer<typeof IndieLogConfigSchema>;

export class ConfigLoader {
  private static DEFAULT_CONFIG_NAMES = ['indielog.config.yaml', 'indielog.config.yml', 'indielog.config.json'];

  /**
   * Find config file in current directory
   * @returns Path to config file or null
   */
  private static findConfigFile(): string | null {
    const cwd = process.cwd();
    for (const configName of this.DEFAULT_CONFIG_NAMES) {
      const path = join(cwd, configName);
      if (existsSync(path)) {
        return path;
      }
    }
    return null;
  }

  /**
   * Load and validate config from a file
   * @param configPath Optional custom path to config file
   * @returns Validated IndieLogConfig
   */
  static load(configPath?: string): IndieLogConfig {
    const path = configPath || this.findConfigFile();

    // Check if config file exists
    if (!path || !existsSync(path)) {
      console.error(chalk.red('❌ Config file not found'));
      console.log();
      console.log(chalk.yellow('Run:'), chalk.cyan('npx indielog init'), chalk.yellow('to create one.'));
      console.log(chalk.dim('Supported formats: indielog.config.yaml, indielog.config.yml, indielog.config.json'));
      process.exit(1);
    }

    try {
      // Read file content
      const fileContent = readFileSync(path, 'utf-8');
      const ext = extname(path);

      // Parse based on file extension
      let rawConfig: any;
      if (ext === '.yaml' || ext === '.yml') {
        rawConfig = YAML.parse(fileContent);
      } else if (ext === '.json') {
        rawConfig = JSON.parse(fileContent);
      } else {
        throw new Error(`Unsupported config file format: ${ext}`);
      }

      // Validate with zod
      const config = IndieLogConfigSchema.parse(rawConfig);

      console.log(chalk.green('✅ Loaded config:'), chalk.dim(path));
      return config;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(chalk.red('❌ Config validation failed:'));
        console.log();
        error.issues.forEach((err) => {
          console.log(chalk.yellow('  •'), chalk.dim(err.path.join('.')), '-', err.message);
        });
        console.log();
        console.log(chalk.dim('Please fix your config file and try again.'));
      } else if (error instanceof SyntaxError) {
        console.error(chalk.red('❌ Invalid syntax in config file:'));
        console.log(chalk.dim(error.message));
      } else {
        console.error(chalk.red('❌ Failed to load config:'), error);
      }
      process.exit(1);
    }
  }

  /**
   * Display config in a readable format
   */
  static display(config: IndieLogConfig): void {
    console.log();
    console.log(chalk.cyan('📋 Configuration:'));
    console.log(chalk.dim('─'.repeat(50)));
    console.log(chalk.white('Project:'), chalk.bold(config.projectName));
    console.log(chalk.white('Source:'), config.sources.type, chalk.dim(`(${config.sources.path || config.sources.repo})`));
    console.log(chalk.white('AI:'), `${config.ai.provider}/${config.ai.model}`, chalk.dim(`[${config.ai.promptStyle}]`));

    // Show enabled publishers
    const enabledPublishers = Object.entries(config.publishers)
      .filter(([_, pub]) => pub?.enabled)
      .map(([name]) => name);

    console.log(chalk.white('Publishers:'),
      enabledPublishers.length > 0
        ? chalk.green(enabledPublishers.join(', '))
        : chalk.yellow('none enabled')
    );
    console.log(chalk.dim('─'.repeat(50)));
    console.log();
  }
}
