import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { User } from '../models/user.model';
import { Note } from '../models/note.model';
import { Post } from '../models/post.model';

describe('MongoDB Explicit Indexing Verification', () => {
  beforeAll(async () => {
    await Promise.all([
      User.init(),
      Note.init(),
      Post.init()
    ]);
  });

  it('User collection has expected explicit indexes', async () => {
    const indexes = await User.collection.getIndexes();

    expect(indexes).toHaveProperty('email_1');
    expect(indexes).toHaveProperty('createdAt_-1');
    expect(indexes).toHaveProperty('interests_1');
  });

  it('Note collection has compound index { userId: 1, createdAt: -1 } and { createdAt: -1 }', async () => {
    const indexes = await Note.collection.getIndexes();

    expect(indexes).toHaveProperty('userId_1_createdAt_-1');
    expect(indexes).toHaveProperty('createdAt_-1');
  });

  it('Post collection has foreignField index { userId: 1, createdAt: -1 } supporting $lookup', async () => {
    const indexes = await Post.collection.getIndexes();

    expect(indexes).toHaveProperty('userId_1_createdAt_-1');
    expect(indexes).toHaveProperty('createdAt_-1');
  });

  it('Note query uses index scan (IXSCAN) on userId_1_createdAt_-1', async () => {
    const dummyUserId = new mongoose.Types.ObjectId();

    const explanation: any = await Note.find({ userId: dummyUserId })
      .sort({ createdAt: -1 })
      .explain('executionStats');

    const winningPlan = explanation.queryPlanner?.winningPlan;
    const planString = JSON.stringify(winningPlan);
    expect(planString).toContain('userId_1_createdAt_-1');
  });
});
