import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { User } from '../models/user.model.js';
import { Note } from '../models/note.model.js';
import { Post } from '../models/post.model.js';
import { ROLES } from '../constants/roles.js';

describe('Admin User Management & RBAC Protection', () => {
  let adminToken: string;
  let normalUserToken: string;
  let adminUser: any;
  let targetUser: any;

  beforeEach(async () => {
    adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@example.com',
      password: 'Password123!',
      role: ROLES.ADMIN
    });

    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'Password123!'
    });
    adminToken = adminLogin.body.data.token;

    targetUser = await User.create({
      name: 'Regular Bob',
      email: 'bob@example.com',
      password: 'Password123!',
      role: ROLES.USER,
      interests: ['chess']
    });

    const userLogin = await request(app).post('/api/auth/login').send({
      email: 'bob@example.com',
      password: 'Password123!'
    });
    normalUserToken = userLogin.body.data.token;
  });

  it('Normal user cannot access GET /api/admin/users (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${normalUserToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Admin can list users with pagination', async () => {
    const res = await request(app)
      .get('/api/admin/users?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.users.length).toBe(2);
    expect(res.body.pagination.total).toBe(2);
  });

  it('Admin can create regular users but cannot assign the admin role', async () => {
    const escalationRes = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Attempted Admin',
        email: 'attempted-admin@example.com',
        password: 'Password123!',
        role: ROLES.ADMIN
      });

    expect(escalationRes.status).toBe(400);

    const createRes = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Regular User',
        email: 'regular-user@example.com',
        password: 'Password123!'
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.user.role).toBe(ROLES.USER);
  });

  it('Admin cannot change a user role', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${targetUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: ROLES.ADMIN });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    const unchangedUser = await User.findById(targetUser._id);
    expect(unchangedUser?.role).toBe(ROLES.USER);
  });

  it('Admin can update account details without changing the user role', async () => {
    const updateRes = await request(app)
      .patch(`/api/admin/users/${targetUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Updated Bob',
        email: 'updated-bob@example.com',
        password: 'NewPassword123!'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.user.name).toBe('Updated Bob');
    expect(updateRes.body.data.user.role).toBe(ROLES.USER);

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'updated-bob@example.com',
      password: 'NewPassword123!'
    });
    expect(loginRes.status).toBe(200);
  });

  it('Admin cannot delete their own account', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${adminUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/cannot delete their own account/i);
  });

  it('Admin can view posts but cannot publish them', async () => {
    await Post.create({ title: 'User Post', content: 'Public content', userId: targetUser._id });

    const viewRes = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(viewRes.status).toBe(200);
    expect(viewRes.body.data.posts).toHaveLength(1);

    const createRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Admin Post', content: 'Not allowed' });

    expect(createRes.status).toBe(403);
  });

  it('Admin can only view notes and cannot create, update, or delete them', async () => {
    const note = await Note.create({
      title: 'Bob Note',
      content: 'Note content',
      userId: targetUser._id
    });

    const viewRes = await request(app)
      .get(`/api/notes/${note._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(viewRes.status).toBe(200);

    const createRes = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Admin Note', content: 'Not allowed' });
    expect(createRes.status).toBe(403);

    const updateRes = await request(app)
      .patch(`/api/notes/${note._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Changed by admin' });
    expect(updateRes.status).toBe(403);

    const deleteRes = await request(app)
      .delete(`/api/notes/${note._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(403);
  });

  it('Admin can remove a user account without deleting their notes or posts', async () => {
    const note = await Note.create({ title: 'Bob Note', content: 'Note content', userId: targetUser._id });
    const post = await Post.create({ title: 'Bob Post', content: 'Post content', userId: targetUser._id });

    const deleteRes = await request(app)
      .delete(`/api/admin/users/${targetUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);

    expect(await User.findById(targetUser._id)).toBeNull();
    expect(await Note.findById(note._id)).not.toBeNull();
    expect(await Post.findById(post._id)).not.toBeNull();

    const retainedNoteRes = await request(app)
      .get(`/api/notes/${note._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(retainedNoteRes.status).toBe(200);
  });
});
