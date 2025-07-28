const { Achievement } = require('./models');

async function testAchievements() {
  try {
    console.log('Testing achievements table...');
    
    const achievements = await Achievement.findAll();
    console.log('Total achievements found:', achievements.length);
    
    if (achievements.length > 0) {
      console.log('First achievement:', {
        id: achievements[0].id,
        name: achievements[0].name,
        type: achievements[0].type,
        isActive: achievements[0].isActive
      });
    }
    
    // Проверяем структуру таблицы
    const tableInfo = await Achievement.describe();
    console.log('Table structure:', Object.keys(tableInfo));
    
  } catch (error) {
    console.error('Error testing achievements:', error);
  } finally {
    process.exit(0);
  }
}

testAchievements(); 