import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

export default async function healthRoutes(fastify: FastifyInstance) {
  // Health check endpoint with comprehensive connectivity tests
  fastify.get('/health', {
    schema: {
      description: 'Comprehensive health check - tests API, database, and storage connectivity',
      tags: ['Service Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            checks: {
              type: 'object',
              properties: {
                api: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    message: { type: 'string' }
                  }
                },
                database: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    message: { type: 'string' },
                    responseTime: { type: 'number' }
                  }
                },
                storage: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    message: { type: 'string' },
                    buckets: { type: 'array' }
                  }
                }
              }
            }
          }
        },
        503: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            checks: {
              type: 'object',
              properties: {
                api: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    message: { type: 'string' }
                  }
                },
                database: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    message: { type: 'string' },
                    error: { type: 'string' }
                  }
                },
                storage: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    message: { type: 'string' },
                    error: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now();
    const checks: any = {
      api: { status: 'healthy', message: 'API is responding' },
      database: { status: 'unknown', message: 'Not tested' },
      storage: { status: 'unknown', message: 'Not tested' }
    };

    let overallStatus = 'healthy';

    // Test database connectivity
    try {
      const dbStart = Date.now();
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });
      
      const result = await pool.query('SELECT 1 as test');
      const dbResponseTime = Date.now() - dbStart;
      
      await pool.end();
      
      checks.database = {
        status: 'healthy',
        message: 'Database connection successful',
        responseTime: dbResponseTime
      };
    } catch (error) {
      checks.database = {
        status: 'unhealthy',
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      overallStatus = 'unhealthy';
    }

    // Test storage connectivity
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_KEY || ''
      );

      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        throw error;
      }

      checks.storage = {
        status: 'healthy',
        message: 'Storage connection successful',
        buckets: buckets?.map(b => b.name) || []
      };
    } catch (error) {
      checks.storage = {
        status: 'unhealthy',
        message: 'Storage connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      overallStatus = 'unhealthy';
    }

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks
    };

    // Return appropriate status code
    if (overallStatus === 'unhealthy') {
      reply.code(503);
    }

    return response;
  });
}