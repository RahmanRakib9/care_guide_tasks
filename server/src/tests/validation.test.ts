import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Zod Validation Middleware & Boundary Conditions', () => {
  let userToken: string;

  beforeEach(async () => {
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Validation Tester',
      email: 'valtester@example.com',
      password: 'Password123!'
    });
    userToken = regRes.body.data.token;
  });

  it('rejects registration with invalid email format', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bad Email',
      email: 'not-an-email',
      password: 'Password123!'
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors[0].field).toBe('email');
  });

  it('rejects registration with short password (< 6 chars)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Short Password',
      email: 'shortpass@example.com',
      password: '123'
    });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('password');
  });

  it('rejects note creation with missing title or content', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Only Title'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects empty update payload on PATCH /api/notes/:id', async () => {
    const noteRes = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Test Note',
        content: 'Content'
      });
    const noteId = noteRes.body.data.note._id;

    const res = await request(app)
      .patch(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/validation failed/i);
  });

  it('rejects invalid MongoDB ObjectId route parameter', async () => {
    const res = await request(app)
      .get('/api/notes/non-hex-id-1234')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors[0].field).toBe('id');
  });

  it('rejects pagination with limit > 100', async () => {
    const res = await request(app)
      .get('/api/notes?limit=999')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('limit');
  });

  it('rejects pagination with page <= 0', async () => {
    const res = await request(app)
      .get('/api/notes?page=0')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('page');
  });
});
