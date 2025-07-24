const { sequelize } = require('./config/sequelize');

async function checkTables() {
  try {
    const [results] = await sequelize.query("SHOW TABLES");
    console.log('Существующие таблицы:');
    results.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`${index + 1}. ${tableName}`);
    });

    // Проверим конкретно TokenTransactions
    const tokenTransactionsExists = results.some(table => Object.values(table)[0] === 'TokenTransactions');
    
    if (tokenTransactionsExists) {
      console.log('\n=== Структура таблицы TokenTransactions ===');
      const [columns] = await sequelize.query("DESCRIBE TokenTransactions");
      columns.forEach(col => {
        console.log(`${col.Field}: ${col.Type} (null: ${col.Null})`);
      });

      console.log('\n=== Содержимое TokenTransactions ===');
      const [rows] = await sequelize.query("SELECT * FROM TokenTransactions ORDER BY createdAt DESC LIMIT 5");
      console.log(`Всего записей: ${rows.length}`);
      rows.forEach((row, index) => {
        console.log(`${index + 1}.`, row);
      });
    } else {
      console.log('\n❌ Таблица TokenTransactions не найдена!');
      console.log('Возможно, нужно выполнить миграции...');
    }

  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    process.exit(0);
  }
}

checkTables(); 