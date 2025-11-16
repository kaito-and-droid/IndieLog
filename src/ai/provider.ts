/**
 * AI Provider Interface - Phase 3
 * Defines the contract for all AI providers
 */

export interface AIProviderConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface DevlogContext {
  commits: Array<{
    hash: string;
    message: string;
    author: string;
    date: string;
  }>;
  fileChanges?: Array<{
    path: string;
    type: 'added' | 'modified' | 'deleted';
    insertions: number;
    deletions: number;
  }>;
  projectName?: string;
  style?: 'friendly' | 'technical' | 'funny';
  platform?: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
}

/**
 * Base AIProvider interface
 */
export interface AIProvider {
  name: string;

  /**
   * Generate a devlog post from commit context
   */
  generateDevlog(context: DevlogContext): Promise<AIResponse>;

  /**
   * Summarize a single commit message
   */
  summarizeCommit(message: string, style?: string): Promise<AIResponse>;

  /**
   * Check if provider is configured and ready
   */
  isConfigured(): boolean;
}

/**
 * Base abstract class for AI providers
 */
export abstract class BaseAIProvider implements AIProvider {
  abstract name: string;
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  abstract generateDevlog(context: DevlogContext): Promise<AIResponse>;
  abstract summarizeCommit(message: string, style?: string): Promise<AIResponse>;
  abstract isConfigured(): boolean;

  /**
   * Build system prompt for devlog generation
   */
  protected buildDevlogPrompt(context: DevlogContext): string {
    const style = context.style || 'friendly';
    const platform = context.platform || 'X/Twitter';

    let styleGuide = '';
    switch (style) {
      case 'friendly':
        styleGuide = 'Use a warm, conversational tone. Include emojis. Be enthusiastic but genuine.';
        break;
      case 'technical':
        styleGuide = 'Use a professional, technical tone. Focus on implementation details and technologies used.';
        break;
      case 'funny':
        styleGuide = 'Be witty and humorous. Use jokes and memes where appropriate. Keep it light and entertaining.';
        break;
    }

    const commitSummary = context.commits
      .map(c => `- ${c.message} (by ${c.author})`)
      .join('\n');

    const fileChangesSummary = context.fileChanges
      ? `\n\nFile changes:\n${context.fileChanges
          .map(f => `- ${f.type.toUpperCase()}: ${f.path} (+${f.insertions}/-${f.deletions})`)
          .join('\n')}`
      : '';

    return `You are helping an indie developer create a "build in public" post for ${platform}.

Project: ${context.projectName || 'My Project'}
Style: ${style}

Style Guide: ${styleGuide}

Recent commits:
${commitSummary}${fileChangesSummary}

Create a concise, engaging post (max 280 characters for Twitter) that:
1. Highlights the key progress made
2. Shows personality and authenticity
3. Uses appropriate hashtags like #buildinpublic #indiedev
4. Matches the ${style} style

Return only the post text, no explanations or metadata.`;
  }

  /**
   * Build prompt for commit summarization
   */
  protected buildCommitPrompt(message: string, style?: string): string {
    const styleGuide = style === 'technical'
      ? 'technical and detailed'
      : style === 'funny'
      ? 'humorous and witty'
      : 'friendly and conversational';

    return `Summarize this git commit message in a ${styleGuide} way (1-2 sentences):

"${message}"

Return only the summary, no explanations.`;
  }
}
