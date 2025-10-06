import { describe, it, expect } from 'vitest';
import { ErrorTranslator } from './ErrorTranslator';

describe('ErrorTranslator', () => {
  describe('translate', () => {
    it('should translate postgres duplicate error', () => {
      const error = { code: '23505', message: 'duplicate key value' };
      expect(ErrorTranslator.translate(error)).toBe('error.duplicate');
    });

    it('should translate auth invalid credentials error', () => {
      const error = { code: 'invalid_grant', message: 'Invalid login credentials' };
      expect(ErrorTranslator.translate(error)).toBe('auth.errors.invalidCredentials');
    });

    it('should translate network error', () => {
      const error = { message: 'ECONNREFUSED connection refused' };
      expect(ErrorTranslator.translate(error)).toBe('error.network');
    });

    it('should translate timeout error', () => {
      const error = { message: 'Request timed out' };
      expect(ErrorTranslator.translate(error)).toBe('error.timeout');
    });

    it('should return unknown for unrecognized errors', () => {
      const error = { message: 'Some random error' };
      expect(ErrorTranslator.translate(error)).toBe('error.unknown');
    });

    it('should handle null/undefined errors', () => {
      expect(ErrorTranslator.translate(null)).toBe('error.unknown');
      expect(ErrorTranslator.translate(undefined)).toBe('error.unknown');
    });
  });

  describe('getDetailedMessage', () => {
    it('should return key and details', () => {
      const error = { code: '23505', message: 'duplicate key', details: 'Key already exists' };
      const result = ErrorTranslator.getDetailedMessage(error);
      expect(result.key).toBe('error.duplicate');
      expect(result.details).toBe('Key already exists');
    });
  });

  describe('translateWithFallback', () => {
    it('should use fallback on error', () => {
      const result = ErrorTranslator.translateWithFallback(null, 'error.custom');
      expect(result).toBe('error.unknown');
    });
  });
});
