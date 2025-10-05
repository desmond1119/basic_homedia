/**
 * Enhanced Async Thunk Creator
 * Provides better error handling for Redux async operations
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { Result } from '@/core/domain/base/Result';

interface ThunkError {
  message: string;
  code?: string;
}

export const createAsyncThunkWithError = <Returned, ThunkArg = void>(
  typePrefix: string,
  payloadCreator: (
    arg: ThunkArg
  ) => Promise<Result<Returned, Error>>
) => {
  return createAsyncThunk<Returned, ThunkArg, { rejectValue: ThunkError }>(
    typePrefix,
    async (arg, { rejectWithValue }) => {
      const result = await payloadCreator(arg);

      if (result.isFailure()) {
        const error = result.getError();
        return rejectWithValue({
          message: error.message,
          code: 'code' in error ? (error.code as string) : undefined,
        });
      }

      return result.getValue();
    }
  );
};
