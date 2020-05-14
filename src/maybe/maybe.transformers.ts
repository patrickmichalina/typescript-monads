// export const maybeToPromise =
//   (catchResponse: any = 'not found') =>
//     <T>(maybe: IMaybe<T>) => maybe.isSome()
//       ? Promise.resolve(maybe.valueOrUndefined() as T)
//       : Promise.reject(catchResponse)
