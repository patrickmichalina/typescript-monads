import { List } from './list'

describe(List.name, () => {
  it('should spread to array', () => {
    const sut = List.of(1, 2, 6, 10).toArray()

    expect(sut).toEqual([1, 2, 6, 10])
  })

  it('sdasd', () => {
    const sut = List.from([1, 6]).toArray()

    expect(sut).toEqual([1, 6])
  })

  describe('should get head', () => {
    it('should ...', () => {
      const sut = List.from([1, 6]).headOr(0)

      expect(sut).toEqual(1)
    })

    it('should ...', () => {
      const sut = List.from<number>([]).headOr(0)

      expect(sut).toEqual(0)
    })

    it('should ...', () => {
      const sut = List.from<number>([1]).headOr(0)

      expect(sut).toEqual(1)
    })
  })

  it('should range', () => {
    const sut = List.range<number>(2, 5).toArray()

    expect(sut).toEqual([2, 3, 4, 5])

    console.log(List.integers.toArray())
  })
})