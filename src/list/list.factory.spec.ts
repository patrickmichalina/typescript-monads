import { listFrom, listOf } from './list.factory'

describe('List Factory', () => {
  describe(listFrom.name, () => {
    it('should', () => {
      const sut = listFrom([1, 2]).filter(a => a > 1)

      expect(sut.toArray()).toEqual([2])
    })

    it('should handle undefined', () => {
      const sut = listFrom<number>().filter(a => a > 1)

      expect(sut.toArray()).toEqual([])
    })
  })

  describe(listOf.name, () => {
    it('should handle nominal', () => {
      const sut = listOf(1, 2).filter(a => a > 1)

      expect(sut.toArray()).toEqual([2])
    })

    it('should handle undefined', () => {
      const sut = listOf<number>().filter(a => a > 1)

      expect(sut.toArray()).toEqual([])
    })
  })
})
