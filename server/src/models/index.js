const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const config = require("../../config");
const logger = require("../../config/logger");

// 初始化数据库连接
const sequelize = new Sequelize(
  config.database.database,
  config.database.username,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    pool: config.database.pool,
    define: config.database.define,
    timezone: config.database.timezone,
    logging: (sql, timing) => {
      if (config.env === "development") {
        logger.debug(sql, { timing });
      }
    },
  },
);

// 注意：数据库连接认证统一在 server.js 中通过 db.sequelize.authenticate() 执行，
// 此处不再重复调用，避免启动时产生两次认证请求。

const db = {};

// 读取当前目录下的所有模型文件
fs.readdirSync(__dirname)
  .filter(
    (file) =>
      file.indexOf(".") !== 0 &&
      file !== "index.js" &&
      file.slice(-3) === ".js",
  )
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes,
    );
    db[model.name] = model;
  });

// 建立模型之间的关联关系
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
