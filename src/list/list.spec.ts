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
      const sut = List.from([1, 6])

      expect(sut.headOr(0)).toEqual(1)
      expect(sut.headOr(3)).toEqual(1)
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
    const sut = List.range(2, 5).toArray()

    expect(sut).toEqual([2, 3, 4, 5])

  })
})