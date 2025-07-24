const { TokenDistribution, TokenTransaction, TokenType, Employee } = require('./models');

async function testTokenDistributions() {
  try {
    console.log('=== Проверка TokenDistribution ===');
    const distributions = await TokenDistribution.findAll({
      include: [{
        model: TokenType,
        as: 'tokenType',
        attributes: ['name', 'autoDistribution', 'autoDistributionActive']
      }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    console.log(`Найдено ${distributions.length} записей в TokenDistribution:`);
    distributions.forEach((dist, index) => {
      console.log(`${index + 1}. ${dist.tokenType?.name || 'Unknown'} - статус: ${dist.status}, дата: ${dist.scheduledDate}`);
    });

    console.log('\n=== Проверка TokenTransaction (без include) ===');
    const transactionsRaw = await TokenTransaction.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    console.log(`Найдено ${transactionsRaw.length} записей в TokenTransaction (raw):`);
    transactionsRaw.forEach((trans, index) => {
      console.log(`${index + 1}. fromEmployeeId: ${trans.fromEmployeeId}, toEmployeeId: ${trans.toEmployeeId}, tokenTypeId: ${trans.tokenTypeId}, count: ${trans.count}, message: ${trans.message}`);
    });

    console.log('\n=== Проверка TokenTransaction (с include) ===');
    const transactions = await TokenTransaction.findAll({
      include: [
        {
          model: Employee,
          as: 'fromEmployee',
          attributes: ['first_name', 'last_name'],
          required: false
        },
        {
          model: Employee,
          as: 'toEmployee',
          attributes: ['first_name', 'last_name']
        },
        {
          model: TokenType,
          as: 'tokenType',
          attributes: ['name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    console.log(`Найдено ${transactions.length} записей в TokenTransaction (с include):`);
    transactions.forEach((trans, index) => {
      const from = trans.fromEmployee ? `${trans.fromEmployee.first_name} ${trans.fromEmployee.last_name}` : 'Админ';
      const to = trans.toEmployee ? `${trans.toEmployee.first_name} ${trans.toEmployee.last_name}` : 'Unknown';
      console.log(`${index + 1}. ${from} → ${to}: ${trans.tokenType?.name || 'Unknown'} (${trans.count} шт.)`);
    });

    console.log('\n=== Проверка активных автораспределений ===');
    const activeTokenTypes = await TokenType.findAll({
      where: {
        autoDistribution: true,
        autoDistributionActive: true
      },
      attributes: ['id', 'name', 'autoDistribution', 'autoDistributionActive']
    });

    console.log(`Найдено ${activeTokenTypes.length} активных автораспределений:`);
    activeTokenTypes.forEach((token, index) => {
      console.log(`${index + 1}. ${token.name} (ID: ${token.id})`);
    });

  } catch (error) {
    console.error('Ошибка при проверке:', error);
  } finally {
    process.exit(0);
  }
}

testTokenDistributions(); 