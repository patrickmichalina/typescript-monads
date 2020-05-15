import { Reader } from './reader'

export function reader<TConfig, TOut>(fn: (config: TConfig) => TOut) {
  return new Reader<TConfig, TOut>(fn)
}