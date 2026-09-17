import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import type { VercelRequest, VercelResponse } from './vercel-types';

const COOKIE = 'glicopress_session';
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? 'development-only-change-me');
export const normalizeEmail = (email: unknown) => typeof email === 'string' ? email.trim().toLowerCase() : '';
export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);
export async function setSession(res: VercelResponse, userId: string) { const token = await new SignJWT({ sub: userId }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('30d').sign(secret()); res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`); }
export function clearSession(res: VercelResponse) { res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`); }
export async function getSessionUserId(req: VercelRequest) { const raw = req.headers.cookie?.split(';').map(v => v.trim()).find(v => v.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1); if (!raw) return null; try { return (await jwtVerify(raw, secret())).payload.sub ?? null; } catch { return null; } }
export function json(res: VercelResponse, status: number, body: unknown) { return res.status(status).json(body); }
export function method(req: VercelRequest, allowed: string[]) { return allowed.includes(req.method ?? '') ? true : false; }
export function safeError(res: VercelResponse, error: unknown) { console.error('API request failed', error instanceof Error ? error.name : 'unknown'); return json(res, 500, { error: 'Não foi possível concluir a operação.' }); }
