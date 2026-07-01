import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const cwd = process.cwd()
const testDir = path.join(cwd, 'test')

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(fullPath) : [fullPath]
  })
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: false })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

const files = walk(testDir)
const testFiles = files.filter((file) => /(_spec|\.(spec|test))\.(cjs|mjs|js|ts|tsx|jsx)$/.test(file))

if (testFiles.length) {
  run('npx', ['vitest', 'run'])
} else {
  console.log('No tests found; skipping.')
}
