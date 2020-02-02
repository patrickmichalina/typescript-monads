import typescript from '@rollup/plugin-typescript'
import pkg from './package.json'

export default [
  {
    input: 'dist/index.js',
    output: {
      name: 'monads',
      file: pkg.main,
      format: 'umd',
      sourcemap: true
    },
  },
  {
  input: 'src/index.ts',
  output: [
    { file: pkg.module, format: 'es', sourcemap: true },
    { file: pkg.commonJs, format: 'cjs', sourcemap: true }
  ],
  plugins: [typescript()]
}]
