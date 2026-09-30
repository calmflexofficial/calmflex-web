import { spawn } from 'node:child_process';

const npmCommand = process.env.npm_execpath ? process.execPath : process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npmPrefix = process.env.npm_execpath ? [process.env.npm_execpath] : [];
const children = ['frontend', 'backend'].map((workspace) => {
  const child = spawn(npmCommand, [...npmPrefix, 'run', 'dev', '--workspace', workspace], {
    stdio: 'inherit',
    shell: !process.env.npm_execpath && process.platform === 'win32'
  });
  child.on('exit', (code) => {
    if (code && code !== 0) stop(code);
  });
  child.on('error', (error) => {
    console.error(`Could not start ${workspace}: ${error.message}`);
    stop(1);
  });
  return child;
});

function stop(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill('SIGINT');
  }
  process.exitCode = code;
}

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());