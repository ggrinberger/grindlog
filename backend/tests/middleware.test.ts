import { describe, it, expect, vi } from 'vitest';
import { createError, AppError } from '../src/middleware/errorHandler.js';

describe('Error Handler', () => {
  describe('createError', () => {
    it('should create error with message and status', () => {
      const error = createError('Not found', 404);
      
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(true);
    });

    it('should create error with different status codes', () => {
      const badRequest = createError('Bad request', 400);
      const unauthorized = createError('Unauthorized', 401);
      const serverError = createError('Server error', 500);
      
      expect(badRequest.statusCode).toBe(400);
      expect(unauthorized.statusCode).toBe(401);
      expect(serverError.statusCode).toBe(500);
    });
  });
});

describe('Validation', () => {
  it('should validate email format', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    expect(emailRegex.test('test@example.com')).toBe(true);
    expect(emailRegex.test('invalid-email')).toBe(false);
    expect(emailRegex.test('test@')).toBe(false);
    expect(emailRegex.test('@example.com')).toBe(false);
  });

  it('should validate password length', () => {
    const minLength = 6;
    
    expect('short'.length >= minLength).toBe(false);
    expect('longenough'.length >= minLength).toBe(true);
  });

  it('should validate username length', () => {
    const minLength = 3;
    const maxLength = 50;
    
    expect('ab'.length >= minLength).toBe(false);
    expect('abc'.length >= minLength).toBe(true);
    expect('a'.repeat(51).length <= maxLength).toBe(false);
  });
});
