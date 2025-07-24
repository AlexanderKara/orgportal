'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Получаем ID сотрудника
    const employee = await queryInterface.sequelize.query(
      'SELECT id FROM employees WHERE email = "karabchuk@gmail.com"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    // Получаем ID навыков
    const skills = await queryInterface.sequelize.query(
      'SELECT id FROM skills WHERE name IN ("Figma", "Adobe Photoshop", "Adobe Illustrator", "Управление командой", "Публичные выступления", "Фотография")',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    // Получаем ID уровней навыков
    const skillLevels = await queryInterface.sequelize.query(
      'SELECT id FROM skill_levels',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (employee.length > 0 && skills.length > 0 && skillLevels.length > 0) {
      await queryInterface.bulkInsert('employee_skills', [
        {
          employee_id: employee[0].id,
          skill_id: skills.find(s => s.name === 'Figma')?.id || skills[0].id,
          skill_level_id: skillLevels.find(sl => sl.value === 2)?.id || skillLevels[1].id, // Продвинутый
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          employee_id: employee[0].id,
          skill_id: skills.find(s => s.name === 'Adobe Photoshop')?.id || skills[1].id,
          skill_level_id: skillLevels.find(sl => sl.value === 2)?.id || skillLevels[1].id, // Продвинутый
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          employee_id: employee[0].id,
          skill_id: skills.find(s => s.name === 'Adobe Illustrator')?.id || skills[2].id,
          skill_level_id: skillLevels.find(sl => sl.value === 2)?.id || skillLevels[1].id, // Продвинутый
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          employee_id: employee[0].id,
          skill_id: skills.find(s => s.name === 'Управление командой')?.id || skills[3].id,
          skill_level_id: skillLevels.find(sl => sl.value === 3)?.id || skillLevels[2].id, // Экспертный
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          employee_id: employee[0].id,
          skill_id: skills.find(s => s.name === 'Публичные выступления')?.id || skills[4].id,
          skill_level_id: skillLevels.find(sl => sl.value === 3)?.id || skillLevels[2].id, // Экспертный
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          employee_id: employee[0].id,
          skill_id: skills.find(s => s.name === 'Фотография')?.id || skills[5].id,
          skill_level_id: skillLevels.find(sl => sl.value === 1)?.id || skillLevels[0].id, // Начальный
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('employee_skills', null, {});
  }
}; 