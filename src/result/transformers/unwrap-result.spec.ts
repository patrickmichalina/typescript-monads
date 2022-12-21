import { map, of } from 'rxjs'
import { ok, fail } from '../result.factory'
import { unwrapResultAsObservable } from './unwrap-result'

describe('unwrapResult', () => {
  it('should unwrap ok', (done) => {
    const sut = of(ok<number, string>(1))

    sut.pipe(
      unwrapResultAsObservable(),
      map(a => a + 1)
    ).subscribe({
      next: v => {
        expect(v).toEqual(2)
        done()
      },
      error: e => {
        expect('should not emit from .error').toEqual(false)
        done(e)
      }
    })
  })

  it('should unwrap fail', done => {
    const sut = of(fail<number, string>('i failed'))

    sut.pipe(
      unwrapResultAsObservable(),
      map(a => a + 2)
    ).subscribe({
      error: (v) => {
        expect(v).toEqual('i failed')
        done()
      },
      next: val => {
        expect('should not emit from .next').toEqual(false)
        done(val)
      }
    })
  })

})
