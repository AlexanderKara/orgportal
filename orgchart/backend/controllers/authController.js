const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { sendAuthCode: sendEmailCode } = require('../services/emailService');
const { sendAuthCode: sendTelegramCode } = require('../services/telegramService');
const { Employee, Department, Role, NotificationChat } = require('../models');
const { EmployeeSkill, Skill, SkillLevel } = require('../models');

// Mock codes storage (in real app, use Redis or database)
const activeCodes = new Map();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Get public profile (without sensitive data)
const getPublicProfile = (employee) => {
  const { password, ...publicProfile } = employee;
  if (employee.department_role) {
    publicProfile.department_role = employee.department_role;
  }
  return publicProfile;
};

// Generate 4-digit code
const generateCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Send code to email (real implementation)
const sendEmailCodeReal = async (email, code) => {
  return await sendEmailCode(email, code);
};

// Send code to Telegram (real implementation)
const sendTelegramCodeReal = async (telegram, code) => {
  return await sendTelegramCode(telegram, code);
};

// @desc    Send authentication code
// @route   POST /api/auth/send-code
// @access  Public
const sendCode = async (req, res) => {
  try {
    const { login } = req.body;

    if (!login) {
      return res.status(400).json({ error: 'Необходимо указать логин' });
    }

    // Определяем тип логина
    let isEmail = login.includes('@') && login.includes('.');
    let isTelegram = login.startsWith('@');

    if (!isEmail && !isTelegram) {
      return res.status(400).json({ error: 'Необходимо указать корректный email или telegram_id' });
    }

    let employee;
    if (isEmail) {
      employee = await Employee.findOne({ where: { email: login } });
    } else if (isTelegram) {
      employee = await Employee.findOne({ where: { telegram: login } });
    }

    if (!employee) {
      return res.status(404).json({ error: 'Сотрудник не найден' });
    }

    if (employee.status !== 'active') {
      return res.status(403).json({ error: 'Аккаунт неактивен' });
    }

    // Генерируем код
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    // Сохраняем код в памяти
    activeCodes.set(login, {
      code,
      employeeId: employee.id,
      expiresAt
    });

    // Отправляем код
    if (isEmail) {
      await sendEmailCode(login, code);
    } else if (isTelegram) {
      console.log('Отправка кода в Telegram:', login, 'Код:', code);
      await sendTelegramCode(login, code);
    }

    res.json({ message: 'Код отправлен' });
  } catch (error) {
    console.error('Ошибка при отправке кода:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

// @desc    Verify authentication code
// @route   POST /api/auth/verify-code
// @access  Public
const verifyCode = async (req, res) => {
  try {
    console.log('verifyCode вызвана с данными:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Ошибки валидации:', errors.array());
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { login, code } = req.body;
    console.log('Получены данные - login:', login, 'code:', code);

    if (!login || !code) {
      console.log('Отсутствуют обязательные поля');
      return res.status(400).json({
        success: false,
        message: 'Логин и код обязательны'
      });
    }

    // Get stored code data
    const codeData = activeCodes.get(login);
    console.log('Найденные данные кода:', codeData);
    
    if (!codeData) {
      console.log('Код не найден для login:', login);
      return res.status(400).json({
        success: false,
        message: 'Код не найден или истек'
      });
    }

    // Check if code expired
    console.log('Проверка истечения кода. Текущее время:', new Date(), 'Время истечения:', codeData.expiresAt);
    if (new Date() > codeData.expiresAt) {
      console.log('Код истек');
      activeCodes.delete(login);
      return res.status(400).json({
        success: false,
        message: 'Код истек'
      });
    }

    // Verify code
    console.log('Сравнение кодов. Ожидаемый:', codeData.code, 'Полученный:', code);
    if (codeData.code !== code) {
      console.log('Код не совпадает');
      return res.status(400).json({
        success: false,
        message: 'Код введен неверно'
      });
    }

    // Find employee in MySQL database
    const employee = await Employee.findByPk(codeData.employeeId, {
      include: [
        { model: Department, as: 'department' },
        { model: Role, as: 'adminRoles' }
      ]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Update last login
    await employee.update({ last_login: new Date() });

    // Generate token
    const token = generateToken(employee.id);

    // Remove used code
    activeCodes.delete(login);

    res.json({
      success: true,
      message: 'Авторизация успешна',
      token,
      employee: getPublicProfile(employee.toJSON())
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

// @desc    Confirm authentication code (for Telegram mini-app)
// @route   POST /api/auth/confirm-code
// @access  Public
const confirmCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Код обязателен'
      });
    }

    // Find code in active codes
    let foundCodeData = null;
    let foundLogin = null;
    
    for (const [login, codeData] of activeCodes.entries()) {
      if (codeData.code === code) {
        foundCodeData = codeData;
        foundLogin = login;
        break;
      }
    }
    
    if (!foundCodeData) {
      return res.status(400).json({
        success: false,
        message: 'Код не найден или истек'
      });
    }

    // Check if code expired
    if (new Date() > foundCodeData.expiresAt) {
      activeCodes.delete(foundLogin);
      return res.status(400).json({
        success: false,
        message: 'Код истек'
      });
    }

    // Find employee in MySQL database
    const employee = await Employee.findByPk(foundCodeData.employeeId, {
      include: [
        { model: Department, as: 'department' },
        { model: Role, as: 'adminRoles' }
      ]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Update last login
    await employee.update({ last_login: new Date() });

    // Generate token
    const token = generateToken(employee.id);

    // Remove used code
    activeCodes.delete(foundLogin);

    res.json({
      success: true,
      message: 'Авторизация успешна',
      token,
      employee: getPublicProfile(employee.toJSON())
    });
  } catch (error) {
    console.error('Confirm code error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.employee.id, {
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'color']
        },
        {
          model: Role,
          as: 'adminRoles',
          through: { attributes: [] },
          attributes: ['id', 'name', 'color', 'icon', 'permissions', 'visible_sections']
        },
        {
          model: EmployeeSkill,
          as: 'employeeSkills',
          include: [
            {
              model: Skill,
              as: 'skill',
              attributes: ['id', 'name', 'skill_type', 'color']
            },
            {
              model: SkillLevel,
              as: 'skillLevel',
              attributes: ['id', 'name', 'value']
            }
          ]
        }
      ]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Transform skills data
    const employeeData = employee.toJSON();
    const skills = {
      hardSkills: [],
      softSkills: [],
      hobbies: []
    };

    if (employeeData.employeeSkills) {
      employeeData.employeeSkills.forEach(employeeSkill => {
        
        const skillData = {
          id: employeeSkill.skill.id,
          label: employeeSkill.skill.name,
          level: employeeSkill.skillLevel ? employeeSkill.skillLevel.value : null,
          color: employeeSkill.skill.color
        };
        

        switch (employeeSkill.skill.skill_type) {
          case 'hard':
            skills.hardSkills.push(skillData);
            break;
          case 'soft':
            skills.softSkills.push(skillData);
            break;
          case 'hobby':
            skills.hobbies.push(skillData);
            break;
        }
      });
    }

    // Format birth_date to YYYY-MM-DD if it exists
    if (employeeData.birth_date) {
      const date = new Date(employeeData.birth_date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      employeeData.birth_date = `${year}-${month}-${day}`;
    }

    // Format hire_date to YYYY-MM-DD if it exists
    if (employeeData.hire_date) {
      const date = new Date(employeeData.hire_date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      employeeData.hire_date = `${year}-${month}-${day}`;
    }

    // Add skills to response
    employeeData.hardSkills = skills.hardSkills;
    employeeData.softSkills = skills.softSkills;
    employeeData.hobbies = skills.hobbies;

    res.json({
      success: true,
      employee: getPublicProfile(employeeData)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { phone, telegram, birth_date, wishlist_url, email, avatar, hire_date, hardSkills, softSkills, hobbies } = req.body;
    
    const employee = await Employee.findByPk(req.employee.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Update basic profile fields
    const updateData = {};
    
    if (phone !== undefined) {
      updateData.phone = phone;
    }
    if (telegram !== undefined) {
      updateData.telegram = telegram;
    }
    if (birth_date !== undefined) {
      updateData.birth_date = birth_date;
    }
    if (wishlist_url !== undefined) {
      updateData.wishlist_url = wishlist_url;
    }
    if (email !== undefined) {
      updateData.email = email;
    }
    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }
    if (hire_date !== undefined) {
      updateData.hire_date = hire_date;
    }
    
    try {
      await employee.update(updateData);
    } catch (updateError) {
      throw updateError;
    }

    // Update skills if provided
    if (hardSkills !== undefined || softSkills !== undefined || hobbies !== undefined) {
      
      try {
        // First, remove all existing skills for this employee
        await EmployeeSkill.destroy({
          where: { employee_id: req.employee.id }
        });

        // Helper function to process skills
        const processSkills = async (skills, category) => {
          if (!Array.isArray(skills)) return;
          
          for (const skillData of skills) {
            if (!skillData.label) continue;
            
            // Find or create skill
            let skill = await Skill.findOne({
              where: { name: skillData.label }
            });
            
            if (!skill) {
              skill = await Skill.create({
                name: skillData.label,
                skill_type: category,
                color: '#3B82F6'
              });
            }
            
            // Find skill level if level is provided
            let skillLevelId = null;
            if (skillData.level && skillData.level !== null) {
              const skillLevel = await SkillLevel.findOne({
                where: { value: skillData.level }
              });
              if (skillLevel) {
                skillLevelId = skillLevel.id;
              }
            }
            
            // Create employee skill with skill_level_id
            await EmployeeSkill.create({
              employee_id: req.employee.id,
              skill_id: skill.id,
              skill_level_id: skillLevelId
            });
          }
        };

        // Process each skill type
        if (hardSkills !== undefined) {
          await processSkills(hardSkills, 'hard');
        }
        if (softSkills !== undefined) {
          await processSkills(softSkills, 'soft');
        }
        if (hobbies !== undefined) {
          await processSkills(hobbies, 'hobby');
        }
        
      } catch (skillsError) {
        throw skillsError;
      }
    }

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// @desc    Change password (for admin users)
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;

    const employee = await Employee.findByPk(req.employee.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, employee.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await employee.update({ password: hashedPassword });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // In a real app, you might want to blacklist the token
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Register employee (for development/testing)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password, firstName, lastName, position, department } = req.body;

    // Check if employee exists
    const employeeExists = await Employee.findOne({ where: { email } });
    if (employeeExists) {
      return res.status(400).json({
        success: false,
        message: 'Employee already exists'
      });
    }

    // Find department
    const departmentRecord = await Department.findOne({ where: { name: department } });
    if (!departmentRecord) {
      return res.status(400).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create employee
    const newEmployee = await Employee.create({
      email,
      password: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      position,
      department_id: departmentRecord.id,
      hire_date: new Date(),
      status: 'active',
      role: 'employee',
      theme: 'light',
      language: 'ru'
    });

    // Generate token
    const token = generateToken(newEmployee.id);

    res.status(201).json({
      success: true,
      token,
      employee: getPublicProfile(newEmployee.toJSON())
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Login employee (password-based login as fallback)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Check for employee
    const employee = await Employee.findOne({
      where: { email },
      include: [
        { model: Department, as: 'department' },
        { model: Role, as: 'adminRoles' }
      ]
    });

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if employee is active
    if (employee.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await employee.update({ last_login: new Date() });

    // Generate token
    const token = generateToken(employee.id);

    res.json({
      success: true,
      token,
      employee: getPublicProfile(employee.toJSON())
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add new employee (for development/testing)
// @route   POST /api/auth/add-employee
// @access  Public
const addEmployee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, firstName, lastName, position, department, telegram, phone } = req.body;

    // Check if employee exists
    const employeeExists = await Employee.findOne({ where: { email } });
    if (employeeExists) {
      return res.status(400).json({
        success: false,
        message: 'Employee already exists'
      });
    }

    // Find department
    const departmentRecord = await Department.findOne({ where: { name: department } });
    if (!departmentRecord) {
      return res.status(400).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Generate random password
    const password = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create employee
    const newEmployee = await Employee.create({
      email,
      password: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      position,
      department_id: departmentRecord.id,
      telegram: telegram || null,
      phone: phone || null,
      hire_date: new Date(),
      status: 'active',
      role: 'employee',
      theme: 'light',
      language: 'ru'
    });

    res.status(201).json({
      success: true,
      message: 'Employee added successfully',
      employee: getPublicProfile(newEmployee.toJSON()),
      password: password // Return password for admin to share with employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  sendCode,
  verifyCode,
  addEmployee,
  confirmCode
}; 