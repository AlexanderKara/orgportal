const { sequelize } = require('./models');

async function checkTelegramId() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    
    const [results] = await sequelize.query(`
      SELECT id, first_name, last_name, telegram_id, status 
      FROM employees 
      WHERE id = 1 OR telegram_id = 84164955
    `);
    
    console.log('Employees found:', results);
    
    // Проверим всех сотрудников с telegram_id
    const [allWithTelegram] = await sequelize.query(`
      SELECT id, first_name, last_name, telegram_id, status 
      FROM employees 
      WHERE telegram_id IS NOT NULL
    `);
    
    console.log('All employees with telegram_id:', allWithTelegram);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkTelegramId(); 