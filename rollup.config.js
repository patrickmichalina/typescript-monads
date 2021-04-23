import typescript from '@rollup/plugin-typescript'
import pkg from './package.json'

export default [
  {
    input: 'dist/index.js',
    output: {
      name: 'monads',
      file: `dist/${pkg.main}`,
      format: 'umd',
      globals: {
        rxjs: 'rxjs',
        'rxjs/operators': 'rxjs/operators'
      },
      sourcemap: true
    },
    external: [
      'rxjs',
      'rxjs/operators'
    ]
  },
  {
    input: 'src/index.ts',
    output: [
      { file: `dist/${pkg.module}`, format: 'es', sourcemap: true },
      { file: `dist/${pkg.commonJs}`, format: 'cjs', sourcemap: true }
    ],
    external: [
      'rxjs',
      'rxjs/operators'
    ],
    plugins: [typescript({ tsconfig: 'tsconfig.build.json' })]
  }]
