import { curry2, curry3, curry4, curry5, curry6, curry7 } from '../../src/util/curry'

describe('curry', () => {
  it('should work with 2 arguments', () => {
    const add = (a: number, b: number) => a + b
    const add1to = curry2(add)(1)
    
    expect(add1to(2)).toEqual(3)
  })

  it('should work with 3 arguments', () => {
    const add = (a: number, b: number, c: number) => a + b + c
    const addCurried = curry3(add)
    const add3to = addCurried(1)(2)
    
    expect(add3to(2)).toEqual(5)
  })

  it('should work with 4 arguments', () => {
    const add = (a: number, b: number, c: number, d: number) => a + b + c + d
    const addCurried = curry4(add)
    const add3to = addCurried(1)(1)(1)
    
    expect(add3to(2)).toEqual(5)
  })

  it('should work with 5 arguments', () => {
    const add = (a: number, b: number, c: number, d: number, e: number) => a + b + c + d + e
    const addCurried = curry5(add)
    const add4to = addCurried(1)(1)(1)(1)
    
    expect(add4to(1)).toEqual(5)
  })

  it('should work with 6 arguments', () => {
    const add = (a: number, b: number, c: number, d: number, e: number, f: number) => a + b + c + d + e + f
    const addCurried = curry6(add)
    const add5to = addCurried(1)(1)(1)(1)(1)
    
    expect(add5to(1)).toEqual(6)
  })

  it('should work with 7 arguments', () => {
    const add = (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => a + b + c + d + e + f + g
    const addCurried = curry7(add)
    const add6to = addCurried(1)(1)(1)(1)(1)(1)
    
    expect(add6to(1)).toEqual(7)
  })
})