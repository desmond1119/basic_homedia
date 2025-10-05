/**
 * Result Pattern
 * Type-safe error handling without exceptions
 */

export class Result<T, E = Error> {
  private readonly _isSuccess: boolean;
  private readonly _value?: T;
  private readonly _error?: E;

  private constructor(isSuccess: boolean, value?: T, error?: E) {
    this._isSuccess = isSuccess;
    this._value = value;
    this._error = error;
  }

  public static ok<T, E = Error>(value: T): Result<T, E> {
    return new Result<T, E>(true, value);
  }

  public static fail<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  public isSuccess(): boolean {
    return this._isSuccess;
  }

  public isFailure(): boolean {
    return !this._isSuccess;
  }

  public getValue(): T {
    if (!this._isSuccess || this._value === undefined) {
      throw new Error('Cannot get value from failed result');
    }
    return this._value;
  }

  public getError(): E {
    if (this._isSuccess || this._error === undefined) {
      throw new Error('Cannot get error from successful result');
    }
    return this._error;
  }

  public getValueOrDefault(defaultValue: T): T {
    return this._isSuccess && this._value !== undefined ? this._value : defaultValue;
  }
}
