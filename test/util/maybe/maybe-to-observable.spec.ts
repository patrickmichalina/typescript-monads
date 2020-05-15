import { assert, integer, property } from 'fast-check'
import { maybeToObservable } from '../../../src/util'
import { merge, of } from 'rxjs'
import { count } from 'rxjs/operators'
import { maybe } from '../../../src/maybe/maybe'

describe('maybeToObservable', () => {
  const numRuns = 100
  it('emits a value when containing a value', () => {
    expect.assertions(numRuns)
    assert(
      property(
        integer(),
        a => {
          const m = maybe(a)
          const o = maybeToObservable(m)
          o.subscribe(val => expect(val).toBe(a))
        }
      ), {
        numRuns
      }
    )
  })

  it('immediately completes if there is no contained value', done => {

    const m = maybe()
    const o = maybeToObservable(m)
    const c = of(1)

    merge(o, c)
      .pipe(count())
      .subscribe(count => {
        expect(count).toBe(1)
        done()
      })
  })
})
