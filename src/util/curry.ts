export const curry2 =
  <T1, T2, TReturn>(fn: (arg1: T1, arg2: T2) => TReturn) =>
    (a1: T1) =>
      (a2: T2) =>
        fn(a1, a2)

export const curry3 =
  <T1, T2, T3, TReturn>(fn: (arg1: T1, arg2: T2, arg3: T3) => TReturn) =>
    (a1: T1) =>
      (a2: T2) =>
        (a3: T3) =>
          fn(a1, a2, a3)

export const curry4 =
  <T1, T2, T3, T4, TReturn>(fn: (arg1: T1, arg2: T2, arg3: T3, arg4: T4) => TReturn) =>
    (a1: T1) =>
      (a2: T2) =>
        (a3: T3) =>
          (a4: T4) =>
            fn(a1, a2, a3, a4)

export const curry5 =
  <T1, T2, T3, T4, T5, TReturn>(fn: (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5) => TReturn) =>
    (a1: T1) =>
      (a2: T2) =>
        (a3: T3) =>
          (a4: T4) =>
            (a5: T5) =>
              fn(a1, a2, a3, a4, a5)

export const curry6 =
  <T1, T2, T3, T4, T5, T6, TReturn>(fn: (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6) => TReturn) =>
    (a1: T1) =>
      (a2: T2) =>
        (a3: T3) =>
          (a4: T4) =>
            (a5: T5) =>
              (a6: T6) =>
                fn(a1, a2, a3, a4, a5, a6)

export const curry7 =
  <T1, T2, T3, T4, T5, T6, T7, TReturn>(fn: (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6, arg7: T7) => TReturn) =>
    (a1: T1) =>
      (a2: T2) =>
        (a3: T3) =>
          (a4: T4) =>
            (a5: T5) =>
              (a6: T6) =>
                (a7: T7) =>
                  fn(a1, a2, a3, a4, a5, a6, a7)