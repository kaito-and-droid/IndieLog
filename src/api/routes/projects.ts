/**
 * Projects Routes - Phase 7
 */

import { Router, Request, Response } from 'express';
import { readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';

export const projectsRouter = Router();

// Store current project path
let currentProjectPath: string = process.cwd();

/**
 * GET /projects
 * List available projects (directories with indielog config)
 */
projectsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const baseDir = req.query.baseDir as string || process.env.HOME || '/';
    const projects = findProjects(baseDir);

    res.json({
      current: currentProjectPath,
      available: projects,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list projects',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /projects/select
 * Select a project to work with
 */
projectsRouter.post('/select', async (req: Request, res: Response) => {
  try {
    const { path } = req.body;

    if (!path) {
      return res.status(400).json({
        error: 'Path is required',
      });
    }

    if (!existsSync(path)) {
      return res.status(404).json({
        error: 'Project not found',
        message: `Path does not exist: ${path}`,
      });
    }

    // Check if it's a valid IndieLog project
    const configFiles = ['indielog.config.yaml', 'indielog.config.yml', 'indielog.config.json'];
    const hasConfig = configFiles.some((file) => existsSync(join(path, file)));

    if (!hasConfig) {
      return res.status(400).json({
        error: 'Invalid project',
        message: 'No IndieLog config file found in this directory',
      });
    }

    // Update current project path
    currentProjectPath = path;
    process.chdir(path);

    res.json({
      success: true,
      path: currentProjectPath,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to select project',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Find projects with IndieLog config
 */
function findProjects(baseDir: string, maxDepth: number = 2): string[] {
  const projects: string[] = [];
  const configFiles = ['indielog.config.yaml', 'indielog.config.yml', 'indielog.config.json'];

  function search(dir: string, depth: number) {
    if (depth > maxDepth) return;

    try {
      const entries = readdirSync(dir);

      // Check if current directory has config
      const hasConfig = configFiles.some((file) => existsSync(join(dir, file)));
      if (hasConfig) {
        projects.push(dir);
      }

      // Search subdirectories
      for (const entry of entries) {
        const fullPath = join(dir, entry);

        // Skip hidden directories and node_modules
        if (entry.startsWith('.') || entry === 'node_modules') continue;

        try {
          const stat = statSync(fullPath);
          if (stat.isDirectory()) {
            search(fullPath, depth + 1);
          }
        } catch (err) {
          // Skip directories we can't access
        }
      }
    } catch (err) {
      // Skip directories we can't read
    }
  }

  search(baseDir, 0);
  return projects;
}
