jest.mock('../../src/models', () => {
  const literal = jest.fn(value => value);
  const col = jest.fn(value => value);
  return {
    Comment: {},
    User: {},
    Post: {},
    Like: {},
    sequelize: { literal, col }
  };
});

jest.mock('../../src/utils/redis-client', () => ({
  isConnected: false,
  client: null,
  getClient: jest.fn(() => null),
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  expire: jest.fn(),
  exists: jest.fn(),
  cache: jest.fn(async (_, queryFn) => queryFn())
}));

const commentService = require('../../src/services/comment.service');
const commentRepository = require('../../src/repositories/comment.repository');
const postRepository = require('../../src/repositories/post.repository');

const CommentRepositoryClass = commentRepository.constructor;

describe('CommentService getPostComments like batching', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createComment = (id, replies = []) => ({
    id,
    user_id: `user-${id}`,
    is_anonymous: false,
    author: null,
    replies,
    dataValues: {}
  });

  it('batches like lookups into a single repository call', async () => {
    const postId = 'post-001';
    const currentUserId = 'user-current';

    jest.spyOn(postRepository, 'findById').mockResolvedValue({ id: postId, status: 'published' });

    const replyOne = createComment('reply-1');
    const replyTwo = createComment('reply-2');
    const commentOne = createComment('comment-1', [replyOne]);
    const commentTwo = createComment('comment-2', [replyTwo]);

    jest.spyOn(commentRepository, 'findByPostId').mockResolvedValue({
      list: [commentOne, commentTwo],
      pagination: { page: 1, pageSize: 20, total: 2 }
    });

    const likeStates = {
      'comment-1': true,
      'comment-2': false,
      'reply-1': true,
      'reply-2': false
    };

    const getLikeStatesSpy = jest
      .spyOn(CommentRepositoryClass.prototype, 'getLikeStatesForUser')
      .mockResolvedValue(likeStates);

    const legacySpy = jest
      .spyOn(CommentRepositoryClass.prototype, 'isLikedByUser')
      .mockResolvedValue(false);

    const result = await commentService.getPostComments(
      postId,
      1,
      20,
      currentUserId,
      'latest'
    );

    expect(postRepository.findById).toHaveBeenCalledWith(postId);
    expect(commentRepository.findByPostId).toHaveBeenCalledWith(postId, 1, 20, 'latest');
    expect(getLikeStatesSpy).toHaveBeenCalledTimes(1);

    const collectedIds = getLikeStatesSpy.mock.calls[0][1];
    const expectedIds = ['comment-1', 'comment-2', 'reply-1', 'reply-2'];
    expect(new Set(collectedIds).size).toBe(expectedIds.length);
    expect(collectedIds).toEqual(expect.arrayContaining(expectedIds));
    expect(legacySpy).not.toHaveBeenCalled();

    expect(result.list[0].dataValues.is_liked).toBe(true);
    expect(result.list[1].dataValues.is_liked).toBe(false);
    expect(result.list[0].replies[0].dataValues.is_liked).toBe(true);
    expect(result.list[1].replies[0].dataValues.is_liked).toBe(false);
  });
});
