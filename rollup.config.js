import typescript from '@rollup/plugin-typescript'
import pkg from './package.json'

export default [
  {
    input: 'dist/lib/index.js',
    output: {
      name: 'monads',
      file: `dist/${pkg.main}`,
      format: 'umd',
      sourcemap: true
    },
  },
  {
  input: 'src/index.ts',
  output: [
    { file: `dist/${pkg.module}`, format: 'es', sourcemap: true },
    { file: `dist/${pkg.commonJs}`, format: 'cjs', sourcemap: true }
  ],
  plugins: [typescript()]
}]
