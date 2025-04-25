import { reader, readerOf, ask, asks, sequence, traverse, combine, Reader } from './public_api'

describe('Reader monad public API', () => {
  it('should export and create instances correctly', () => {
    expect(reader(() => { return 1 })).toBeInstanceOf(Reader)
  })

  it('should export all factory functions', () => {
    expect(reader).toBeDefined()
    expect(readerOf).toBeDefined()
    expect(ask).toBeDefined()
    expect(asks).toBeDefined()
    expect(sequence).toBeDefined()
    expect(traverse).toBeDefined()
    expect(combine).toBeDefined()
  })

  it('should export the Reader class', () => {
    expect(Reader).toBeDefined()
    expect(Reader.of).toBeDefined()
    expect(Reader.ask).toBeDefined()
    expect(Reader.asks).toBeDefined()
    expect(Reader.sequence).toBeDefined()
    expect(Reader.traverse).toBeDefined()
    expect(Reader.combine).toBeDefined()
  })

  it('should create and run Readers correctly', () => {
    const r1 = reader<{name: string}, string>(env => `Hello, ${env.name}!`)
    const r2 = asks<{name: string}, string>(env => env.name)
    const r3 = readerOf<{name: string}, number>(42)

    expect(r1.run({name: 'Alice'})).toBe('Hello, Alice!')
    expect(r2.run({name: 'Bob'})).toBe('Bob')
    expect(r3.run({name: 'Charlie'})).toBe(42)
  })
})
