/**
 * Loading State Types
 * Standardized loading states for async operations
 */

export type LoadingState = 'idle' | 'pending' | 'succeeded' | 'failed';

export interface AsyncState {
  status: LoadingState;
  error: string | null;
}

export const initialAsyncState: AsyncState = {
  status: 'idle',
  error: null,
};
