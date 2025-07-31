const { sequelize } = require('../config/sequelize');
const { DataTypes } = require('sequelize');

// 1. Сначала инициализируем все модели
const TokenType = require('./TokenType')(sequelize, DataTypes);
const EmployeeToken = require('./EmployeeToken')(sequelize, DataTypes);
const TokenTransaction = require('./TokenTransaction')(sequelize, DataTypes);
const Token = require('./Token')(sequelize, DataTypes);
const Achievement = require('./Achievement')(sequelize, DataTypes);
const EmployeeAchievement = require('./EmployeeAchievement')(sequelize, DataTypes);
const TokenDistribution = require('./TokenDistribution')(sequelize, DataTypes);
const DistributionSettings = require('./DistributionSettings')(sequelize, DataTypes);

// Остальные модели (если они используют sequelize.define, а не init)
const Department = require('./Department');
const Employee = require('./Employee');
const EmployeeSkill = require('./EmployeeSkill');
const Skill = require('./Skill');
const SkillLevel = require('./SkillLevel');
const SkillGroup = require('./SkillGroup');
const Role = require('./Role');
const Product = require('./Product');
const ProductType = require('./ProductType');
const ProductParticipant = require('./ProductParticipant');
const ProductVersion = require('./ProductVersion');
const ProductRelation = require('./ProductRelation');
const ProductRelationType = require('./ProductRelationType');
const Vacation = require('./Vacation');
const Notification = require('./Notification');
const Template = require('./Template');
const NotificationChat = require('./NotificationChat');
const MeetingRoom = require('./MeetingRoom');
const MeetingRoomBooking = require('./MeetingRoomBooking');
const BookingRequest = require('./BookingRequest');
const AppSettings = require('./AppSettings')(sequelize);

// 2. Собираем все модели в объект
const models = {
  Department,
  Employee,
  EmployeeSkill,
  Skill,
  SkillLevel,
  SkillGroup,
  Role,
  Product,
  ProductType,
  ProductParticipant,
  ProductVersion,
  ProductRelation,
  ProductRelationType,
  Vacation,
  Notification,
  Template,
  NotificationChat,
  MeetingRoom,
  MeetingRoomBooking,
  BookingRequest,
  TokenType,
  EmployeeToken,
  TokenTransaction,
  Token,
  Achievement,
  EmployeeAchievement,
  TokenDistribution,
  DistributionSettings,
  AppSettings,
};

// 3. Только теперь вызываем ассоциации для всех моделей
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

// Sync database
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
  } catch (error) {
    throw error;
  }
};

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  sequelize,
  ...models,
  syncDatabase,
  testConnection
}; 