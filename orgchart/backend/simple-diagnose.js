const { Sequelize } = require('sequelize');
const config = require('./config/database');

async function simpleDiagnose() {
  console.log('🔍 Упрощенная диагностика производительности...\n');
  
  const sequelize = new Sequelize(config.development);
  
  try {
    await sequelize.authenticate();
    console.log('✅ Подключение к БД успешно');
    
    // 1. Проверка размера таблиц
    console.log('\n1. Размер таблиц...');
    const tableSizes = await sequelize.query(`
      SELECT 
        table_name,
        table_rows,
        ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
      FROM information_schema.tables 
      WHERE table_schema = '${config.development.database}'
      ORDER BY (data_length + index_length) DESC
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log('📊 Размеры таблиц:');
    tableSizes.forEach(table => {
      console.log(`   ${table.table_name}: ${table['Size (MB)']}MB (${table.table_rows} строк)`);
    });
    
    // 2. Проверка индексов
    console.log('\n2. Проверка индексов...');
    const indexes = await sequelize.query(`
      SELECT 
        table_name,
        index_name,
        column_name
      FROM information_schema.statistics 
      WHERE table_schema = '${config.development.database}'
      ORDER BY table_name, index_name
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log('🔍 Индексы:');
    const tableIndexes = {};
    indexes.forEach(index => {
      if (!tableIndexes[index.table_name]) {
        tableIndexes[index.table_name] = [];
      }
      tableIndexes[index.table_name].push(index.index_name);
    });
    
    Object.entries(tableIndexes).forEach(([table, tableIndexes]) => {
      const uniqueIndexes = [...new Set(tableIndexes)];
      console.log(`   ${table}: ${uniqueIndexes.join(', ')}`);
    });
    
    // 3. Проверка активных соединений
    console.log('\n3. Активные соединения...');
    const connections = await sequelize.query(`
      SELECT 
        COUNT(*) as active_connections,
        COUNT(DISTINCT user) as unique_users
      FROM information_schema.processlist 
      WHERE db = '${config.development.database}'
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`📊 Активных соединений: ${connections[0].active_connections}`);
    console.log(`👥 Уникальных пользователей: ${connections[0].unique_users}`);
    
    // 4. Тест производительности простых запросов
    console.log('\n4. Тест производительности запросов...');
    
    const startTime = Date.now();
    await sequelize.query('SELECT 1');
    const simpleQueryTime = Date.now() - startTime;
    console.log(`   Простой запрос: ${simpleQueryTime}мс`);
    
    // 5. Проверка количества записей в основных таблицах
    console.log('\n5. Количество записей в таблицах...');
    const tables = ['employees', 'departments', 'products', 'tokens', 'notifications'];
    
    for (const table of tables) {
      try {
        const result = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`, 
          { type: Sequelize.QueryTypes.SELECT });
        console.log(`   ${table}: ${result[0].count} записей`);
      } catch (error) {
        console.log(`   ${table}: таблица не существует или нет доступа`);
      }
    }
    
    // 6. Рекомендации
    console.log('\n6. Возможные причины медленной работы:');
    console.log('   • Большое количество записей в таблицах');
    console.log('   • Отсутствие индексов на часто используемых полях');
    console.log('   • Медленное сетевое соединение с БД (удаленный хостинг)');
    console.log('   • Неоптимальные запросы с JOIN');
    console.log('   • Отсутствие кэширования на фронтенде');
    console.log('   • Много одновременных запросов');
    console.log('   • Недостаточно памяти для Node.js процесса');
    
    console.log('\n7. Рекомендации по оптимизации:');
    console.log('   • Добавьте индексы на часто используемые поля');
    console.log('   • Включите кэширование на фронтенде');
    console.log('   • Оптимизируйте запросы с JOIN');
    console.log('   • Рассмотрите возможность использования Redis');
    console.log('   • Увеличьте лимиты памяти для Node.js');
    console.log('   • Проверьте настройки пула соединений');
    
  } catch (error) {
    console.error('❌ Ошибка диагностики:', error.message);
  } finally {
    await sequelize.close();
  }
}

simpleDiagnose().catch(console.error); 