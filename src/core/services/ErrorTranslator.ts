interface SupabaseError extends Error {
  code?: string;
  details?: string;
  hint?: string;
}

export class ErrorTranslator {
  private static postgresErrorMap: Record<string, string> = {
    'PGRST116': 'error.notFound',
    'PGRST301': 'error.unauthorized',
    'PGRST204': 'error.noContent',
    '23505': 'error.duplicate',
    '23503': 'error.foreignKeyViolation',
    '23502': 'error.notNullViolation',
    '42P01': 'error.tableNotFound',
    '42501': 'error.insufficientPrivilege',
    '42883': 'error.undefinedFunction',
    '22P02': 'error.invalidTextRepresentation',
  };

  private static networkErrorMap: Record<string, string> = {
    'ECONNREFUSED': 'error.network',
    'ETIMEDOUT': 'error.timeout',
    'ENOTFOUND': 'error.network',
    'ENETUNREACH': 'error.network',
  };

  private static storageErrorMap: Record<string, string> = {
    'Payload too large': 'error.fileTooLarge',
    'Invalid file type': 'error.invalidFileType',
    'Storage quota exceeded': 'error.storageQuotaExceeded',
  };

  static translate(error: Error | unknown): string {
    if (!error) return 'error.unknown';

    const supabaseError = error as SupabaseError;
    const errorMessage = supabaseError.message || String(error);
    const errorCode = supabaseError.code;

    if (errorCode && this.postgresErrorMap[errorCode]) {
      return this.postgresErrorMap[errorCode];
    }

    for (const [code, key] of Object.entries(this.networkErrorMap)) {
      if (errorMessage.includes(code) || errorCode === code) {
        return key;
      }
    }

    for (const [pattern, key] of Object.entries(this.storageErrorMap)) {
      if (errorMessage.includes(pattern)) {
        return key;
      }
    }

    const lowerMessage = errorMessage.toLowerCase();
    if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
      return 'error.network';
    }

    if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
      return 'error.timeout';
    }

    if (lowerMessage.includes('permission') || lowerMessage.includes('unauthorized')) {
      return 'error.unauthorized';
    }

    if (lowerMessage.includes('not found')) {
      return 'error.notFound';
    }

    if (lowerMessage.includes('duplicate') || lowerMessage.includes('already exists')) {
      return 'error.duplicate';
    }

    return 'error.unknown';
  }

  static getDetailedMessage(error: Error | unknown): { key: string; details?: string } {
    const key = this.translate(error);
    const supabaseError = error as SupabaseError;
    const details = supabaseError.details || supabaseError.message;
    return { key, details };
  }

  static translateWithFallback(error: Error | unknown, fallbackKey = 'error.unknown'): string {
    try {
      return this.translate(error);
    } catch {
      return fallbackKey;
    }
  }
}
