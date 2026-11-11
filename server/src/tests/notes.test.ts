import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { User } from '../models/user.model.js';
import { Note } from '../models/note.model.js';
import { ROLES } from '../constants/roles.js';

describe('Notes CRUD and RBAC', () => {
  let user1Token: string;
  let user2Token: string;
  let adminToken: string;
  let user1: any;
  let user2: any;

  beforeEach(async () => {
    const res1 = await request(app).post('/api/auth/register').send({
      name: 'User One',
      email: 'user1@example.com',
      password: 'Password123!'
    });
    user1Token = res1.body.data.token;
    user1 = res1.body.data.user;

    const res2 = await request(app).post('/api/auth/register').send({
      name: 'User Two',
      email: 'user2@example.com',
      password: 'Password123!'
    });
    user2Token = res2.body.data.token;
    user2 = res2.body.data.user;

    await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Password123!',
      role: ROLES.ADMIN
    });

    const adminLoginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'Password123!'
    });
    adminToken = adminLoginRes.body.data.token;
  });

  it('POST /api/notes should allow an authenticated user to create a note', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'User 1 First Note',
        content: 'This is my private note content.'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.note.title).toBe('User 1 First Note');
    expect(res.body.data.note.userId).toBe(user1._id);
  });

  it('GET /api/notes should only return the authenticated user notes for normal users', async () => {
    await Note.create({ title: 'U1 Note A', content: 'Content A', userId: user1._id });
    await Note.create({ title: 'U1 Note B', content: 'Content B', userId: user1._id });
    await Note.create({ title: 'U2 Note X', content: 'Content X', userId: user2._id });

    const res = await request(app)
      .get('/api/notes')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.notes.length).toBe(2);
    expect(res.body.pagination.total).toBe(2);
    res.body.data.notes.forEach((note: any) => {
      expect(note.userId._id.toString()).toBe(user1._id);
    });
  });

  it('GET /api/notes should return all users notes when accessed by an admin', async () => {
    await Note.create({ title: 'U1 Note A', content: 'Content A', userId: user1._id });
    await Note.create({ title: 'U2 Note X', content: 'Content X', userId: user2._id });

    const res = await request(app)
      .get('/api/notes')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.notes.length).toBe(2);
    expect(res.body.pagination.total).toBe(2);
  });

  it('GET /api/notes/:id should reject normal user accessing another user note with 403', async () => {
    const user2Note = await Note.create({
      title: 'Secret Note',
      content: 'Top secret',
      userId: user2._id
    });

    const res = await request(app)
      .get(`/api/notes/${user2Note._id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/permission/i);
  });

  it('PATCH /api/notes/:id should reject normal user modifying another user note with 403', async () => {
    const user2Note = await Note.create({
      title: 'Secret Note',
      content: 'Top secret',
      userId: user2._id
    });

    const res = await request(app)
      .patch(`/api/notes/${user2Note._id}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Tampered Title' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('DELETE /api/notes/:id should reject normal user deleting another user note with 403', async () => {
    const user2Note = await Note.create({
      title: 'Secret Note',
      content: 'Top secret',
      userId: user2._id
    });

    const res = await request(app)
      .delete(`/api/notes/${user2Note._id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('User can successfully update and delete their own note', async () => {
    const note = await Note.create({
      title: 'Initial Title',
      content: 'Initial Content',
      userId: user1._id
    });

    const updateRes = await request(app)
      .patch(`/api/notes/${note._id}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ title: 'Updated Title' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.note.title).toBe('Updated Title');

    const deleteRes = await request(app)
      .delete(`/api/notes/${note._id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(deleteRes.status).toBe(200);

    const checkRes = await request(app)
      .get(`/api/notes/${note._id}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(checkRes.status).toBe(404);
  });

  it('Admin can view but cannot update or delete any user note', async () => {
    const userNote = await Note.create({
      title: 'User Note',
      content: 'User Content',
      userId: user1._id
    });

    const viewRes = await request(app)
      .get(`/api/notes/${userNote._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(viewRes.status).toBe(200);

    const updateRes = await request(app)
      .patch(`/api/notes/${userNote._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Admin Modified' });
    expect(updateRes.status).toBe(403);

    const deleteRes = await request(app)
      .delete(`/api/notes/${userNote._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(403);

    const unchangedNote = await Note.findById(userNote._id);
    expect(unchangedNote?.title).toBe('User Note');
  });

  it('GET /api/notes supports pagination with page and limit parameters', async () => {
    const notesToCreate = Array.from({ length: 15 }, (_, i) => ({
      title: `Note ${i + 1}`,
      content: `Content for note ${i + 1}`,
      userId: user1._id
    }));
    await Note.insertMany(notesToCreate);

    const res = await request(app)
      .get('/api/notes?page=2&limit=5')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.notes.length).toBe(5);
    expect(res.body.pagination.page).toBe(2);
    expect(res.body.pagination.limit).toBe(5);
    expect(res.body.pagination.total).toBe(15);
    expect(res.body.pagination.totalPages).toBe(3);
  });
});
