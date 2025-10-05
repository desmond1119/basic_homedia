import { vi } from 'vitest';

export const mockSupabaseClient = {
  from: vi.fn(() => mockSupabaseClient),
  select: vi.fn(() => mockSupabaseClient),
  insert: vi.fn(() => mockSupabaseClient),
  update: vi.fn(() => mockSupabaseClient),
  delete: vi.fn(() => mockSupabaseClient),
  eq: vi.fn(() => mockSupabaseClient),
  single: vi.fn(() => mockSupabaseClient),
  range: vi.fn(() => mockSupabaseClient),
  order: vi.fn(() => mockSupabaseClient),
  rpc: vi.fn(() => mockSupabaseClient),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      getPublicUrl: vi.fn(),
    })),
  },
};

export const resetMocks = () => {
  Object.values(mockSupabaseClient).forEach(mock => {
    if (typeof mock === 'function') mock.mockClear();
  });
  if (mockSupabaseClient.storage.from) {
    (mockSupabaseClient.storage.from as ReturnType<typeof vi.fn>).mockClear();
  }
};
