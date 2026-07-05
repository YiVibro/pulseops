const fs = require('fs');
const os = require('os');

// Read CPU stats from /proc/stat (Linux)
function readCpuTimes() {
  const data = fs.readFileSync('/proc/stat', 'utf8');
  const line = data.split('\n')[0]; // first line = aggregate CPU
  const parts = line.trim().split(/\s+/).slice(1).map(Number);
  const [user, nice, system, idle, iowait, irq, softirq, steal] = parts;
  const idleTime = idle + iowait;
  const totalTime = user + nice + system + idle + iowait + irq + softirq + steal;
  return { idleTime, totalTime };
}

let prevCpu = readCpuTimes();

function getCpuUsage() {
  const curr = readCpuTimes();
  const idleDelta = curr.idleTime - prevCpu.idleTime;
  const totalDelta = curr.totalTime - prevCpu.totalTime;
  prevCpu = curr;
  const usage = totalDelta === 0 ? 0 : (1 - idleDelta / totalDelta) * 100;
  return Math.round(usage * 100) / 100;
}

function getMemoryUsage() {
  const data = fs.readFileSync('/proc/meminfo', 'utf8');
  const lines = data.split('\n');
  const get = (key) => {
    const line = lines.find(l => l.startsWith(key));
    return line ? parseInt(line.match(/\d+/)[0], 10) : 0;
  };
  const total = get('MemTotal:');
  const available = get('MemAvailable:');
  const usedPercent = total === 0 ? 0 : ((total - available) / total) * 100;
  return Math.round(usedPercent * 100) / 100;
}

function getDiskUsage() {
  // Fallback using statfs via child_process (cross-platform safe)
  const { execSync } = require('child_process');
  try {
    const output = execSync("df -k / | tail -1 | awk '{print $5}'").toString().trim();
    return parseFloat(output.replace('%', ''));
  } catch (err) {
    return 0;
  }
}

function collectMetrics(serverId) {
  return {
    serverId,
    cpu: getCpuUsage(),
    memory: getMemoryUsage(),
    disk: getDiskUsage(),
    timestamp: Date.now(),
  };
}

module.exports = { collectMetrics };