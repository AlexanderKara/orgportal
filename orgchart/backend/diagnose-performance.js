const { Sequelize } = require('sequelize');
const config = require('./config/database');

async function diagnosePerformance() {
  console.log('🔍 Диагностика производительности приложения...\n');
  
  // 1. Проверка подключения к БД
  console.log('1. Проверка подключения к базе данных...');
  const sequelize = new Sequelize(config.development);
  
  try {
    await sequelize.authenticate();
    console.log('✅ Подключение к БД успешно');
    
    // 2. Проверка медленных запросов
    console.log('\n2. Проверка медленных запросов...');
    const slowQueries = await sequelize.query(`
      SELECT 
        sql_text,
        COUNT(*) as execution_count,
        AVG(duration) as avg_duration,
        MAX(duration) as max_duration,
        SUM(duration) as total_duration
      FROM performance_schema.events_statements_history_long 
      WHERE duration > 1000000
      GROUP BY sql_text
      ORDER BY avg_duration DESC
      LIMIT 10
    `, { type: Sequelize.QueryTypes.SELECT });
    
    if (slowQueries.length > 0) {
      console.log('⚠️  Найдены медленные запросы:');
      slowQueries.forEach((query, index) => {
        console.log(`${index + 1}. ${query.sql_text.substring(0, 100)}...`);
        console.log(`   Среднее время: ${query.avg_duration}мс, Максимум: ${query.max_duration}мс`);
      });
    } else {
      console.log('✅ Медленных запросов не найдено');
    }
    
    // 3. Проверка размера таблиц
    console.log('\n3. Размер таблиц...');
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
    
    // 4. Проверка индексов
    console.log('\n4. Проверка индексов...');
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
    
    // 5. Проверка активных соединений
    console.log('\n5. Активные соединения...');
    const connections = await sequelize.query(`
      SELECT 
        COUNT(*) as active_connections,
        COUNT(DISTINCT user) as unique_users
      FROM information_schema.processlist 
      WHERE db = '${config.development.database}'
    `, { type: Sequelize.QueryTypes.SELECT });
    
    console.log(`📊 Активных соединений: ${connections[0].active_connections}`);
    console.log(`👥 Уникальных пользователей: ${connections[0].unique_users}`);
    
    // 6. Рекомендации
    console.log('\n6. Рекомендации по оптимизации:');
    console.log('   • Проверьте настройки пула соединений в config/database.js');
    console.log('   • Убедитесь, что включено кэширование на фронтенде');
    console.log('   • Проверьте размер ответов API');
    console.log('   • Рассмотрите возможность добавления Redis для кэширования');
    console.log('   • Проверьте логи сервера на наличие ошибок');
    
  } catch (error) {
    console.error('❌ Ошибка диагностики:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Запуск диагностики
diagnosePerformance().catch(console.error); 