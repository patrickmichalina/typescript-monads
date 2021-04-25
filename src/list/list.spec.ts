import { List } from './list'
import { listFrom } from './list.factory'

class Animal {
  constructor(public name: string, public nickname?: string) { }
}

class Dog extends Animal {
  dogtag!: string
  dogyear!: number
}

class Cat extends Animal {
  likesCatnip = true
}

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
      expect(sut.some(a => a.includes('test'))).toEqual(true)
    })
    it('should', () => {
      const sut = List.of('test 1', 'UGH!', 'test 2', 'test 3')

      expect(sut.any(a => a.includes('NOTHERE'))).toEqual(false)
      expect(sut.some(a => a.includes('NOTHERE'))).toEqual(false)
    })
  })

  describe('take', () => {
    it('should ...', () => {
      const sut = List.of(1, 2, 3)

      expect(sut.take(3).toArray()).toEqual([1, 2, 3])
      expect(sut.take(2).toArray()).toEqual([1, 2])
      expect(sut.take(1).toArray()).toEqual([1])
      expect(sut.take(0).toArray()).toEqual([])
    })
  })

  describe('InstanceOf', () => {
    it('should filter on instance', () => {
      const dog = new Dog('Rex')
      const cat = new Cat('Meow')
      const sut = List.of<Animal>(dog, cat)

      expect(sut.ofType(Cat).toArray().length).toEqual(1)
      expect(sut.ofType(Cat).toArray()).toEqual([cat])
      expect(sut.ofType(Dog).toArray().length).toEqual(1)
      expect(sut.ofType(Dog).toArray()).toEqual([dog])
    })
  })

  describe('Drop', () => {
    it('should', () => {
      const sut = List.of(1, 5, 10, 15, 20).drop(1).drop(1).toArray()
      const sut2 = listFrom(sut).drop(2).toArray()
      const sut3 = listFrom(sut2).tail().toArray()

      expect(sut).toEqual([10, 15, 20])
      expect(sut2).toEqual([20])
      expect(sut3).toEqual([])
    })
  })

  describe('ToDictionary', () => {
    const Rex = new Dog('Rex', 'Rdawg')
    const Meow = new Cat('Meow')
    const sut = List.of<Animal>(Rex, Meow)

    it('should handle nominal keyed case', () => {
      expect(sut.toDictionary('name')).toEqual({ Rex, Meow })
    })

    it('should handle unkeyed', () => {
      expect(sut.toDictionary()).toEqual({ 0: Rex, 1: Meow })
    })

    it('should handle missing keys', () => {
      expect(sut.toDictionary('nickname')).toEqual({ Rdawg: Rex })
    })
  })

  describe('sum', () => {
    it('should sum the list', () => {
      const sut = List.of(3, 20, 10)
      const sut2 = List.of('how sume this?', 'no way')

      expect(sut.sum()).toEqual(33)
      expect(sut2.sum()).toEqual(0)
    })
  })

  // describe('OrderBy', () => {
  //   it('should order by object', () => {
  //     const dog1 = new Dog('Atlas')
  //     const dog2 = new Dog('Zues')
  //     const sut = List.of<Dog>(dog1, dog2)

  //     expect(sut.orderBy('dogtag').toEqual([]))
  //     expect(sut.orderBy('name')).toEqual([])
  //   })

  //   it('should order by number', () => {
  //     const sut = List.of(1, 2, 5, 3, 12)

  //     expect(sut.orderBy().toEqual([]))
  //     expect(sut.orderBy()).toEqual([])
  //   })

  //   it('should order by string', () => {
  //     const sut = List.of('abc', 'efg', 'zel', 'lmao')

  //     expect(sut.orderBy().toEqual([]))
  //     expect(sut.orderBy()).toEqual([])
  //   })
  // })
})
