/**
 * Config Routes - Phase 7
 */

import { Router, Request, Response } from 'express';
import { ConfigLoader, IndieLogConfigSchema } from '../../core/config.js';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';

export const configRouter = Router();

/**
 * GET /config
 * Get current configuration
 */
configRouter.get('/', async (req: Request, res: Response) => {
  try {
    const configPath = req.query.path as string;
    const config = ConfigLoader.load(configPath);

    res.json({
      config,
      path: configPath || 'default',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to load config',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /config/update
 * Update configuration
 */
configRouter.post('/update', async (req: Request, res: Response) => {
  try {
    const { config, path, format } = req.body;

    if (!config) {
      return res.status(400).json({
        error: 'Config is required',
      });
    }

    // Determine config file path
    const configPath =
      path || join(process.cwd(), `indielog.config.${format || 'json'}`);

    // Validate config
    try {
      const validated = IndieLogConfigSchema.parse(config);
    } catch (validationError) {
      return res.status(400).json({
        error: 'Invalid config',
        message: validationError instanceof Error ? validationError.message : String(validationError),
      });
    }

    // Write config file
    let content: string;
    if (format === 'yaml' || format === 'yml') {
      content = YAML.stringify(config);
    } else {
      content = JSON.stringify(config, null, 2);
    }

    writeFileSync(configPath, content, 'utf-8');

    res.json({
      success: true,
      path: configPath,
      message: 'Configuration updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update config',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});
