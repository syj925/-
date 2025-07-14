const request = require('supertest');
const app = require('../src/app');
const { User, Follow } = require('../src/models');
const { v4: uuidv4 } = require('uuid');

describe('Follow System Tests', () => {
  let user1, user2, user3;
  let user1Token, user2Token;

  beforeAll(async () => {
    // 创建测试用户
    user1 = await User.create({
      id: uuidv4(),
      username: 'testuser1',
      email: 'test1@example.com',
      password: 'password123',
      school: '测试大学',
      department: '计算机学院'
    });

    user2 = await User.create({
      id: uuidv4(),
      username: 'testuser2',
      email: 'test2@example.com',
      password: 'password123',
      school: '测试大学',
      department: '软件学院'
    });

    user3 = await User.create({
      id: uuidv4(),
      username: 'testuser3',
      email: 'test3@example.com',
      password: 'password123',
      school: '测试大学',
      department: '信息学院'
    });

    // 获取用户token（这里简化处理，实际应该通过登录接口获取）
    // 假设有一个生成token的方法
    user1Token = 'Bearer test-token-1';
    user2Token = 'Bearer test-token-2';
  });

  afterAll(async () => {
    // 清理测试数据
    await Follow.destroy({ where: {} });
    await User.destroy({ where: { id: [user1.id, user2.id, user3.id] } });
  });

  describe('POST /api/follows', () => {
    test('应该能够关注用户', async () => {
      const response = await request(app)
        .post('/api/follows')
        .set('Authorization', user1Token)
        .send({ user_id: user2.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('关注成功');
    });

    test('不能关注自己', async () => {
      const response = await request(app)
        .post('/api/follows')
        .set('Authorization', user1Token)
        .send({ user_id: user1.id })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不能关注自己');
    });

    test('不能重复关注同一用户', async () => {
      const response = await request(app)
        .post('/api/follows')
        .set('Authorization', user1Token)
        .send({ user_id: user2.id })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('已关注该用户');
    });
  });

  describe('GET /api/follows/check/:user_id', () => {
    test('应该能够检查关注状态', async () => {
      const response = await request(app)
        .get(`/api/follows/check/${user2.id}`)
        .set('Authorization', user1Token)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isFollowing).toBe(true);
    });
  });

  describe('POST /api/follows/batch-check', () => {
    test('应该能够批量检查关注状态', async () => {
      const response = await request(app)
        .post('/api/follows/batch-check')
        .set('Authorization', user1Token)
        .send({ userIds: [user2.id, user3.id] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[user2.id]).toBe(true);
      expect(response.body.data[user3.id]).toBe(false);
    });
  });

  describe('GET /api/follows/mutual/:user_id1/:user_id2', () => {
    beforeAll(async () => {
      // 让user2也关注user1，形成互相关注
      await Follow.create({
        id: uuidv4(),
        follower_id: user2.id,
        following_id: user1.id
      });
    });

    test('应该能够检查两个用户是否互相关注', async () => {
      const response = await request(app)
        .get(`/api/follows/mutual/${user1.id}/${user2.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user1FollowsUser2).toBe(true);
      expect(response.body.data.user2FollowsUser1).toBe(true);
      expect(response.body.data.isMutual).toBe(true);
    });
  });

  describe('GET /api/follows/me/mutual', () => {
    test('应该能够获取当前用户的互相关注列表', async () => {
      const response = await request(app)
        .get('/api/follows/me/mutual')
        .set('Authorization', user1Token)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.list).toHaveLength(1);
      expect(response.body.data.list[0].follower.id).toBe(user2.id);
    });
  });

  describe('DELETE /api/follows/:user_id', () => {
    test('应该能够取消关注用户', async () => {
      const response = await request(app)
        .delete(`/api/follows/${user2.id}`)
        .set('Authorization', user1Token)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('取消关注成功');
    });

    test('取消关注后关注状态应该为false', async () => {
      const response = await request(app)
        .get(`/api/follows/check/${user2.id}`)
        .set('Authorization', user1Token)
        .expect(200);

      expect(response.body.data.isFollowing).toBe(false);
    });
  });

  describe('GET /api/follows/me/followings', () => {
    test('应该能够获取当前用户的关注列表', async () => {
      const response = await request(app)
        .get('/api/follows/me/followings')
        .set('Authorization', user1Token)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.list)).toBe(true);
    });
  });

  describe('GET /api/follows/me/followers', () => {
    test('应该能够获取当前用户的粉丝列表', async () => {
      const response = await request(app)
        .get('/api/follows/me/followers')
        .set('Authorization', user1Token)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.list)).toBe(true);
    });
  });

  describe('GET /api/follows/user/:user_id/counts', () => {
    test('应该能够获取用户的关注和粉丝数量', async () => {
      const response = await request(app)
        .get(`/api/follows/user/${user1.id}/counts`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(typeof response.body.data.followingCount).toBe('number');
      expect(typeof response.body.data.followerCount).toBe('number');
    });
  });
});
