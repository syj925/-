require('dotenv').config();
const cacheConfig = require('./cache');

const requireEnv = (name) => {
  const value = process.env[name];
  if (typeof value === 'undefined' || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const jwtSecret = requireEnv('JWT_SECRET');

module.exports = {
  secret: jwtSecret,
  expiresIn: cacheConfig.AUTH.JWT_EXPIRES,
  algorithm: 'HS256',
  issuer: 'campus-community-api',
  audience: 'campus-community-client'
}; 
