#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const NEXT_DIR = path.join(__dirname, '..', '.next');
const PORT = 3000;

console.log('🧹 Cleaning up before starting dev server...\n');

// Step 1: Kill process on port 3000
try {
  console.log(`📍 Checking for processes on port ${PORT}...`);

  // On Windows, use netstat to find and kill the process
  if (process.platform === 'win32') {
    try {
      const output = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf-8' });
      const lines = output.split('\n').filter(line => line.includes('LISTENING'));

      if (lines.length > 0) {
        const pids = lines.map(line => {
          const parts = line.trim().split(/\s+/);
          return parts[parts.length - 1];
        }).filter(pid => pid && pid !== '0');

        const uniquePids = [...new Set(pids)];
        console.log(`   Found ${uniquePids.length} process(es) on port ${PORT}`);

        uniquePids.forEach(pid => {
          try {
            console.log(`   Killing process ${pid}...`);
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          } catch (e) {
            // Process might already be dead
          }
        });

        console.log('   ✓ Processes killed');
        // Wait a moment for processes to fully terminate
        execSync('timeout /t 1 /nobreak', { stdio: 'ignore' });
      } else {
        console.log('   ✓ No process found on port');
      }
    } catch (e) {
      // No process found on port, which is fine
      console.log('   ✓ Port is free');
    }
  } else {
    // Unix-based systems
    try {
      execSync(`lsof -ti:${PORT} | xargs kill -9`, { stdio: 'ignore' });
      console.log('   ✓ Processes killed');
    } catch (e) {
      console.log('   ✓ Port is free');
    }
  }
} catch (error) {
  console.log('   ⚠ Error checking port, continuing...');
}

// Step 2: Force remove .next directory
try {
  console.log('\n📁 Removing .next directory...');

  if (fs.existsSync(NEXT_DIR)) {
    // Use rimraf for reliable deletion on Windows
    const { rimrafSync } = require('rimraf');
    rimrafSync(NEXT_DIR, { maxRetries: 3, retryDelay: 100 });
    console.log('   ✓ .next directory removed');
  } else {
    console.log('   ✓ .next directory does not exist');
  }
} catch (error) {
  console.error('   ⚠ Failed to remove .next directory:', error.message);
  console.log('   Trying alternative method...');

  try {
    // Fallback: use system commands
    if (process.platform === 'win32') {
      execSync(`rmdir /s /q "${NEXT_DIR}"`, { stdio: 'ignore' });
    } else {
      execSync(`rm -rf "${NEXT_DIR}"`, { stdio: 'ignore' });
    }
    console.log('   ✓ .next directory removed (fallback method)');
  } catch (fallbackError) {
    console.error('   ✗ Could not remove .next directory');
    console.log('   You may need to manually delete it or restart your computer');
  }
}

console.log('\n✨ Cleanup complete! Starting dev server...\n');
