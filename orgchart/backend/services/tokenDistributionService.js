const { Op } = require('sequelize');
const moment = require('moment-timezone');

// Импортируем модели
let TokenType, TokenDistribution, Employee, EmployeeToken, DistributionSettings;

try {
  const models = require('../models');
  TokenType = models.TokenType;
  TokenDistribution = models.TokenDistribution;
  Employee = models.Employee;
  EmployeeToken = models.EmployeeToken;
  DistributionSettings = models.DistributionSettings;
} catch (error) {
  console.error('Ошибка импорта моделей:', error);
}

class TokenDistributionService {
  constructor() {
    this.isRunning = false;
    this.runningDistributions = new Set();
  }

  // Получает настройки сервиса
  async getSettings() {
    let settings = await DistributionSettings.findOne();
    if (!settings) {
      // Создаем настройки по умолчанию
      settings = await DistributionSettings.create({});
    }
    return settings;
  }

  // Проверяет рабочий ли день
  async isWorkingDay(date, settings) {
    const momentDate = moment.tz(date, settings.timezone);
    const dayOfWeek = momentDate.day(); // 0 = воскресенье, 1 = понедельник
    const dayOfWeekISO = dayOfWeek === 0 ? 7 : dayOfWeek; // Преобразуем в ISO формат

    // Проверяем рабочие дни
    if (!settings.workingDays.includes(dayOfWeekISO)) {
      return false;
    }

    // Проверяем праздники
    const dateString = momentDate.format('YYYY-MM-DD');
    if (settings.holidays && settings.holidays.includes(dateString)) {
      return false;
    }

    return true;
  }

  // Вычисляет следующую дату распределения
  async calculateNextDistributionDate(tokenType, lastDistributionDate = null, settings) {
    const moment = require('moment-timezone');
    const now = moment.tz(settings.timezone);
    let nextDate;

    if (!lastDistributionDate) {
      // Первое распределение - запланировать на ближайшее время выполнения
      nextDate = now.clone();
      const [hours, minutes] = settings.executionTime.split(':');
      nextDate.hours(parseInt(hours)).minutes(parseInt(minutes)).seconds(0);

      // Если время уже прошло сегодня, планируем на завтра
      if (nextDate.isBefore(now)) {
        nextDate.add(1, 'day');
      }
    } else {
      // Следующее распределение на основе периода
      const lastDate = moment.tz(lastDistributionDate, settings.timezone);
      
      switch (tokenType.autoDistributionPeriod) {
        case 'week':
          nextDate = lastDate.clone().add(1, 'week');
          break;
        case 'month':
          nextDate = lastDate.clone().add(1, 'month');
          break;
        case 'quarter':
          nextDate = lastDate.clone().add(3, 'months');
          break;
        case 'half_year':
          nextDate = lastDate.clone().add(6, 'months');
          break;
        case 'year':
          nextDate = lastDate.clone().add(1, 'year');
          break;
        default:
          return null;
      }

      // Устанавливаем время выполнения
      const [hours, minutes] = settings.executionTime.split(':');
      nextDate.hours(parseInt(hours)).minutes(parseInt(minutes)).seconds(0);
    }

    // Корректируем на рабочий день если нужно
    while (!await this.isWorkingDay(nextDate.toDate(), settings)) {
      nextDate.add(1, 'day');
    }

    return nextDate.toDate();
  }

  // Создает плановые распределения для всех активных типов токенов
  async createScheduledDistributions() {
    const settings = await this.getSettings();
    if (!settings.serviceEnabled) {
      return;
    }

    const tokenTypes = await TokenType.findAll({
      where: {
        autoDistribution: true,
        autoDistributionActive: true
      }
    });

    for (const tokenType of tokenTypes) {
      try {
        // Проверяем есть ли уже запланированное распределение
        const existingScheduled = await TokenDistribution.findOne({
          where: {
            tokenTypeId: tokenType.id,
            status: 'scheduled'
          }
        });

        if (existingScheduled) {
          continue; // Уже есть запланированное
        }

        // Ищем последнее выполненное распределение
        const lastDistribution = await TokenDistribution.findOne({
          where: {
            tokenTypeId: tokenType.id,
            status: 'completed'
          },
          order: [['executedDate', 'DESC']]
        });

        const nextDate = await this.calculateNextDistributionDate(
          tokenType, 
          lastDistribution?.executedDate, 
          await this.getSettings()
        );

        if (nextDate) {
          await TokenDistribution.create({
            tokenTypeId: tokenType.id,
            status: 'scheduled',
            scheduledDate: nextDate,
            distributionPeriod: tokenType.autoDistributionPeriod,
            distributionAmount: tokenType.autoDistributionAmount,
            timezone: settings.timezone,
            workingDaysOnly: settings.workingDaysOnly
          });
        }
      } catch (error) {
        console.error(`Ошибка создания планового распределения для ${tokenType.name}:`, error);
      }
    }
  }

  // Проверяет готовые к выполнению распределения
  async getReadyDistributions() {
    const settings = await this.getSettings();
    const now = moment.tz(settings.timezone);

    return await TokenDistribution.findAll({
      where: {
        status: 'scheduled',
        scheduledDate: {
          [Op.lte]: now.toDate()
        }
      },
      include: [{
        model: TokenType,
        required: true
      }],
      order: [['scheduledDate', 'ASC']]
    });
  }

  // Выполняет одно распределение
  async executeDistribution(distribution) {
    if (this.runningDistributions.has(distribution.id)) {
      return; // Уже выполняется
    }

    this.runningDistributions.add(distribution.id);

    try {
      // Обновляем статус
      await distribution.update({
        status: 'in_progress',
        executedDate: new Date()
      });

      const tokenType = await TokenType.findByPk(distribution.tokenTypeId);
      if (!tokenType || !tokenType.autoDistribution) {
        throw new Error('Тип токенов не найден или отключен');
      }

      // Получаем всех активных сотрудников
      const employees = await Employee.findAll({
        where: {
          // Добавьте условия для активных сотрудников
        }
      });

      await distribution.update({
        targetEmployeesCount: employees.length
      });

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const results = [];
      let successCount = 0;
      let errorCount = 0;
      let totalTokensDistributed = 0;

      // Обрабатываем сотрудников батчами
      const settings = await this.getSettings();
      const batchSize = settings.distributionBatchSize;

      for (let i = 0; i < employees.length; i += batchSize) {
        const batch = employees.slice(i, i + batchSize);

        for (const employee of batch) {
          try {
            // Проверяем существующие токены
            let employeeToken = await EmployeeToken.findOne({
              where: {
                employeeId: employee.id,
                tokenTypeId: tokenType.id,
                year: currentYear,
                month: currentMonth
              }
            });

            if (employeeToken) {
              employeeToken.count += distribution.distributionAmount;
              await employeeToken.save();
            } else {
              employeeToken = await EmployeeToken.create({
                employeeId: employee.id,
                tokenTypeId: tokenType.id,
                count: distribution.distributionAmount,
                year: currentYear,
                month: currentMonth
              });
            }

            results.push({
              employeeId: employee.id,
              employeeName: `${employee.first_name} ${employee.last_name}`,
              success: true,
              tokensDistributed: distribution.distributionAmount,
              totalTokens: employeeToken.count
            });

            successCount++;
            totalTokensDistributed += distribution.distributionAmount;

          } catch (error) {
            console.error(`Ошибка начисления токенов сотруднику ${employee.id}:`, error);
            results.push({
              employeeId: employee.id,
              success: false,
              error: error.message
            });
            errorCount++;
          }
        }

        // Обновляем прогресс
        await distribution.update({
          processedEmployeesCount: Math.min(i + batchSize, employees.length),
          successCount,
          errorCount,
          totalTokensDistributed
        });
      }

      // Завершаем распределение
      await distribution.update({
        status: errorCount === 0 ? 'completed' : 'failed',
        processedEmployeesCount: employees.length,
        successCount,
        errorCount,
        totalTokensDistributed,
        executionLog: JSON.stringify(results),
        errorMessage: errorCount > 0 ? `Ошибок: ${errorCount} из ${employees.length}` : null
      });

      // Создаем следующее плановое распределение
      const nextDate = await this.calculateNextDistributionDate(
        tokenType,
        distribution.executedDate,
        await this.getSettings()
      );

      if (nextDate) {
        await TokenDistribution.create({
          tokenTypeId: tokenType.id,
          status: 'scheduled',
          scheduledDate: nextDate,
          distributionPeriod: tokenType.autoDistributionPeriod,
          distributionAmount: tokenType.autoDistributionAmount,
          timezone: distribution.timezone,
          workingDaysOnly: distribution.workingDaysOnly
        });
      }

      return {
        distributionId: distribution.id,
        success: true,
        totalEmployees: employees.length,
        successCount,
        errorCount,
        totalTokensDistributed
      };

    } catch (error) {
      console.error(`Ошибка выполнения распределения ${distribution.id}:`, error);
      
      await distribution.update({
        status: 'failed',
        errorMessage: error.message
      });

      return {
        distributionId: distribution.id,
        success: false,
        error: error.message
      };
    } finally {
      this.runningDistributions.delete(distribution.id);
    }
  }

  // Основной метод проверки и выполнения
  async checkAndExecute() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      const settings = await this.getSettings();
      if (!settings.serviceEnabled) {
        return;
      }

      // Создаем плановые распределения если нужно
      await this.createScheduledDistributions();

      // Получаем готовые к выполнению
      const readyDistributions = await this.getReadyDistributions();

      const results = [];
      let runningCount = 0;

      for (const distribution of readyDistributions) {
        if (runningCount >= settings.maxConcurrentDistributions) {
          break;
        }

        // Проверяем рабочий день
        if (!await this.isWorkingDay(new Date(), settings)) {
          continue;
        }

        const result = await this.executeDistribution(distribution);
        results.push(result);
        runningCount++;
      }

      return results;

    } catch (error) {
      console.error('Ошибка основного цикла распределения токенов:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // Запуск планировщика
  startScheduler() {
    const settings = this.getSettings();
    
    const scheduleCheck = async () => {
      try {
        const currentSettings = await this.getSettings();
        if (!currentSettings.serviceEnabled) {
          return;
        }

        const now = moment.tz(currentSettings.timezone);
        const [hours, minutes] = currentSettings.executionTime.split(':');
        const targetTime = now.clone().hours(parseInt(hours)).minutes(parseInt(minutes)).seconds(0);

        // Проверяем время выполнения (с окном в 1 час)
        const diffMinutes = Math.abs(now.diff(targetTime, 'minutes'));
        
        if (diffMinutes <= 60) {
          await this.checkAndExecute();
        }

      } catch (error) {
        console.error('Ошибка в планировщике распределения токенов:', error);
      }
    };

    // Проверяем при запуске
    scheduleCheck();
    
    // Проверяем каждые 30 минут
    setInterval(scheduleCheck, 30 * 60 * 1000);
  }

  // Получение статистики
  async getStatistics(limit = 50) {
    const scheduled = await TokenDistribution.findAll({
      where: { status: 'scheduled' },
      include: [{ 
        model: TokenType, 
        as: 'tokenType',
        attributes: ['name', 'backgroundColor', 'value']
      }],
      order: [['scheduledDate', 'ASC']],
      limit
    });

    const completed = await TokenDistribution.findAll({
      where: { status: { [Op.in]: ['completed', 'failed'] } },
      include: [{ 
        model: TokenType, 
        as: 'tokenType',
        attributes: ['name', 'backgroundColor', 'value']
      }],
      order: [['executedDate', 'DESC']],
      limit
    });

    const inProgress = await TokenDistribution.findAll({
      where: { status: 'in_progress' },
      include: [{ 
        model: TokenType, 
        as: 'tokenType',
        attributes: ['name', 'backgroundColor', 'value']
      }],
      order: [['scheduledDate', 'ASC']]
    });

    return {
      scheduled,
      completed,
      inProgress,
      summary: {
        totalScheduled: scheduled.length,
        totalCompleted: completed.filter(d => d.status === 'completed').length,
        totalFailed: completed.filter(d => d.status === 'failed').length,
        totalInProgress: inProgress.length
      }
    };
  }

  // Ручной запуск распределения
  async manualDistribution(tokenTypeId) {
    const settings = await this.getSettings();
    const tokenType = await TokenType.findByPk(tokenTypeId);

    if (!tokenType) {
      throw new Error('Тип токенов не найден');
    }

    const distribution = await TokenDistribution.create({
      tokenTypeId: tokenType.id,
      status: 'scheduled',
      scheduledDate: new Date(),
      distributionPeriod: tokenType.autoDistributionPeriod || 'manual',
      distributionAmount: tokenType.autoDistributionAmount || 1,
      timezone: settings.timezone,
      workingDaysOnly: false // Ручной запуск игнорирует рабочие дни
    });

    return await this.executeDistribution(distribution);
  }

  // Добавить тип токена в активное автоматическое распределение
  async addActiveTokenType(tokenTypeId) {
    try {
      const tokenType = await TokenType.findByPk(tokenTypeId);
      if (!tokenType) {
        throw new Error('Тип токена не найден');
      }

      if (!tokenType.autoDistribution) {
        throw new Error('У данного типа токена не включено автоматическое распределение');
      }

      // Обновляем статус активности
      await tokenType.update({ autoDistributionActive: true });

      // Создаем следующее плановое распределение если его еще нет
      await this.createScheduledDistributions();

      return true;
    } catch (error) {
      console.error('Error adding active token type:', error);
      throw error;
    }
  }

  // Удалить тип токена из активного автоматического распределения
  async removeActiveTokenType(tokenTypeId) {
    try {
      const tokenType = await TokenType.findByPk(tokenTypeId);
      if (!tokenType) {
        throw new Error('Тип токена не найден');
      }

      // Обновляем статус активности
      await tokenType.update({ autoDistributionActive: false });

      // Отменяем все запланированные распределения для этого типа токена
      await TokenDistribution.update(
        { status: 'cancelled' },
        {
          where: {
            tokenTypeId: tokenTypeId,
            status: 'scheduled'
          }
        }
      );

      return true;
    } catch (error) {
      console.error('Error removing active token type:', error);
      throw error;
    }
  }
}

module.exports = new TokenDistributionService(); 