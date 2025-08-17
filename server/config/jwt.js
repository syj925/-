require('dotenv').config();
const cacheConfig = require('./cache');

module.exports = {
  secret: process.env.JWT_SECRET || 'campus_community_development_secret',
  expiresIn: cacheConfig.AUTH.JWT_EXPIRES,
  algorithm: 'HS256',
  issuer: 'campus-community-api',
  audience: 'campus-community-client'
}; 