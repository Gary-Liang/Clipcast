const { execSync } = require('child_process');

const PORT = process.env.PORT || 3001;

console.log(`🔍 Checking for processes on port ${PORT}...`);

try {
  if (process.platform === 'win32') {
    // Windows
    const output = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf8' });

    if (output) {
      const lines = output.trim().split('\n');
      const pids = new Set();

      lines.forEach(line => {
        const match = line.match(/LISTENING\s+(\d+)/);
        if (match) {
          pids.add(match[1]);
        }
      });

      if (pids.size > 0) {
        console.log(`💀 Killing ${pids.size} process(es)...`);
        pids.forEach(pid => {
          try {
            execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
            console.log(`   ✅ Killed PID ${pid}`);
          } catch (err) {
            console.log(`   ⚠️  Could not kill PID ${pid}`);
          }
        });
      } else {
        console.log(`✨ Port ${PORT} is already free`);
      }
    } else {
      console.log(`✨ Port ${PORT} is already free`);
    }
  } else {
    // Unix/Linux/Mac
    try {
      const output = execSync(`lsof -ti:${PORT}`, { encoding: 'utf8' });
      const pids = output.trim().split('\n').filter(Boolean);

      if (pids.length > 0) {
        console.log(`💀 Killing ${pids.length} process(es)...`);
        pids.forEach(pid => {
          try {
            execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
            console.log(`   ✅ Killed PID ${pid}`);
          } catch (err) {
            console.log(`   ⚠️  Could not kill PID ${pid}`);
          }
        });
      } else {
        console.log(`✨ Port ${PORT} is already free`);
      }
    } catch (err) {
      console.log(`✨ Port ${PORT} is already free`);
    }
  }
} catch (error) {
  // No processes found - port is free
  console.log(`✨ Port ${PORT} is already free`);
}

console.log('');
