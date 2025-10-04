#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests PostgreSQL and Redis connections for Railway deployment
 */

const { PrismaClient } = require('@prisma/client');
const Redis = require('redis');

async function testPostgreSQL() {
  console.log('🔍 Testing PostgreSQL connection...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ PostgreSQL connection successful');

    // Test query execution
    const result = await prisma.$queryRaw`SELECT version() as version, now() as current_time`;
    console.log('✅ PostgreSQL query test successful');
    console.log(`   Database version: ${result[0].version.split(' ')[0]} ${result[0].version.split(' ')[1]}`);
    console.log(`   Current time: ${result[0].current_time}`);

    // Test database schema
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    console.log(`✅ Found ${tables.length} tables in database`);

    // Test if migrations are applied
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Database schema is ready (found ${userCount} users)`);
    } catch (error) {
      console.log('⚠️  Database schema not found - migrations may need to be run');
    }

  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }

  return true;
}

async function testRedis() {
  console.log('\n🔍 Testing Redis connection...');

  if (!process.env.REDIS_URL) {
    console.log('⚠️  REDIS_URL not configured - skipping Redis test');
    return true;
  }

  let client;
  try {
    // Create Redis client
    client = Redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 10000,
        lazyConnect: true
      }
    });

    // Connect to Redis
    await client.connect();
    console.log('✅ Redis connection successful');

    // Test basic operations
    await client.set('test:connection', 'success', { EX: 60 });
    const value = await client.get('test:connection');
    
    if (value === 'success') {
      console.log('✅ Redis read/write test successful');
    } else {
      console.log('❌ Redis read/write test failed');
      return false;
    }

    // Get Redis info
    const info = await client.info('server');
    const redisVersion = info.match(/redis_version:([^\r\n]+)/)?.[1];
    if (redisVersion) {
      console.log(`✅ Redis version: ${redisVersion}`);
    }

    // Clean up test key
    await client.del('test:connection');

  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    return false;
  } finally {
    if (client) {
      await client.quit();
    }
  }

  return true;
}

async function testEnvironmentVariables() {
  console.log('\n🔍 Testing environment variables...');

  const requiredVars = [
    'DATABASE_URL',
    'NODE_ENV',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET'
  ];

  const optionalVars = [
    'REDIS_URL',
    'ALLOWED_ORIGINS',
    'COOKIE_DOMAIN',
    'AWS_ACCESS_KEY_ID',
    'SENDGRID_API_KEY'
  ];

  let allRequired = true;

  // Check required variables
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName} is set`);
    } else {
      console.log(`❌ ${varName} is missing (required)`);
      allRequired = false;
    }
  }

  // Check optional variables
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName} is set`);
    } else {
      console.log(`⚠️  ${varName} is not set (optional)`);
    }
  }

  return allRequired;
}

async function main() {
  console.log('🚀 Railway Database Connection Test\n');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Timestamp:', new Date().toISOString());
  console.log('='.repeat(50));

  const results = {
    environment: await testEnvironmentVariables(),
    postgresql: await testPostgreSQL(),
    redis: await testRedis()
  };

  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary:');
  console.log(`   Environment Variables: ${results.environment ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   PostgreSQL Connection: ${results.postgresql ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Redis Connection: ${results.redis ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Database services are ready.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please check the configuration.');
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
main().catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});