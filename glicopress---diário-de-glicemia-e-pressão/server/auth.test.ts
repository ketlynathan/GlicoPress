import { describe, expect, it } from 'vitest';
import { hashPassword, normalizeEmail, verifyPassword } from './auth';

describe('authentication primitives', () => {
  it('normalizes email without exposing credentials', () => expect(normalizeEmail('  User@Example.COM ')).toBe('user@example.com'));
  it('hashes passwords and verifies only the original password', async () => { const hash = await hashPassword('strong-password'); expect(hash).not.toContain('strong-password'); expect(await verifyPassword('strong-password', hash)).toBe(true); expect(await verifyPassword('wrong-password', hash)).toBe(false); });
});
