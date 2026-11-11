import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { User } from '../models/user.model.js';
import { ROLES } from '../constants/roles.js';

describe('Authentication & Profile Endpoints', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123!',
    interests: ['chess', 'reading']
  };

  it('POST /api/auth/register should successfully register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.role).toBe(ROLES.USER);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('POST /api/auth/register should reject duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('POST /api/auth/register should NOT allow public registration to set role as admin', async () => {
    const maliciousPayload = {
      name: 'Hacker User',
      email: 'hacker@example.com',
      password: 'Password123!',
      role: 'admin'
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(maliciousPayload);

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe(ROLES.USER);

    const savedUser = await User.findOne({ email: 'hacker@example.com' });
    expect(savedUser?.role).toBe(ROLES.USER);
  });

  it('POST /api/auth/login should authenticate valid credentials', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('POST /api/auth/login should reject incorrect password with 401', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword999!'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/me should return authenticated user profile', async () => {
    const regRes = await request(app).post('/api/auth/register').send(testUser);
    const token = regRes.body.data.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('GET /api/auth/me should reject requests without token with 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/me should reject invalid JWT token with 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.value');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
