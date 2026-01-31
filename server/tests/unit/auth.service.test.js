const authService = require('../../src/services/auth.service');
const userRepository = require('../../src/repositories/user.repository');
const { EncryptionUtil, JwtUtil } = require('../../src/utils');
const { ErrorMiddleware } = require('../../src/middlewares');

// Mock dependencies
jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/utils');
// Fix path: config is at root of server, not in src
jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}), { virtual: true }); // virtual might be needed if jest can't find it, but let's try path fix first

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const mockUser = {
      id: '123',
      username: 'testuser',
      password: 'hashedpassword',
      status: 'active',
      is_disabled: false
    };

    it('should login successfully with correct credentials', async () => {
      // Setup mocks
      userRepository.findByUsername.mockResolvedValue(mockUser);
      EncryptionUtil.verifyPassword.mockReturnValue(true);
      JwtUtil.generateToken.mockReturnValue('mock-token');
      userRepository.updateLastLoginAt.mockResolvedValue();

      // Execute
      const result = await authService.login('testuser', 'password');

      // Assert
      expect(result).toHaveProperty('token', 'mock-token');
      expect(result.user).toHaveProperty('id', '123');
      expect(userRepository.updateLastLoginAt).toHaveBeenCalledWith('123');
    });

    it('should throw error if user not found', async () => {
      userRepository.findByUsername.mockResolvedValue(null);
      userRepository.findByPhone.mockResolvedValue(null);
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.login('unknown', 'password'))
        .rejects.toThrow('用户不存在');
    });

    it('should throw error if password incorrect', async () => {
      userRepository.findByUsername.mockResolvedValue(mockUser);
      EncryptionUtil.verifyPassword.mockReturnValue(false);

      await expect(authService.login('testuser', 'wrongpass'))
        .rejects.toThrow('密码错误');
    });
  });
});
