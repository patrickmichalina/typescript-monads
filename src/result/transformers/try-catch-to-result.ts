import { fail, ok } from '../result.factory'
import { IResult } from '../result.interface'

/**
 * Ingest a try-catch throwable function so that it doesn't halt the program but instead 
 * returns an IResult
 * @param fn a throwable function
 * @returns an IResult object which wraps the execution as either fail or success
 */
export function catchResult<TValue, TError>(fn: () => TValue): IResult<TValue, TError> {
  try {
    return ok<TValue, TError>(fn())
  } catch(err) {
    return fail<TValue, TError>(err as TError)
  }
}
