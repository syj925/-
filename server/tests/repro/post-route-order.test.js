const request = require('supertest');

jest.mock('../../src/middlewares', () => {
  const actualMiddlewares = jest.requireActual('../../src/middlewares');

  return {
    ...actualMiddlewares,
    AuthMiddleware: {
      ...actualMiddlewares.AuthMiddleware,
      authenticate: () => (req, res, next) => {
        req.user = { id: 'test-user-id' };
        return next();
      },
      optionalAuthenticate: () => (req, res, next) => {
        req.user = { id: 'test-user-id' };
        return next();
      }
    }
  };
});

const app = require('../../src/app');
const postController = require('../../src/controllers/post.controller');

describe('Post Routes - /api/posts/user/favorites routing', () => {
  let favoritesSpy;

  beforeAll(() => {
    favoritesSpy = jest.spyOn(postController, 'getUserFavorites').mockImplementation((req, res) => {
      return res.status(200).json({
        success: true,
        code: 0,
        data: {
          list: [],
          handler: 'favorites'
        }
      });
    });
  });

  afterAll(() => {
    favoritesSpy.mockRestore();
  });

  test('should reach favorites handler instead of being captured by dynamic :id route', async () => {
    const response = await request(app)
      .get('/api/posts/user/favorites')
      .set('Authorization', 'Bearer mock-token');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.handler).toBe('favorites');
    expect(favoritesSpy).toHaveBeenCalledTimes(1);
  });
});
