const { sequelize } = require('./config/sequelize');

async function checkTokenTransactions() {
  try {
    console.log('=== Проверка tokentransactions ===');
    
    // Структура таблицы
    const [columns] = await sequelize.query("DESCRIBE tokentransactions");
    console.log('Поля таблицы:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} (null: ${col.Null})`);
    });

    // Содержимое
    const [rows] = await sequelize.query("SELECT * FROM tokentransactions ORDER BY createdAt DESC LIMIT 5");
    console.log(`\nВсего записей: ${rows.length}`);
    if (rows.length > 0) {
      rows.forEach((row, index) => {
        console.log(`${index + 1}. fromEmployeeId: ${row.fromEmployeeId}, toEmployeeId: ${row.toEmployeeId}, tokenTypeId: ${row.tokenTypeId}, count: ${row.count}`);
      });
    }

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    process.exit(0);
  }
}

checkTokenTransactions(); 