require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Vfuhfntz42',
    database: process.env.DB_NAME || 'orgchart_dev',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // Отключаем логирование для ускорения
    timezone: '+03:00',
    benchmark: false, // Отключаем бенчмаркинг для ускорения
    pool: {
      max: 10,        // Уменьшаем для удаленной БД
      min: 2,         // Уменьшаем для экономии ресурсов
      acquire: 30000, // Уменьшаем timeout
      idle: 5000      // Уменьшаем время простоя
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  },
  test: {
    username: process.env.DB_USER_TEST || 'root',
    password: process.env.DB_PASSWORD_TEST || 'Vfuhfntz42',
    database: process.env.DB_NAME_TEST || 'orgchart_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    timezone: '+03:00',
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    timezone: '+03:00',
    pool: {
      max: 20,        // Увеличиваем с 5 до 20
      min: 5,         // Увеличиваем с 0 до 5
      acquire: 60000, // Увеличиваем timeout
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
}; 