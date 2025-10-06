import { vi } from 'vitest';

export const mockSupabaseClient: any = {
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
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      getPublicUrl: vi.fn(),
    })),
  },
};

export const resetMocks = () => {
  Object.values(mockSupabaseClient).forEach((mock: any) => {
    if (typeof mock === 'function' && mock.mockClear) {
      mock.mockClear();
    }
  });
  if (mockSupabaseClient.auth) {
    Object.values(mockSupabaseClient.auth).forEach((mock: any) => {
      if (mock?.mockClear) mock.mockClear();
    });
  }
  if (mockSupabaseClient.storage?.from?.mockClear) {
    mockSupabaseClient.storage.from.mockClear();
  }
};
