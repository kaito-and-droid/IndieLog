/**
 * REST API Server - Phase 7
 * Local-only API for IndieLog
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { logger } from '../core/logger.js';
import { statusRouter } from './routes/status.js';
import { logsRouter } from './routes/logs.js';
import { jobsRouter } from './routes/jobs.js';
import { projectsRouter } from './routes/projects.js';
import { configRouter } from './routes/config.js';

export interface ServerOptions {
  port: number;
  host: string;
}

/**
 * IndieLog REST API Server
 */
export class IndieLogServer {
  private app: Express;
  private server: any;
  private options: ServerOptions;

  constructor(options: ServerOptions) {
    this.options = options;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // CORS - local only
    this.app.use(
      cors({
        origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
        credentials: true,
      })
    );

    // JSON parser
    this.app.use(express.json());

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      logger.debug(`${req.method} ${req.path}`, req.ip);
      next();
    });
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'IndieLog API',
        version: '0.1.0',
        status: 'running',
        endpoints: [
          'GET /status',
          'GET /logs',
          'GET /logs/live',
          'POST /run',
          'POST /publish',
          'GET /projects',
          'POST /projects/select',
          'GET /config',
          'POST /config/update',
        ],
      });
    });

    // Mount routers
    this.app.use('/status', statusRouter);
    this.app.use('/logs', logsRouter);
    this.app.use('/', jobsRouter); // /run and /publish
    this.app.use('/projects', projectsRouter);
    this.app.use('/config', configRouter);
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Endpoint ${req.method} ${req.path} not found`,
      });
    });

    // Error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error('API Error', err.message);

      res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
      });
    });
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.options.port, this.options.host, () => {
          logger.success(
            `IndieLog API server running`,
            `http://${this.options.host}:${this.options.port}`
          );
          resolve();
        });

        this.server.on('error', (error: Error) => {
          logger.error('Server error', error.message);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err?: Error) => {
          if (err) {
            reject(err);
          } else {
            logger.info('Server stopped');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get Express app instance
   */
  getApp(): Express {
    return this.app;
  }
}
