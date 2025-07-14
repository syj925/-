require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'campus_community_development_secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  algorithm: 'HS256',
  issuer: 'campus-community-api',
  audience: 'campus-community-client'
}; 