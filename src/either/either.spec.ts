import { either } from './either.factory'

describe(either.name, () => {
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
      left: () => '123',
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
    const input2 = undefined as number | undefined

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
    const input2 = undefined as number | undefined

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
    const input2 = undefined as number | undefined

    const eitherThing = either(input1, input2)

    const mapped = eitherThing
      .flatMap(rightNum => either(rightNum, input2))
      .match({
        left: () => 3,
        right: num => num
      })

    expect(mapped).toEqual(3)
  })

  it('should tap left', () => {
    expect.assertions(6)

    const input1 = 123
    const input2 = undefined

    const eitherThing = either(input1, input2)

    const mapped1 = eitherThing
      .tap({
        right: () => fail(),
        left: leftSideEffect => {
          expect(leftSideEffect).toEqual(123)
        }
      })

    const mapped2 = eitherThing
      .tap({
        left: leftSideEffect => expect(leftSideEffect).toEqual(123)
      })
    const mapped3 = eitherThing
      .tap({
        right: () => fail()
      })

    const mapped4 = eitherThing.tap({})

    expect(mapped1).toEqual(undefined)
    expect(mapped2).toEqual(undefined)
    expect(mapped3).toEqual(undefined)
    expect(mapped4).toEqual(undefined)
  })

  it('should tap right', () => {
    expect.assertions(6)

    const input1 = undefined
    const input2: number | undefined = 123

    const eitherThing = either(input1, input2)

    const mapped1 = eitherThing
      .tap({
        left: () => fail(),
        right: rightSideEffect => expect(rightSideEffect).toEqual(123)
      })

    const mapped2 = eitherThing
      .tap({
        left: () => fail()
      })
    const mapped3 = eitherThing
      .tap({
        right: rightSideEffect => expect(rightSideEffect).toEqual(123)
      })
    const mapped4 = eitherThing.tap({})

    expect(mapped1).toEqual(undefined)
    expect(mapped2).toEqual(undefined)
    expect(mapped3).toEqual(undefined)
    expect(mapped4).toEqual(undefined)
  })
})
