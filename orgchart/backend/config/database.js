require('dotenv').config();

// Логирование для отладки
console.log('Database config - DB_HOST:', process.env.DB_HOST);
console.log('Database config - DB_USER:', process.env.DB_USER);
console.log('Database config - DB_NAME:', process.env.DB_NAME);
console.log('Database config - DB_PORT:', process.env.DB_PORT);

module.exports = {
  development: {
    username: process.env.DB_USER || 'orgchart',
    password: process.env.DB_PASSWORD || 'NeWbMxVYA9!3',
    database: process.env.DB_NAME || 'orgchart',
    host: process.env.DB_HOST || 'brukolalutaf.beget.app',
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
    username: process.env.DB_USER_TEST || 'orgchart',
    password: process.env.DB_PASSWORD_TEST || 'NeWbMxVYA9!3',
    database: process.env.DB_NAME_TEST || 'orgchart_test',
    host: process.env.DB_HOST || 'brukolalutaf.beget.app',
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