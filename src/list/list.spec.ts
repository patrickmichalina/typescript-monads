import { List } from './list'

describe(List.name, () => {
  describe('Integers', () => {
    it('should', () => {
      const sut = List
        .integers()
        .headOrUndefined()

      expect(sut).toEqual(0)
    })
  })

  describe('Range', () => {
    it('should support stepping', () => {
      const sut = List.range(4, 10, 2)

      expect(sut.toArray()).toEqual([4, 6, 8, 10])
    })
  })

  describe('Empty', () => {
    it('should', () => {
      const sut = List.empty().toArray()

      expect(sut.length).toEqual(0)
    })
  })

  it('should spread to array', () => {
    const sut = List.of(1, 2, 6, 10).toArray()

    expect(sut).toEqual([1, 2, 6, 10])
  })

  it('should toIterable', () => {
    const sut = List.of(1, 2, 6, 10).toIterable()

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

    it('should headOrUndefined', () => {
      const sut1 = List.from<number>([1]).headOrUndefined()
      const sut2 = List.from<number>([]).headOrUndefined()

      expect(sut1).toEqual(1)
      expect(sut2).toBeUndefined()
    })

    it('should headOrCompute', () => {
      const sut = List.from<number>([]).headOrCompute(() => 67)

      expect(sut).toEqual(67)
    })

    it('should headOrThrow', () => {
      expect(() => {
        List.from<number>([]).headOrThrow('errrr')
      }).toThrowError('errrr')
    })
  })

  it('should range', () => {
    const sut = List.range(2, 5).toArray()

    expect(sut).toEqual([2, 3, 4, 5])

  })

  describe('should map', () => {
    it('should ...', () => {
      const sut = List.of(1, 2, 5)
        .map(x => x + 3)
        .toArray()

      expect(sut).toEqual([4, 5, 8])
    })
  })

  describe('should scan', () => {
    it('should ...', () => {
      const sut = List.from([1, 2, 3, 4])
        .scan((acc, curr) => curr + acc, 0)
        .toArray()

      expect(sut).toEqual([1, 3, 6, 10])
    })
  })

  describe('should reduce', () => {
    it('should ...', () => {
      const sut = List.of(1, 2, 3, 4).reduce((acc, curr) => acc + curr, 0)

      expect(sut).toEqual(10)
    })
  })

  describe('should filter', () => {
    it('should ...', () => {
      const sut = List.of(1, 2, 5)
        .filter(x => x > 2)
        .toArray()

      expect(sut).toEqual([5])
    })

    it('should alias where to filter', () => {
      const sut = List.of(1, 2, 5)
        .where(x => x > 2)
        .toArray()

      expect(sut).toEqual([5])
    })
  })

  it('should join arrays', () => {
    const sut = List.of(1)
      .concat(2)
      .concat(3)
      .concat(4, 5)
      .concat([6, 7])
      .concat([8, 9], [10, 11])
      .toArray()

    expect(sut).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
  })

  describe('should all', () => {
    it('should', () => {
      const sut = List.of('test 1', 'test 2', 'test 3')

      expect(sut.all(a => a.includes('test'))).toEqual(true)
    })
    it('should', () => {
      const sut = List.of('test 1', 'UGH!', 'test 2', 'test 3')

      expect(sut.all(a => a.includes('test'))).toEqual(false)
    })
  })

  describe('should any', () => {
    it('should', () => {
      const sut = List.of('test 1', 'test 2', 'test 3')

      expect(sut.any(a => a.includes('test'))).toEqual(true)
    })
    it('should', () => {
      const sut = List.of('test 1', 'UGH!', 'test 2', 'test 3')

      expect(sut.any(a => a.includes('NOTHERE'))).toEqual(false)
    })
  })
})