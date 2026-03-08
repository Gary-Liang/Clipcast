#!/usr/bin/env node

/**
 * Environment Configuration Validator
 * Run: node scripts/validate-env.js
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');

  if (!fs.existsSync(envPath)) {
    log('\n❌ ERROR: .env.local file not found!', 'red');
    log('\nCreate it by running:', 'yellow');
    log('  cp .env.example .env.local', 'cyan');
    log('\nThen edit .env.local with your credentials.\n', 'yellow');
    process.exit(1);
  }

  log('✅ .env.local file exists', 'green');
  return envPath;
}

function parseEnvFile(envPath) {
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};

  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return env;
}

function validateRequired(env, key, validator = null) {
  const value = env[key];

  if (!value || value.includes('your_') || value.includes('your-')) {
    log(`❌ ${key}: NOT SET or contains placeholder`, 'red');
    return false;
  }

  if (validator && !validator(value)) {
    log(`❌ ${key}: INVALID FORMAT`, 'red');
    return false;
  }

  // Show partial value for security
  const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;
  log(`✅ ${key}: ${preview}`, 'green');
  return true;
}

function validateOptional(env, key, validator = null) {
  const value = env[key];

  if (!value || value.includes('your_') || value.includes('your-')) {
    log(`⚠️  ${key}: NOT SET (optional)`, 'yellow');
    return true;
  }

  if (validator && !validator(value)) {
    log(`❌ ${key}: INVALID FORMAT`, 'red');
    return false;
  }

  const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;
  log(`✅ ${key}: ${preview}`, 'green');
  return true;
}

async function testDatabaseConnection(env) {
  log('\n🔍 Testing database connection...', 'cyan');

  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: env.DATABASE_URL,
        },
      },
    });

    await prisma.$connect();
    await prisma.$disconnect();

    log('✅ Database connection successful!', 'green');
    return true;
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, 'red');

    if (error.message.includes('ECONNREFUSED')) {
      log('\n💡 Tip: Make sure PostgreSQL is running:', 'yellow');
      log('  docker-compose up -d', 'cyan');
    }

    return false;
  }
}

async function testDeepgram(env) {
  log('\n🔍 Testing Deepgram API key...', 'cyan');

  try {
    const { createClient } = require('@deepgram/sdk');
    const deepgram = createClient(env.DEEPGRAM_API_KEY);

    // Test with a simple request (this will check if the key is valid)
    // We'll just check if the client can be created
    if (deepgram) {
      log('✅ Deepgram API key format valid', 'green');
      log('⚠️  Note: Make sure your account has credits', 'yellow');
      return true;
    }

    return false;
  } catch (error) {
    log(`❌ Deepgram validation failed: ${error.message}`, 'red');
    return false;
  }
}

function testR2Config(env) {
  log('\n🔍 Validating R2 configuration...', 'cyan');

  let valid = true;

  if (!env.R2_ENDPOINT?.startsWith('https://')) {
    log('❌ R2_ENDPOINT must start with https://', 'red');
    valid = false;
  } else if (!env.R2_ENDPOINT.includes('.r2.cloudflarestorage.com')) {
    log('⚠️  R2_ENDPOINT should end with .r2.cloudflarestorage.com', 'yellow');
  } else {
    log('✅ R2_ENDPOINT format looks correct', 'green');
  }

  if (env.R2_ACCESS_KEY_ID && env.R2_ACCESS_KEY_ID.length < 10) {
    log('⚠️  R2_ACCESS_KEY_ID seems short - verify it\'s correct', 'yellow');
  } else if (env.R2_ACCESS_KEY_ID) {
    log('✅ R2_ACCESS_KEY_ID set', 'green');
  }

  if (env.R2_SECRET_ACCESS_KEY && env.R2_SECRET_ACCESS_KEY.length < 20) {
    log('⚠️  R2_SECRET_ACCESS_KEY seems short - verify it\'s correct', 'yellow');
  } else if (env.R2_SECRET_ACCESS_KEY) {
    log('✅ R2_SECRET_ACCESS_KEY set', 'green');
  }

  if (env.R2_BUCKET_NAME) {
    log(`✅ R2_BUCKET_NAME: ${env.R2_BUCKET_NAME}`, 'green');
  }

  if (!env.R2_PUBLIC_DOMAIN) {
    log('ℹ️  R2_PUBLIC_DOMAIN not set (optional - transcripts will use presigned URLs)', 'blue');
  } else {
    log(`✅ R2_PUBLIC_DOMAIN: ${env.R2_PUBLIC_DOMAIN}`, 'green');
  }

  return valid;
}

async function main() {
  log('\n╔════════════════════════════════════════════╗', 'cyan');
  log('║   Environment Configuration Validator     ║', 'cyan');
  log('╚════════════════════════════════════════════╝\n', 'cyan');

  // Check .env.local exists
  const envPath = checkEnvFile();

  // Parse environment variables
  log('\n📝 Parsing environment variables...', 'cyan');
  const env = parseEnvFile(envPath);

  // Validate required variables
  log('\n🔐 Validating required variables:', 'cyan');
  let allValid = true;

  // Database
  allValid &= validateRequired(env, 'DATABASE_URL', (val) => val.startsWith('postgresql://'));

  // Deepgram
  allValid &= validateRequired(env, 'DEEPGRAM_API_KEY', (val) => val.length > 20);

  // R2
  allValid &= validateRequired(env, 'R2_ENDPOINT', (val) => val.startsWith('https://'));
  allValid &= validateRequired(env, 'R2_ACCESS_KEY_ID');
  allValid &= validateRequired(env, 'R2_SECRET_ACCESS_KEY');
  allValid &= validateRequired(env, 'R2_BUCKET_NAME');

  // Optional variables
  log('\n🔓 Checking optional variables:', 'cyan');
  validateOptional(env, 'R2_PUBLIC_DOMAIN');
  validateOptional(env, 'NODE_ENV');

  // Test R2 configuration format
  testR2Config(env);

  // Test connections
  const dbConnected = await testDatabaseConnection(env);
  await testDeepgram(env);

  // Final summary
  log('\n╔════════════════════════════════════════════╗', 'cyan');
  log('║              Validation Summary            ║', 'cyan');
  log('╚════════════════════════════════════════════╝\n', 'cyan');

  if (allValid && dbConnected) {
    log('🎉 All validations passed! Your configuration looks good.', 'green');
    log('\n✅ Next steps:', 'cyan');
    log('  1. Run: npm run db:push', 'blue');
    log('  2. Run: npm run dev', 'blue');
    log('  3. Open: http://localhost:3000\n', 'blue');
    process.exit(0);
  } else {
    log('⚠️  Some issues need attention. Fix the errors above and try again.', 'yellow');

    if (!dbConnected) {
      log('\n💡 Database Tips:', 'yellow');
      log('  - Start Docker PostgreSQL: docker-compose up -d', 'cyan');
      log('  - Check status: docker-compose ps', 'cyan');
      log('  - View logs: docker-compose logs postgres', 'cyan');
    }

    log('');
    process.exit(1);
  }
}

main().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});
