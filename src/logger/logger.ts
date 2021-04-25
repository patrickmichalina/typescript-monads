import { IMonad } from '../monad/monad.interface'

/**
 * @name Logger
 * @class Perform calculation while collecting logs 
 */
export class Logger<TLogs, TValue> implements IMonad<TValue>  {

  /**
   * @description Construct a Logger object.
   * @constructor
   * @param {TLogs[]} logs The collection of logs.
   * @param {TValue} value The value to wrap.
   */
  constructor(private readonly logs: TLogs[], private readonly value: TValue) { }

  /**
   * @name Logger
   * @description Helper function to build a Logger object.
   * @static
   * @param {TLogs[]} story The collection of logs.
   * @param {TValue} value The value to wrap.
   * @returns {Logger<TLogs, TValue>} A Logger object containing the collection of logs and value.
   */
  public static logger<TLogs, TValue>(logs: TLogs[], value: TValue): Logger<TLogs, TValue> {
    return new Logger(logs, value)
  }

  public static tell<TLogs>(s: TLogs): Logger<TLogs, number> {
    return new Logger([s], 0)
  }

  public static startWith<TLogs, TValue>(s: TLogs, value: TValue): Logger<TLogs, TValue> {
    return new Logger([s], value)
  }

  public of<TValue>(v: TValue): Logger<TLogs, TValue> {
    return new Logger<TLogs, TValue>([], v)
  }

  public flatMap<TValueB>(fn: (value: TValue) => Logger<TLogs, TValueB>): Logger<TLogs, TValueB> {
    const result = fn(this.value)
    return new Logger(this.logs.concat(result.logs), result.value)
  }

  public flatMapPair<TValueB>(fn: (value: TValue) => [TLogs, TValueB]): Logger<TLogs, TValueB> {
    const result = fn(this.value)
    return new Logger(this.logs.concat(result[0]), result[1])
  }

  public runUsing<TOutput>(fn: (opts: { logs: TLogs[]; value: TValue }) => TOutput): TOutput {
    return fn({ logs: this.logs, value: this.value })
  }

}
