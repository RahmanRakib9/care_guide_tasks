import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { User } from '../models/user.model';
import { Post } from '../models/post.model';
import { ROLES } from '../constants/roles';

describe('Critical Aggregation Scenarios', () => {
  let adminToken: string;
  let user1Token: string;
  let user1: any;
  let user2: any;
  let user3: any;

  beforeEach(async () => {
    await User.create({
      name: 'Admin Group Manager',
      email: 'admin@example.com',
      password: 'Password123!',
      role: ROLES.ADMIN,
      interests: ['management', 'security']
    });

    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'Password123!'
    });
    adminToken = adminLogin.body.data.token;

    user1 = await User.create({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'Password123!',
      role: ROLES.USER,
      interests: ['coding', 'music']
    });

    user2 = await User.create({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'Password123!',
      role: ROLES.USER,
      interests: ['coding', 'reading']
    });

    user3 = await User.create({
      name: 'Charlie',
      email: 'charlie@example.com',
      password: 'Password123!',
      role: ROLES.USER,
      interests: []
    });

    const user1Login = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'Password123!'
    });
    user1Token = user1Login.body.data.token;
  });

  describe('Aggregation Scenario 1 — Group Users by Interests (GET /api/admin/users/interests)', () => {
    it('should correctly group users by interests and count total users per group', async () => {
      const res = await request(app)
        .get('/api/admin/users/interests')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const groups = res.body.data.groups;
      expect(Array.isArray(groups)).toBe(true);

      const codingGroup = groups.find((g: any) => g.interest === 'coding');
      expect(codingGroup).toBeDefined();
      expect(codingGroup.totalUsers).toBe(2);
      const codingUserNames = codingGroup.users.map((u: any) => u.name);
      expect(codingUserNames).toContain('Alice');
      expect(codingUserNames).toContain('Bob');

      const musicGroup = groups.find((g: any) => g.interest === 'music');
      expect(musicGroup).toBeDefined();
      expect(musicGroup.totalUsers).toBe(1);

      const emptyGroup = groups.find((g: any) => !g.interest || g.interest === '');
      expect(emptyGroup).toBeUndefined();
    });

    it('should support pagination on grouped interests within the single aggregation pipeline', async () => {
      const res = await request(app)
        .get('/api/admin/users/interests?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.groups.length).toBeLessThanOrEqual(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.total).toBeGreaterThan(0);
    });

    it('should reject non-admin access with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/users/interests')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Aggregation Scenario 2 — User Posts with $lookup (GET /api/posts/users/:userId)', () => {
    it('should retrieve a user and all their posts via $lookup pipeline', async () => {
      await Post.create({
        title: 'Alice Post 1',
        content: 'Content 1',
        userId: user1._id
      });
      await Post.create({
        title: 'Alice Post 2',
        content: 'Content 2',
        userId: user1._id
      });

      await Post.create({
        title: 'Bob Post 1',
        content: 'Content for Bob',
        userId: user2._id
      });

      const res = await request(app).get(`/api/posts/users/${user1._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.name).toBe('Alice');
      expect(res.body.data.user.email).toBe('alice@example.com');
      expect(res.body.data.user.totalPosts).toBe(2);
      expect(res.body.data.user.posts.length).toBe(2);

      const postTitles = res.body.data.user.posts.map((p: any) => p.title);
      expect(postTitles).toContain('Alice Post 1');
      expect(postTitles).toContain('Alice Post 2');
      expect(postTitles).not.toContain('Bob Post 1');
    });

    it('should return empty posts array and totalPosts = 0 when user has no posts', async () => {
      const res = await request(app).get(`/api/posts/users/${user3._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Charlie');
      expect(res.body.data.user.posts).toEqual([]);
      expect(res.body.data.user.totalPosts).toBe(0);
    });

    it('should return 404 when querying a non-existent user ObjectId', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/posts/users/${nonExistentId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/user not found/i);
    });

    it('should return 400 when providing an invalid ObjectId format', async () => {
      const res = await request(app).get('/api/posts/users/invalid-object-id-123');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/validation failed/i);
    });
  });
});
