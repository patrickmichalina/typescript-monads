import { reader, maybe } from '../monads/index'

export interface GetFromEnvironmentReader {
  readEnv(key: string): string | undefined
}

const DEFAULT_NODE_ENV_READER: GetFromEnvironmentReader = {
  readEnv(key: string) {
    return process.env[key]
  }
}

const maybeFromEnvReader = (key: string) => (reader: GetFromEnvironmentReader) => maybe(reader.readEnv(key))

export function maybeEnv(key: string, config?: GetFromEnvironmentReader) {
  return reader(maybeFromEnvReader(key))
    .run(maybe(config).valueOr(DEFAULT_NODE_ENV_READER))
}
