const { TokenDistribution, TokenType } = require('./models');

async function testServiceAPIs() {
  try {
    console.log('=== Тест API для страницы "Сервис" ===\n');

    // 1. Проверяем TokenDistribution записи
    console.log('1. TokenDistribution записи:');
    const allDistributions = await TokenDistribution.findAll({
      include: [{
        model: TokenType,
        as: 'tokenType',
        attributes: ['name', 'autoDistribution', 'autoDistributionActive']
      }],
      order: [['createdAt', 'DESC']]
    });

    console.log(`Всего записей: ${allDistributions.length}`);
    allDistributions.forEach((dist, index) => {
      console.log(`${index + 1}. ${dist.tokenType?.name || 'Unknown'} - статус: ${dist.status}, дата: ${dist.scheduledDate}, создано: ${dist.createdAt}`);
    });

    // 2. Записи по статусам (как в getStatistics)
    console.log('\n2. Записи по статусам:');
    
    const scheduled = await TokenDistribution.findAll({
      where: { status: 'scheduled' },
      include: [{ 
        model: TokenType,
        as: 'tokenType',
        attributes: ['name']
      }],
      order: [['scheduledDate', 'ASC']]
    });

    const completed = await TokenDistribution.findAll({
      where: { status: ['completed', 'failed'] },
      include: [{ 
        model: TokenType,
        as: 'tokenType',
        attributes: ['name']
      }],
      order: [['executedDate', 'DESC']]
    });

    const inProgress = await TokenDistribution.findAll({
      where: { status: 'in_progress' },
      include: [{ 
        model: TokenType,
        as: 'tokenType',
        attributes: ['name']
      }],
      order: [['scheduledDate', 'ASC']]
    });

    console.log(`Запланированные (scheduled): ${scheduled.length}`);
    scheduled.forEach((dist, index) => {
      console.log(`  ${index + 1}. ${dist.tokenType?.name} - ${dist.scheduledDate}`);
    });

    console.log(`Завершенные (completed/failed): ${completed.length}`);
    console.log(`В процессе (in_progress): ${inProgress.length}`);

    // 3. Активные типы токенов
    console.log('\n3. Активные типы токенов с автораспределением:');
    const activeTokenTypes = await TokenType.findAll({
      where: {
        autoDistribution: true,
        autoDistributionActive: true
      },
      attributes: ['id', 'name', 'autoDistributionPeriod', 'autoDistributionAmount']
    });

    console.log(`Активных типов: ${activeTokenTypes.length}`);
    activeTokenTypes.forEach((token, index) => {
      console.log(`${index + 1}. ${token.name} (ID: ${token.id}) - период: ${token.autoDistributionPeriod}, количество: ${token.autoDistributionAmount}`);
    });

  } catch (error) {
    console.error('Ошибка при тестировании API:', error);
  } finally {
    process.exit(0);
  }
}

testServiceAPIs(); 