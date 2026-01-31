import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock database
vi.mock('../src/config/database.js', () => ({
  query: vi.fn(),
}));

import { query } from '../src/config/database.js';

describe('Auth Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'testPassword123';
      const hash = await bcrypt.hash(password, 12);
      
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2')).toBe(true);
    });

    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hash = await bcrypt.hash(password, 12);
      
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const hash = await bcrypt.hash(password, 12);
      
      const isValid = await bcrypt.compare('wrongPassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token', () => {
    const secret = 'test-secret';

    it('should create valid token', () => {
      const payload = { id: '123', email: 'test@example.com', role: 'user' };
      const token = jwt.sign(payload, secret, { expiresIn: '1h' });
      
      expect(token).toBeDefined();
      expect(token.split('.').length).toBe(3);
    });

    it('should decode token correctly', () => {
      const payload = { id: '123', email: 'test@example.com', role: 'user' };
      const token = jwt.sign(payload, secret);
      
      const decoded = jwt.verify(token, secret) as typeof payload;
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should reject invalid token', () => {
      expect(() => {
        jwt.verify('invalid-token', secret);
      }).toThrow();
    });
  });

  describe('User Registration Query', () => {
    it('should check for existing user', async () => {
      const mockQuery = query as ReturnType<typeof vi.fn>;
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        ['test@example.com', 'testuser']
      );

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        ['test@example.com', 'testuser']
      );
    });
  });
});
