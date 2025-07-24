#!/usr/bin/env node

const { Sequelize } = require('sequelize');
const path = require('path');

// Загружаем переменные окружения
require('dotenv').config();

async function setupDatabase() {
  console.log('🔧 Настройка внешней базы данных...');
  
  // Создаем подключение к БД
  const sequelize = new Sequelize({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

  try {
    // Проверяем подключение
    await sequelize.authenticate();
    console.log('✅ Подключение к БД установлено');
    
    // Выполняем миграции
    console.log('🔄 Выполнение миграций...');
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    try {
      await execAsync('npx sequelize-cli db:migrate');
      console.log('✅ Миграции выполнены');
      
      await execAsync('npx sequelize-cli db:seed:all');
      console.log('✅ Тестовые данные загружены');
      
    } catch (error) {
      console.log('⚠️ Ошибка при выполнении миграций:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Ошибка подключения к БД:', error.message);
    console.log('📋 Проверьте настройки в .env файле:');
    console.log(`   DB_HOST: ${process.env.DB_HOST}`);
    console.log(`   DB_PORT: ${process.env.DB_PORT}`);
    console.log(`   DB_NAME: ${process.env.DB_NAME}`);
    console.log(`   DB_USER: ${process.env.DB_USER}`);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Запускаем настройку
setupDatabase(); 