import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
const metadata = {
  version: pkg.version,
  build: process.env.GITHUB_RUN_NUMBER || 'local',
  commit: (process.env.GITHUB_SHA || 'dev').slice(0, 8),
  builtAt: new Date().toISOString()
}
const output = JSON.stringify(metadata, null, 2) + '\n'
mkdirSync(path.join(root, 'src', 'generated'), { recursive: true })
writeFileSync(path.join(root, 'src', 'generated', 'build.json'), output)
writeFileSync(path.join(root, 'public', 'version.json'), output)
console.log('Hayko build:', metadata)
