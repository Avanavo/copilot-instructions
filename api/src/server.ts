import Fastify, { FastifyRequest, FastifyReply } from 'fastify';

// Create Fastify instance with TypeScript support
const fastify = Fastify({
  logger: process.env.NODE_ENV !== 'production' ? {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  } : true
});

// Add custom validator compiler for multipart uploads with Swagger
fastify.setValidatorCompiler(({ schema }: { schema: any }) => {
  return (data: any) => {
    // Check if any property has isFile: true - if so, skip all validation
    function hasFileProperty(obj: any): boolean {
      if (typeof obj !== 'object' || obj === null) return false;
      
      for (const key in obj) {
        if (obj[key] && obj[key].isFile === true) {
          return true;
        }
        if (typeof obj[key] === 'object' && hasFileProperty(obj[key])) {
          return true;
        }
      }
      return false;
    }
    
    if (hasFileProperty(schema)) {
      return { value: data };
    }
    
    // For non-file schemas, use default validation
    const Ajv = require('ajv');
    const ajv = new Ajv({
      removeAdditional: true,
      useDefaults: true,
      coerceTypes: true,
      allErrors: true,
      strict: false
    });
    
    // Add support for binary format
    ajv.addFormat('binary', true);
    
    // Add custom keyword for isFile
    ajv.addKeyword({
      keyword: 'isFile',
      type: 'string',
      schemaType: 'boolean',
      compile: function (schemaVal: boolean) {
        return function validate() {
          return true;
        };
      }
    });
    
    const validate = ajv.compile(schema);
    const valid = validate(data);
    
    if (valid) {
      return { value: data };
    }
    
    return { error: validate.errors };
  };
});

// Register plugins
async function registerPlugins() {
  // Environment variables validation
  await fastify.register(import('@fastify/env'), {
    schema: {
      type: 'object',
      required: ['PORT'],
      properties: {
        PORT: {
          type: 'string',
          default: '3002'
        },
        NODE_ENV: {
          type: 'string',
          default: 'development'
        },
        DATABASE_URL: {
          type: 'string',
          default: 'postgres://supabase:supabase@localhost:5432/supabase'
        },
        SUPABASE_URL: {
          type: 'string',
          default: 'http://localhost:54321'
        },
        SUPABASE_ANON_KEY: {
          type: 'string',
          default: 'your_supabase_anon_key_here'
        }
      }
    }
  });

  // CORS
  await fastify.register(import('@fastify/cors'), {
    origin: process.env.NODE_ENV === 'production' ? false : true
  });

  // Security headers
  await fastify.register(import('@fastify/helmet'));

  // Sensible defaults (error handling, etc.)
  await fastify.register(import('@fastify/sensible'));

  // Multipart file upload support
  await fastify.register(import('@fastify/multipart'));

  // Swagger documentation
  await fastify.register(import('@fastify/swagger'), {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'DocSpective API',
        description: 'API for DocSpective application',
        version: '1.0.0'
      },
      servers: [
        {
          url: 'http://localhost:3001',
          description: 'Development server'
        }
      ]
    }
  });

  await fastify.register(import('@fastify/swagger-ui'), {
    routePrefix: '/',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false
    }
  });
}

// Register routes
async function registerRoutes() {
  // Create API scope with prefix
  await fastify.register(async function (fastify) {
    // All routes registered here will automatically have /api prefix
    await fastify.register(import('./routes/upload'));
    await fastify.register(import('./routes/health'));
  }, { prefix: '/api' });
}

// Start server
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();

    const port = parseInt(process.env.PORT || '3001');
    const host = '0.0.0.0'; // Always bind to 0.0.0.0 for Docker compatibility

    await fastify.listen({ port, host });
    
    fastify.log.info(`🚀 Server ready at http://${host}:${port}`);
    fastify.log.info(`📚 Documentation available at http://${host}:${port}/`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  fastify.log.info('Received SIGINT, shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  fastify.log.info('Received SIGTERM, shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

// Start the server
start();