import { mkdir, copyFileSync } from 'fs'
import { resolve } from 'path'

const targetDir = 'dist'
const filesToCopy: ReadonlyArray<string> = [
  'package.json',
  'README.md',
  'LICENSE'
]

const run =
  (dir: string) =>
    (files: ReadonlyArray<string>) =>
      mkdir(resolve(dir), dirResolved(files)(dir))

const mapper =
  (dir: string) =>
    (file: string) => {
      return {
        from: resolve(file),
        to: resolve(dir, file)
      }
    }

const dirResolved =
  (files: ReadonlyArray<string>) =>
    (dir: string) => (_err?: any) =>
      files.map(mapper(dir)).forEach(paths => copyFileSync(paths.from, paths.to))

run(targetDir)(filesToCopy)