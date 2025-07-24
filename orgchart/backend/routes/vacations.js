const express = require('express');
const router = express.Router();
const { Vacation, Employee } = require('../models');
const { Op } = require('sequelize');

// Получить все отпуска (для админки)
router.get('/admin', async (req, res) => {
  try {
    if (!req.employee || !req.employee.id) {
      return res.status(401).json({ error: 'Пользователь не авторизован или не найден' });
    }
    
    // Проверяем права администратора
    const hasAdminRights = req.employee.adminRoles && req.employee.adminRoles.some(role => 
      role.name === 'Главный администратор' || 
      (role.permissions && role.permissions.includes('vacations'))
    );
    
    if (!hasAdminRights) {
      return res.status(403).json({ error: 'Недостаточно прав для просмотра всех отпусков' });
    }
    
    const vacations = await Vacation.findAll({
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'first_name', 'last_name', 'email', 'department_id', 'avatar'],
          include: [
            {
              model: require('../models/Department'),
              as: 'department',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ vacations });
  } catch (error) {
    console.error('Error fetching all vacations:', error);
    res.status(500).json({ error: 'Ошибка при получении отпусков' });
  }
});

// Получить все отпуска текущего пользователя
router.get('/', async (req, res) => {
  try {
    if (!req.employee || !req.employee.id) {
      return res.status(401).json({ error: 'Пользователь не авторизован или не найден' });
    }
    
    const employeeId = req.employee.id;
    
    const vacations = await Vacation.findAll({
      where: { employee_id: employeeId },
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'first_name', 'last_name', 'email', 'department_id', 'avatar'],
          include: [
            {
              model: require('../models/Department'),
              as: 'department',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ vacations });
  } catch (error) {
    console.error('Error fetching vacations:', error);
    res.status(500).json({ error: 'Ошибка при получении отпусков' });
  }
});

// Получить конкретный отпуск
router.get('/:id', async (req, res) => {
  try {
    if (!req.employee || !req.employee.id) {
      return res.status(401).json({ error: 'Пользователь не авторизован или не найден' });
    }
    
    const { id } = req.params;
    const employeeId = req.employee.id;
    
    const vacation = await Vacation.findOne({
      where: { 
        id: id,
        employee_id: employeeId 
      },
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'first_name', 'last_name', 'email', 'department_id', 'avatar'],
          include: [
            {
              model: require('../models/Department'),
              as: 'department',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    if (!vacation) {
      return res.status(404).json({ error: 'Отпуск не найден' });
    }

    res.json({ vacation });
  } catch (error) {
    console.error('Error fetching vacation:', error);
    res.status(500).json({ error: 'Ошибка при получении отпуска' });
  }
});

// Создать новый отпуск
router.post('/', async (req, res) => {
  try {
    if (!req.employee || !req.employee.id) {
      return res.status(401).json({ error: 'Пользователь не авторизован или не найден' });
    }
    
    const employeeId = req.employee.id;
    const { type, start_date, end_date, description } = req.body;

    // Валидация данных
    if (!type) {
      return res.status(400).json({ error: 'Тип отпуска обязателен' });
    }

    // Если даты не указаны, устанавливаем текущую дату как начальную
    const startDate = start_date ? new Date(start_date) : new Date();
    const endDate = end_date ? new Date(end_date) : new Date();

    // Вычисляем количество дней
    const startDateNormalized = new Date(startDate);
    const endDateNormalized = new Date(endDate);
    
    // Устанавливаем время в 00:00:00 для корректного расчета
    startDateNormalized.setHours(0, 0, 0, 0);
    endDateNormalized.setHours(0, 0, 0, 0);
    
    const diffTime = endDateNormalized.getTime() - startDateNormalized.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const daysCount = diffDays + 1; // Включаем обе даты

    const vacation = await Vacation.create({
      employee_id: employeeId,
      vacation_type: type,
      start_date: startDate,
      end_date: endDate,
      description: description || null,
      days_count: daysCount
    });

    // Получаем созданный отпуск с данными сотрудника
    const createdVacation = await Vacation.findByPk(vacation.id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    res.status(201).json({ vacation: createdVacation });
  } catch (error) {
    console.error('Error creating vacation:', error);
    res.status(500).json({ error: 'Ошибка при создании отпуска' });
  }
});

// Обновить отпуск
router.put('/:id', async (req, res) => {
  try {
    if (!req.employee || !req.employee.id) {
      return res.status(401).json({ error: 'Пользователь не авторизован или не найден' });
    }
    
    const { id } = req.params;
    const employeeId = req.employee.id;
    const { type, start_date, end_date, description } = req.body;

    const vacation = await Vacation.findOne({
      where: { 
        id: id,
        employee_id: employeeId 
      }
    });

    if (!vacation) {
      return res.status(404).json({ error: 'Отпуск не найден' });
    }

    // Обновляем только переданные поля
    const updateData = {};
    if (type !== undefined) updateData.vacation_type = type;
    if (start_date !== undefined) updateData.start_date = new Date(start_date);
    if (end_date !== undefined) updateData.end_date = new Date(end_date);
    if (description !== undefined) updateData.description = description;

    // Если изменились даты, пересчитываем days_count
    if (start_date !== undefined || end_date !== undefined) {
      const startDate = start_date ? new Date(start_date) : vacation.start_date;
      const endDate = end_date ? new Date(end_date) : vacation.end_date;
      
      // Устанавливаем время в 00:00:00 для корректного расчета
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      const diffTime = endDate.getTime() - startDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      updateData.days_count = diffDays + 1;
    }

    await vacation.update(updateData);

    // Получаем обновленный отпуск с данными сотрудника
    const updatedVacation = await Vacation.findByPk(id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    res.json({ vacation: updatedVacation });
  } catch (error) {
    console.error('Error updating vacation:', error);
    res.status(500).json({ error: 'Ошибка при обновлении отпуска' });
  }
});

// Удалить отпуск
router.delete('/:id', async (req, res) => {
  try {
    if (!req.employee || !req.employee.id) {
      return res.status(401).json({ error: 'Пользователь не авторизован или не найден' });
    }
    
    const { id } = req.params;
    const employeeId = req.employee.id;
    
    const vacation = await Vacation.findOne({
      where: { 
        id: id,
        employee_id: employeeId 
      }
    });

    if (!vacation) {
      return res.status(404).json({ error: 'Отпуск не найден' });
    }

    await vacation.destroy();
    res.json({ message: 'Отпуск успешно удален' });
  } catch (error) {
    console.error('Error deleting vacation:', error);
    res.status(500).json({ error: 'Ошибка при удалении отпуска' });
  }
});

module.exports = router; 