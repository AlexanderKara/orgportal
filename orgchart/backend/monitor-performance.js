const { Sequelize } = require('sequelize');
const config = require('./config/database');

class PerformanceMonitor {
  constructor() {
    this.sequelize = new Sequelize(config.development);
    this.metrics = {
      requests: 0,
      slowQueries: 0,
      errors: 0,
      avgResponseTime: 0,
      startTime: Date.now()
    };
  }

  async start() {
    console.log('🔍 Запуск мониторинга производительности...\n');
    
    // Проверяем подключение
    try {
      await this.sequelize.authenticate();
      console.log('✅ Подключение к БД установлено');
    } catch (error) {
      console.error('❌ Ошибка подключения к БД:', error.message);
      return;
    }

    // Запускаем периодические проверки
    this.monitorDatabase();
    this.monitorSystem();
    
    console.log('📊 Мониторинг запущен. Нажмите Ctrl+C для остановки.\n');
  }

  async monitorDatabase() {
    setInterval(async () => {
      try {
        // Проверяем активные соединения
        const connections = await this.sequelize.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.processlist 
          WHERE db = '${config.development.database}'
        `, { type: Sequelize.QueryTypes.SELECT });
        
        const activeConnections = connections[0].count;
        
        // Проверяем размер таблиц
        const tableSizes = await this.sequelize.query(`
          SELECT 
            table_name,
            table_rows,
            ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
          FROM information_schema.tables 
          WHERE table_schema = '${config.development.database}'
          ORDER BY (data_length + index_length) DESC
          LIMIT 5
        `, { type: Sequelize.QueryTypes.SELECT });
        
        console.log(`\n📊 [${new Date().toLocaleTimeString()}] Статус БД:`);
        console.log(`   Активных соединений: ${activeConnections}`);
        console.log(`   Топ-5 таблиц по размеру:`);
        tableSizes.forEach(table => {
          console.log(`     ${table.table_name}: ${table.size_mb}MB (${table.table_rows} строк)`);
        });
        
      } catch (error) {
        console.error('❌ Ошибка мониторинга БД:', error.message);
      }
    }, 30000); // Каждые 30 секунд
  }

  monitorSystem() {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const uptime = Date.now() - this.metrics.startTime;
      
      console.log(`\n💻 [${new Date().toLocaleTimeString()}] Системные ресурсы:`);
      console.log(`   Время работы: ${Math.round(uptime / 1000)}с`);
      console.log(`   RSS память: ${Math.round(memUsage.rss / 1024 / 1024)}MB`);
      console.log(`   Heap использовано: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
      console.log(`   Heap всего: ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
      
      // Рекомендации
      if (memUsage.heapUsed > 100 * 1024 * 1024) { // > 100MB
        console.log('   ⚠️  Высокое потребление памяти!');
      }
      
      if (activeConnections > 8) {
        console.log('   ⚠️  Много активных соединений с БД!');
      }
      
    }, 60000); // Каждую минуту
  }

  async testQueryPerformance() {
    console.log('\n🧪 Тестирование производительности запросов...');
    
    const queries = [
      { name: 'Простой SELECT', sql: 'SELECT 1' },
      { name: 'Подсчет сотрудников', sql: 'SELECT COUNT(*) FROM employees' },
      { name: 'Поиск по email', sql: 'SELECT id FROM employees WHERE email IS NOT NULL LIMIT 1' },
      { name: 'JOIN запрос', sql: 'SELECT e.id, d.name FROM employees e LEFT JOIN departments d ON e.department_id = d.id LIMIT 5' }
    ];
    
    for (const query of queries) {
      const startTime = Date.now();
      try {
        await this.sequelize.query(query.sql, { type: Sequelize.QueryTypes.SELECT });
        const duration = Date.now() - startTime;
        console.log(`   ${query.name}: ${duration}мс`);
        
        if (duration > 100) {
          console.log(`     ⚠️  Медленный запрос!`);
        }
      } catch (error) {
        console.log(`   ${query.name}: ОШИБКА - ${error.message}`);
      }
    }
  }

  async stop() {
    await this.sequelize.close();
    console.log('\n🛑 Мониторинг остановлен');
  }
}

// Запуск мониторинга
const monitor = new PerformanceMonitor();

// Обработка завершения
process.on('SIGINT', async () => {
  await monitor.stop();
  process.exit(0);
});

// Запуск
monitor.start().then(() => {
  // Запускаем тест производительности через 5 секунд
  setTimeout(() => {
    monitor.testQueryPerformance();
  }, 5000);
}).catch(console.error); 