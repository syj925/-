const config = require('./config');
const { database } = config;

module.exports = {
  development: {
    username: database.user,
    password: database.password,
    database: database.name,
    host: database.host,
    port: database.port,
    dialect: 'mysql',
    timezone: '+08:00',
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true,
      freezeTableName: false
    }
  },
  test: {
    username: database.user,
    password: database.password,
    database: database.name + '_test',
    host: database.host,
    port: database.port,
    dialect: 'mysql',
    timezone: '+08:00'
  },
  production: {
    username: database.user,
    password: database.password,
    database: database.name,
    host: database.host,
    port: database.port,
    dialect: 'mysql',
    timezone: '+08:00',
    logging: false
  }
}; 