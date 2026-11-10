import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import { User } from '../models/user.model';
import { Note } from '../models/note.model';
import { Post } from '../models/post.model';
import { ROLES } from '../constants/roles';

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
      interests: ['coding']
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

  it('Admin can create a new user with role assignment', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'New Admin Member',
        email: 'secondadmin@example.com',
        password: 'Password123!',
        role: ROLES.ADMIN,
        interests: ['management', 'security']
      });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe(ROLES.ADMIN);
    expect(res.body.data.user.email).toBe('secondadmin@example.com');
  });

  it('Admin cannot demote their own account', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${adminUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: ROLES.USER });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/cannot demote their own account/i);
  });

  it('Admin cannot delete their own account', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${adminUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/cannot delete their own account/i);
  });

  it('Cannot demote or delete the last administrator', async () => {
    const admin2 = await User.create({
      name: 'Second Admin',
      email: 'admin2@example.com',
      password: 'Password123!',
      role: ROLES.ADMIN
    });
    const admin2Login = await request(app).post('/api/auth/login').send({
      email: 'admin2@example.com',
      password: 'Password123!'
    });
    const _admin2Token = admin2Login.body.data.token;

    await request(app)
      .delete(`/api/admin/users/${admin2._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const demoteRes = await request(app)
      .patch(`/api/admin/users/${adminUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: ROLES.USER });

    expect(demoteRes.status).toBe(400);
  });

  it('Admin can delete a normal user and cascade cleanup their notes and posts', async () => {
    await Note.create({ title: 'Bob Note', content: 'Note content', userId: targetUser._id });
    await Post.create({ title: 'Bob Post', content: 'Post content', userId: targetUser._id });

    const deleteRes = await request(app)
      .delete(`/api/admin/users/${targetUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);

    const remainingNotes = await Note.find({ userId: targetUser._id });
    const remainingPosts = await Post.find({ userId: targetUser._id });
    expect(remainingNotes.length).toBe(0);
    expect(remainingPosts.length).toBe(0);
  });
});
