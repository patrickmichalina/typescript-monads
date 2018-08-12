import { either } from '../src'

describe('Either', () => {
  it('when calling should throw if both sides are defined', () => {
    expect(() => {
      const leftInput = 'The String'
      const rightInput = 'The String'
      either(leftInput, rightInput)
    }).toThrowError(TypeError('Either cannot have both a left and a right'))
  })
  it('when calling should throw if no sides are defined', () => {
    expect(() => {
      const leftInput = undefined
      const rightInput = undefined
      either(leftInput, rightInput)
    }).toThrowError(TypeError('Either requires a left or a right'))
  })
  it('should be left', () => {
    const leftInput = 'tester'
    const rightInput = undefined

    const eitherThing = either(leftInput, rightInput)

    expect(eitherThing.isLeft()).toBeTruthy()
    expect(eitherThing.isRight()).toBeFalsy()
  })
  it('should be right', () => {
    const leftInput = undefined
    const rightInput = 'tester'

    const eitherThing = either(leftInput, rightInput)

    expect(eitherThing.isRight()).toBeTruthy()
    expect(eitherThing.isLeft()).toBeFalsy()
  })

  it('should map to match right side', () => {
    const leftInput: number | undefined = undefined
    const rightInput = 'tester'

    const eitherThing = either(leftInput, rightInput)

    const mapped = eitherThing.match({
      left: num => '123',
      right: str => `${str}_right`
    })

    expect(mapped).toEqual('tester_right')
  })

  it('should map to match left side', () => {
    const leftInput = 123
    const rightInput: string | undefined = undefined

    const eitherThing = either(leftInput, rightInput)

    const mapped = eitherThing.match({
      left: num => `${num}_left`,
      right: str => `${str}_right`
    })

    expect(mapped).toEqual('123_left')
  })

  it('should map right biased', () => {
    const input1 = 123
    const input2: number | undefined = undefined

    const eitherThing = either(input2, input1)
    const eitherThing2 = either(input1, input2)

    const mapped = eitherThing
      .map(rightNum => rightNum + 12)
      .match({
        left: () => 3,
        right: num => num
      })

    expect(mapped).toEqual(135)

    const mapped2 = eitherThing2
      .map(rightNum => rightNum + 12)
      .match({
        left: () => 3,
        right: num => num
      })

    expect(mapped2).toEqual(3)
  })

  it('should flatMap', () => {
    const input1 = 123
    const input2: number | undefined = undefined

    const eitherThing = either(input2, input1)

    const mapped = eitherThing
      .flatMap(rightNum => either(rightNum, input2))
      .match({
        left: () => 3,
        right: num => num
      })

    expect(mapped).toEqual(3)
  })

  it('should flatMap left', () => {
    const input1 = 123
    const input2: number | undefined = undefined

    const eitherThing = either(input1, input2)

    const mapped = eitherThing
      .flatMap(rightNum => either(rightNum, input2))
      .match({
        left: () => 3,
        right: num => num
      })

    expect(mapped).toEqual(3)
  })
})