// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { spawn } = require('child_process')

const projectRoot = path.resolve(__dirname, '..')
const lockPath = path.join(projectRoot, '.next', 'dev', 'lock')

if (fs.existsSync(lockPath)) {
  try {
    fs.unlinkSync(lockPath)
    console.log('Oude dev-lock verwijderd.')
  } catch (_) {}
}

const isWin = process.platform === 'win32'
const child = spawn(isWin ? 'npx' : 'npx', ['next', 'dev', '-p', '3000'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: isWin, // Windows: npx moet via shell (cmd) draaien i.v.m. spawn EINVAL
})

child.on('exit', (code) => process.exit(code ?? 0))
