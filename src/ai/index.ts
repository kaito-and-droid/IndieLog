/**
 * AI Module - Phase 3
 * Exports all AI-related functionality
 */

export * from './provider.js';
export * from './loader.js';
export * from './providers/openai.js';
export * from './providers/claude.js';
export * from './providers/llama.js';

// Re-export the old AI interface for backward compatibility
export { AISummarizer } from './ai.js';
