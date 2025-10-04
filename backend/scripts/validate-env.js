#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Validates all required and optional environment variables for production deployment
 */

// Simple color functions for console output
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`
};

// Define environment variable requirements
const ENV_CONFIG = {
  required: {
    NODE_ENV: {
      description: 'Application environment',
      validValues: ['development', 'production', 'test'],
      example: 'production'
    },
    PORT: {
      description: 'Application port',
      type: 'number',
      example: '3001'
    },
    DATABASE_URL: {
      description: 'PostgreSQL connection string',
      pattern: /^postgresql:\/\/.+/,
      example: 'postgresql://user:pass@host:5432/db'
    },
    JWT_ACCESS_SECRET: {
      description: 'JWT access token secret',
      minLength: 32,
      example: 'your-super-secure-32-character-secret'
    },
    JWT_REFRESH_SECRET: {
      description: 'JWT refresh token secret',
      minLength: 32,
      example: 'your-super-secure-32-character-secret'
    }
  },
  optional: {
    REDIS_URL: {
      description: 'Redis connection string',
      pattern: /^redis:\/\/.+/,
      example: 'redis://user:pass@host:6379'
    },
    ALLOWED_ORIGINS: {
      description: 'Comma-separated list of allowed CORS origins',
      example: 'https://app.yourdomain.com,https://yourdomain.com'
    },
    COOKIE_DOMAIN: {
      description: 'Domain for secure cookies',
      example: 'yourdomain.com'
    },
    COOKIE_SECURE: {
      description: 'Enable secure cookies',
      validValues: ['true', 'false'],
      example: 'true'
    },
    SAME_SITE: {
      description: 'SameSite cookie attribute',
      validValues: ['strict', 'lax', 'none'],
      example: 'none'
    },
    RATE_LIMIT_WINDOW_MS: {
      description: 'Rate limiting window in milliseconds',
      type: 'number',
      example: '900000'
    },
    RATE_LIMIT_MAX_REQUESTS: {
      description: 'Maximum requests per window',
      type: 'number',
      example: '100'
    },
    AWS_ACCESS_KEY_ID: {
      description: 'AWS access key for S3',
      example: 'AKIAIOSFODNN7EXAMPLE'
    },
    AWS_SECRET_ACCESS_KEY: {
      description: 'AWS secret key for S3',
      minLength: 20,
      example: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
    },
    AWS_REGION: {
      description: 'AWS region for S3',
      example: 'us-east-1'
    },
    AWS_S3_BUCKET: {
      description: 'S3 bucket name for file storage',
      example: 'your-app-files'
    },
    SENDGRID_API_KEY: {
      description: 'SendGrid API key for email',
      pattern: /^SG\..+/,
      example: 'SG.your-sendgrid-api-key'
    },
    FROM_EMAIL: {
      description: 'From email address',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      example: 'noreply@yourdomain.com'
    },
    SENTRY_DSN: {
      description: 'Sentry DSN for error tracking',
      pattern: /^https:\/\/[a-f0-9]+@[a-f0-9]+\.ingest\.sentry\.io\/[0-9]+$/,
      example: 'https://key@sentry.io/project'
    }
  }
};

function validateEnvironmentVariable(name, config, value) {
  const result = {
    name,
    value: value ? '[SET]' : '[NOT SET]',
    status: 'unknown',
    issues: []
  };

  if (!value) {
    result.status = 'missing';
    result.issues.push('Variable is not set');
    return result;
  }

  // Check type
  if (config.type === 'number') {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      result.status = 'invalid';
      result.issues.push('Must be a valid number');
      return result;
    }
  }

  // Check valid values
  if (config.validValues && !config.validValues.includes(value)) {
    result.status = 'invalid';
    result.issues.push(`Must be one of: ${config.validValues.join(', ')}`);
    return result;
  }

  // Check pattern
  if (config.pattern && !config.pattern.test(value)) {
    result.status = 'invalid';
    result.issues.push('Does not match expected format');
    return result;
  }

  // Check minimum length
  if (config.minLength && value.length < config.minLength) {
    result.status = 'invalid';
    result.issues.push(`Must be at least ${config.minLength} characters long`);
    return result;
  }

  result.status = 'valid';
  return result;
}

function printValidationResults(results, title, isRequired = false) {
  console.log(`\n${colors.bold(colors.blue(title))}`);
  console.log('='.repeat(title.length));

  results.forEach(result => {
    const statusIcon = result.status === 'valid' ? '✅' : 
                      result.status === 'missing' ? (isRequired ? '❌' : '⚠️') : '❌';
    
    const statusColor = result.status === 'valid' ? colors.green : 
                       result.status === 'missing' ? (isRequired ? colors.red : colors.yellow) : colors.red;
    
    console.log(`${statusIcon} ${colors.bold(result.name)}: ${statusColor(result.value)}`);
    
    if (result.issues.length > 0) {
      result.issues.forEach(issue => {
        console.log(`   ${colors.red('→')} ${issue}`);
      });
    }
  });
}

function main() {
  console.log(colors.bold(colors.green('🔍 Environment Variables Validation')));
  console.log(colors.gray(`Environment: ${process.env.NODE_ENV || 'development'}`));
  console.log(colors.gray(`Timestamp: ${new Date().toISOString()}`));

  // Validate required variables
  const requiredResults = Object.entries(ENV_CONFIG.required).map(([name, config]) => 
    validateEnvironmentVariable(name, config, process.env[name])
  );

  // Validate optional variables
  const optionalResults = Object.entries(ENV_CONFIG.optional).map(([name, config]) => 
    validateEnvironmentVariable(name, config, process.env[name])
  );

  // Print results
  printValidationResults(requiredResults, 'Required Environment Variables', true);
  printValidationResults(optionalResults, 'Optional Environment Variables', false);

  // Summary
  const requiredValid = requiredResults.filter(r => r.status === 'valid').length;
  const requiredTotal = requiredResults.length;
  const requiredMissing = requiredResults.filter(r => r.status === 'missing').length;
  const requiredInvalid = requiredResults.filter(r => r.status === 'invalid').length;

  const optionalSet = optionalResults.filter(r => r.status === 'valid').length;
  const optionalTotal = optionalResults.length;

  console.log(`\n${colors.bold(colors.blue('📊 Validation Summary'))}`);
  console.log('='.repeat(20));
  
  console.log(`Required Variables: ${colors.green(`${requiredValid}/${requiredTotal} valid`)}`);
  if (requiredMissing > 0) {
    console.log(`                   ${colors.red(`${requiredMissing} missing`)}`);
  }
  if (requiredInvalid > 0) {
    console.log(`                   ${colors.red(`${requiredInvalid} invalid`)}`);
  }
  
  console.log(`Optional Variables: ${colors.green(`${optionalSet}/${optionalTotal} configured`)}`);

  // Recommendations
  if (requiredMissing > 0 || requiredInvalid > 0) {
    console.log(`\n${colors.bold(colors.red('❌ Validation Failed'))}`);
    console.log(colors.red('Please fix the required variables before deploying to production.'));
    
    console.log(`\n${colors.bold(colors.yellow('💡 Recommendations:'))}`);
    requiredResults.forEach(result => {
      if (result.status !== 'valid') {
        const config = ENV_CONFIG.required[result.name];
        console.log(`${colors.yellow('→')} ${result.name}: ${config.description}`);
        console.log(`   Example: ${colors.gray(config.example)}`);
      }
    });
    
    process.exit(1);
  } else {
    console.log(`\n${colors.bold(colors.green('✅ Validation Passed'))}`);
    console.log(colors.green('All required environment variables are properly configured.'));
    
    if (optionalSet < optionalTotal) {
      console.log(`\n${colors.bold(colors.yellow('💡 Optional Enhancements:'))}`);
      optionalResults.forEach(result => {
        if (result.status === 'missing') {
          const config = ENV_CONFIG.optional[result.name];
          console.log(`${colors.yellow('→')} ${result.name}: ${config.description}`);
          console.log(`   Example: ${colors.gray(config.example)}`);
        }
      });
    }
    
    process.exit(0);
  }
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error(colors.red('Unhandled Rejection:'), reason);
  process.exit(1);
});

// Run validation
main();