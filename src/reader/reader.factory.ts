import { Reader } from './reader'
import { IReader } from './reader.interface'

export function reader<TConfig, TOut>(fn: (config: TConfig) => TOut): IReader<TConfig, TOut> {
  return new Reader<TConfig, TOut>(fn)
}
