import { mkdir, copyFileSync } from 'fs'
import { resolve } from 'path'

const targetDir = 'dist'
const filesToCopy: ReadonlyArray<string> = [
  'package.json',
  'README.md',
  'LICENSE'
]

function run(dir: string) {
  return function(files: ReadonlyArray<string>) {
    mkdir(resolve(dir), dirResolved(files)(dir))
  }
}

function mapper(dir: string) {
  return function (file: string) {
    return {
      from: resolve(file),
      to: resolve(dir, file)
    }
  }
}

function dirResolved(files: ReadonlyArray<string>) {
  return function(dir: string) {
    return function (_err?: any) {
      files.map(mapper(dir)).forEach(paths => copyFileSync(paths.from, paths.to))
    }
  }
}

run(targetDir)(filesToCopy)