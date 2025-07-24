import React, { useState, useEffect } from 'react';
import { X, Image } from 'lucide-react';
import Select from 'react-select';
import SkillLevelModal from './SkillLevelModal';
import Avatar from './ui/Avatar';
import api from '../services/api';
import { getCachedData, setCachedData, clearCache } from '../utils/cache';
import { showNotification } from '../utils/notifications';

// Загружаем навыки из API с кэшированием
const useSkillsData = () => {
  const [skillsData, setSkillsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSkills = async () => {
      try {
        setLoading(true);
        
        // Check cache first
        const cachedSkills = getCachedData('skills');
        if (cachedSkills) {
          setSkillsData(cachedSkills);
          setLoading(false);
          return;
        }

        const response = await api.getSkills();
        const skillsArray = Array.isArray(response) ? response : (response.data || []);
        setSkillsData(skillsArray);
        
        // Cache the result
        setCachedData('skills', skillsArray);
      } catch (error) {
        setSkillsData([]);
      } finally {
        setLoading(false);
      }
    };

    loadSkills();
  }, []);

  return { skillsData, loading };
};

// Загружаем отделы из API с кэшированием
const useDepartmentsData = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Проверяем кэш сначала
        const cachedDepartments = getCachedData('departments');
        if (cachedDepartments) {
          setDepartments(cachedDepartments);
          setLoading(false);
          return;
        }
        
        const response = await api.getDepartments();
        
        // Обрабатываем разные форматы ответа
        let departmentsData = [];
        if (Array.isArray(response)) {
          departmentsData = response;
        } else if (response && response.departments) {
          departmentsData = response.departments;
        } else if (response && response.data) {
          departmentsData = response.data;
        } else if (response && response.success && response.departments) {
          // Новый формат ответа от бэкенда
          departmentsData = response.departments;
        } else {
          departmentsData = [];
        }
        
        const formattedDepartments = departmentsData.map(dept => ({
          value: dept.id,
          label: dept.name
        }));
        
        setDepartments(formattedDepartments);
        
        // Cache the result
        setCachedData('departments', formattedDepartments);
      } catch (error) {
        setError(error.message || 'Ошибка загрузки отделов');
        setDepartments([]);
      } finally {
        setLoading(false);
      }
    };

    loadDepartments();
  }, []); // Убираем forceReload из зависимостей

  return { departments, loading, error };
};

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderRadius: 8,
    backgroundColor: '#D9D9D9',
    minHeight: 40,
    borderColor: state.isFocused ? '#FF8A15' : '#D9D9D9',
    boxShadow: state.isFocused ? '0 0 0 2px #FF8A15' : 'none',
    outline: 'none',
    '&:hover': {
      borderColor: '#FF8A15',
    },
    paddingRight: 0,
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: 8,
    zIndex: 99999,
    minWidth: 'fit-content',
    width: 'auto',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#FF8A15' : state.isFocused ? '#FFE5CC' : '#fff',
    color: state.isSelected ? '#fff' : '#2D2D2D',
    borderRadius: 6,
    cursor: 'pointer',
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: '#BDBDBD',
    paddingRight: 8,
    paddingLeft: 4,
  }),
};

const roles = [
  { value: '', label: 'Не выбрано' },
  { value: 'lead', label: 'Лид' },
  { value: 'deputy', label: 'Зам' },
  { value: 'product', label: 'Продакт' },
];

export default function EmployeeModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingEmployee = null,
  existingEmployees = []
}) {
  const { skillsData, loading: skillsLoading } = useSkillsData();
  const { departments, loading: departmentsLoading, error: departmentsError } = useDepartmentsData();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [department, setDepartment] = useState(null);
  const [role, setRole] = useState(null);
  const [competencies, setCompetencies] = useState('');
  const [hardSkills, setHardSkills] = useState([]);
  const [softSkills, setSoftSkills] = useState([]);
  const [hobbies, setHobbies] = useState([]);
  const [notes, setNotes] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarSaving, setAvatarSaving] = useState(false);
  
  // Dropdown visibility state
  const [showHardSkillsDropdown, setShowHardSkillsDropdown] = useState(false);
  const [showSoftSkillsDropdown, setShowSoftSkillsDropdown] = useState(false);
  const [showHobbiesDropdown, setShowHobbiesDropdown] = useState(false);
  
  // Input values for filtering
  const [hardSkillsInput, setHardSkillsInput] = useState('');
  const [softSkillsInput, setSoftSkillsInput] = useState('');
  const [hobbiesInput, setHobbiesInput] = useState('');
  
  // Skill level modal state
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [selectedSkillForLevel, setSelectedSkillForLevel] = useState(null);
  
  // Track skills changes
  const [originalSkills, setOriginalSkills] = useState({
    hardSkills: [],
    softSkills: [],
    hobbies: []
  });
  const [skillsChanged, setSkillsChanged] = useState(false);
  
  // Track all field changes
  const [originalData, setOriginalData] = useState({});
  const [changedFields, setChangedFields] = useState(new Set());

  // Reset form when modal opens/closes or editing employee changes
  useEffect(() => {
    if (isOpen) {
      
      if (editingEmployee && typeof editingEmployee === 'object') {
        setFirstName(editingEmployee.first_name || '');
        setLastName(editingEmployee.last_name || '');
        setEmail(editingEmployee.email || '');
        setPhone(editingEmployee.phone || '');
        setTelegram(editingEmployee.telegram || '');
        
        // Форматируем даты для input type="date"
        const formatDateForInput = (dateString) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        };
        
        setHireDate(formatDateForInput(editingEmployee.hire_date));
        setBirthDate(formatDateForInput(editingEmployee.birth_date));
        
        setCompetencies(editingEmployee.competencies || '');
        
        // Сохраняем оригинальные данные для сравнения
        setOriginalData({
          firstName: editingEmployee.first_name || '',
          lastName: editingEmployee.last_name || '',
          email: editingEmployee.email || '',
          phone: editingEmployee.phone || '',
          telegram: editingEmployee.telegram || '',
          hireDate: formatDateForInput(editingEmployee.hire_date),
          birthDate: formatDateForInput(editingEmployee.birth_date),
          department: editingEmployee.department_id,
          role: editingEmployee.department_role || '',
          competencies: editingEmployee.competencies || '',
          notes: editingEmployee.notes || '',
          avatar: editingEmployee.avatar || ''
        });
        setChangedFields(new Set());
        
        // Загружаем навыки сотрудника
        const loadEmployeeSkills = async () => {
          try {
            // Преобразуем навыки из API в формат для frontend
            const hardSkills = [];
            const softSkills = [];
            const hobbies = [];
            
            if (editingEmployee.employeeSkills) {
              editingEmployee.employeeSkills.forEach(employeeSkill => {
                const skillData = {
                  id: employeeSkill.skill.id,
                  label: employeeSkill.skill.name,
                  value: employeeSkill.skill.id,
                  level: employeeSkill.level || 'none'
                };
                
                switch (employeeSkill.skill.skill_type) {
                  case 'hard':
                    hardSkills.push(skillData);
                    break;
                  case 'soft':
                    softSkills.push(skillData);
                    break;
                  case 'hobby':
                    hobbies.push(skillData);
                    break;
                  default:
                    // По умолчанию добавляем в хард скиллы
                    hardSkills.push(skillData);
                }
              });
            }
            
            setHardSkills(hardSkills);
            setSoftSkills(softSkills);
            setHobbies(hobbies);
            
            // Сохраняем оригинальные навыки для сравнения
            setOriginalSkills({
              hardSkills: [...hardSkills],
              softSkills: [...softSkills],
              hobbies: [...hobbies]
            });
            setSkillsChanged(false);
          } catch (error) {
            setHardSkills([]);
            setSoftSkills([]);
            setHobbies([]);
          }
        };
        
        loadEmployeeSkills();
        setNotes(editingEmployee.notes || '');
        setAvatar(editingEmployee.avatar || '');
        setAvatarSaving(false);
      } else {
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setTelegram('');
        setHireDate('');
        setBirthDate('');
        setDepartment(null);
        setRole(null);
        setCompetencies('');
        setHardSkills([]);
        setSoftSkills([]);
        setHobbies([]);
        setNotes('');
        setAvatar('');
        setAvatarSaving(false);
      }
    }
  }, [isOpen, editingEmployee]);

  // Отдельный useEffect для установки отдела и роли после загрузки departments
  useEffect(() => {
    if (isOpen && editingEmployee && departments.length > 0 && !departmentsLoading) {
      setDepartment(departments.find(d => d.value === editingEmployee.department_id) || null);
      setRole(roles.find(r => r.value === editingEmployee.department_role) || null);
    }
  }, [isOpen, editingEmployee, departments, departmentsLoading]);

  // Отдельный useEffect для аватара, чтобы он обновлялся при изменении
  useEffect(() => {
    if (editingEmployee && editingEmployee.avatar) {
      setAvatar(editingEmployee.avatar);
      setAvatarSaving(false);
    }
  }, [editingEmployee?.avatar]);

  const handleAddTag = (tag, type, setter) => {
    const newTag = { id: Date.now(), label: tag.label, value: tag.value };
    setter(prev => [...prev, newTag]);
    setSkillsChanged(true);
  };

  const handleRemoveTag = (tagId, setter) => {
    setter(prev => prev.filter(tag => tag.id !== tagId));
    setSkillsChanged(true);
  };

  const handleCreateTag = (inputValue, type, setter) => {
    const newTag = { id: Date.now(), label: inputValue, value: inputValue, level: null };
    setter(prev => [...prev, newTag]);
    setSkillsChanged(true);
    // Show level selection modal
    setSelectedSkillForLevel({ tag: newTag, setter, type });
    setShowLevelModal(true);
  };

  const handleTagSelect = (option, type, setter) => {
    const newTag = { id: Date.now(), label: option.label, value: option.value, level: null };
    setter(prev => [...prev, newTag]);
    setSkillsChanged(true);
    // Show level selection modal
    setSelectedSkillForLevel({ tag: newTag, setter, type });
    setShowLevelModal(true);
  };

  const handleInputFocus = (type) => {
    switch (type) {
      case 'hard':
        setShowHardSkillsDropdown(true);
        break;
      case 'soft':
        setShowSoftSkillsDropdown(true);
        break;
      case 'hobby':
        setShowHobbiesDropdown(true);
        break;
    }
  };

  const handleInputBlur = (type) => {
    setTimeout(() => {
      switch (type) {
        case 'hard':
          setShowHardSkillsDropdown(false);
          break;
        case 'soft':
          setShowSoftSkillsDropdown(false);
          break;
        case 'hobby':
          setShowHobbiesDropdown(false);
          break;
      }
    }, 200);
  };

  const handleLevelSelect = (level) => {
    if (selectedSkillForLevel) {
      selectedSkillForLevel.setter(prev => 
        prev.map(tag => 
          tag.id === selectedSkillForLevel.tag.id 
            ? { ...tag, level }
            : tag
        )
      );
      setSkillsChanged(true);
      setShowLevelModal(false);
      setSelectedSkillForLevel(null);
    }
  };

  // Функция для отслеживания изменений полей
  const trackFieldChange = (fieldName, value) => {
    const originalValue = originalData[fieldName];
    if (originalValue !== value) {
      setChangedFields(prev => new Set([...prev, fieldName]));
    } else {
      setChangedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldName);
        return newSet;
      });
    }
  };

  // Функция для немедленного сохранения аватара
  const handleAvatarChange = async (newAvatar) => {
    setAvatar(newAvatar);
    trackFieldChange('avatar', newAvatar);
    
    // Если редактируем существующего сотрудника, сохраняем аватар сразу
    if (editingEmployee && editingEmployee.id) {
      setAvatarSaving(true);
      try {
        // Если есть новый аватар, сохраняем его сразу
        if (newAvatar && newAvatar !== editingEmployee.avatar) {
          try {
            const formData = new FormData();
            formData.append('avatar', newAvatar);
            
            await api.uploadEmployeeAvatar(editingEmployee.id, formData);
          } catch (error) {
            console.error('Error uploading avatar:', error);
            showNotification('Ошибка при загрузке аватара', 'error');
          }
        }
        
        // Сохраняем остальные данные сотрудника
        const employeeData = {
          first_name: editingEmployee.first_name,
          last_name: editingEmployee.last_name,
          email: editingEmployee.email,
          position: editingEmployee.position,
          department_id: editingEmployee.department_id,
          department_role: editingEmployee.department_role,
          phone: editingEmployee.phone,
          telegram: editingEmployee.telegram,
          birth_date: editingEmployee.birth_date,
          hire_date: editingEmployee.hire_date,
          wishlist_url: editingEmployee.wishlist_url,
          competencies: editingEmployee.competencies,
          status: editingEmployee.status
        };
        
        await api.updateEmployee(editingEmployee.id, employeeData);
        
        showNotification('Сотрудник успешно обновлен!', 'success');
        onClose();
        onUpdate();
      } catch (error) {
        console.error('Error updating employee:', error);
        showNotification('Ошибка при обновлении сотрудника', 'error');
      } finally {
        setSaving(false);
      }
    } else {
      // Создание нового сотрудника
      try {
        setSaving(true);
        
        // Если есть аватар для нового сотрудника, сохраняем его
        if (newAvatar) {
          const formData = new FormData();
          formData.append('avatar', newAvatar);
          
          // Сначала создаем сотрудника без аватара
          const employeeData = {
            first_name: editingEmployee.first_name,
            last_name: editingEmployee.last_name,
            email: editingEmployee.email,
            position: editingEmployee.position,
            department_id: editingEmployee.department_id,
            department_role: editingEmployee.department_role,
            phone: editingEmployee.phone,
            telegram: editingEmployee.telegram,
            birth_date: editingEmployee.birth_date,
            hire_date: editingEmployee.hire_date,
            wishlist_url: editingEmployee.wishlist_url,
            competencies: editingEmployee.competencies,
            status: editingEmployee.status
          };
          
          const response = await api.createEmployee(employeeData);
          const newEmployeeId = response.employee.id;
          
          // Затем загружаем аватар
          try {
            await api.uploadEmployeeAvatar(newEmployeeId, formData);
          } catch (avatarError) {
            console.error('Error uploading avatar for new employee:', avatarError);
            showNotification('Сотрудник создан, но не удалось загрузить аватар', 'warning');
          }
        } else {
          // Создаем сотрудника без аватара
          const employeeData = {
            first_name: editingEmployee.first_name,
            last_name: editingEmployee.last_name,
            email: editingEmployee.email,
            position: editingEmployee.position,
            department_id: editingEmployee.department_id,
            department_role: editingEmployee.department_role,
            phone: editingEmployee.phone,
            telegram: editingEmployee.telegram,
            birth_date: editingEmployee.birth_date,
            hire_date: editingEmployee.hire_date,
            wishlist_url: editingEmployee.wishlist_url,
            competencies: editingEmployee.competencies,
            status: editingEmployee.status
          };
          
          await api.createEmployee(employeeData);
        }
        
        showNotification('Сотрудник успешно создан!', 'success');
        onClose();
        onUpdate();
      } catch (error) {
        console.error('Error creating employee:', error);
        showNotification('Ошибка при создании сотрудника', 'error');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !department) {
      showNotification('Пожалуйста, заполните все обязательные поля', 'warning');
      return;
    }

    // Check for duplicate email
    const isDuplicate = existingEmployees.some(emp => 
      emp.id !== editingEmployee?.id && 
      emp.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (isDuplicate) {
      showNotification('Сотрудник с таким email уже существует', 'warning');
      return;
    }

    // Подготавливаем данные для отправки
    const employeeData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      telegram: telegram.trim(),
      hireDate,
      birthDate,
      department: department.value,
      role: role?.value || '',
      competencies: competencies.trim(),
      notes: notes.trim(),
      avatar
    };

    // Если редактируем существующего сотрудника, добавляем навыки и информацию об изменениях
    if (editingEmployee) {
      employeeData.skills = {
        hardSkills,
        softSkills,
        hobbies
      };
      employeeData.skillsChanged = skillsChanged;
      employeeData.changedFields = changedFields;
    }

    onSubmit(employeeData);

    // Reset form
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setTelegram('');
    setHireDate('');
    setBirthDate('');
    setDepartment(null);
    setRole(null);
    setCompetencies('');
    setHardSkills([]);
    setSoftSkills([]);
    setHobbies([]);
    setNotes('');
    setAvatar('');
    setAvatarSaving(false);
    setChangedFields(new Set());
  };

  const handleCancel = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setTelegram('');
    setHireDate('');
    setBirthDate('');
    setDepartment(null);
    setRole(null);
    setCompetencies('');
    setHardSkills([]);
    setSoftSkills([]);
    setHobbies([]);
    setNotes('');
    setAvatar('');
    setAvatarSaving(false);
    setChangedFields(new Set());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]">
      <div className="bg-white rounded-[15px] w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <h3 className="text-lg font-semibold text-dark">
            {editingEmployee ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Содержимое */}
        <div className="flex-1 overflow-y-auto p-6">
            <form id="employee-form" className="space-y-4" onSubmit={handleSubmit}>
              {/* Avatar section */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <Avatar
                    src={avatar}
                    name={`${firstName || ''} ${lastName || ''}`.trim() || 'Новый сотрудник'}
                    size="lg"
                    clickable={true}
                    onAvatarChange={handleAvatarChange}
                  />
                  {avatarSaving && (
                    <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-dark">Фото профиля</h4>
                  <p className="text-sm text-gray-600">
                    {avatarSaving ? 'Сохранение...' : 'Нажмите для загрузки фото'}
                  </p>
                </div>
              </div>

              {/* Name fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      trackFieldChange('firstName', e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Введите имя"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия *</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      trackFieldChange('lastName', e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Введите фамилию"
                    required
                  />
                </div>
              </div>

              {/* Contact fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      trackFieldChange('email', e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      trackFieldChange('phone', e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telegram</label>
                  <input
                    type="text"
                    value={telegram}
                    onChange={(e) => {
                      setTelegram(e.target.value);
                      trackFieldChange('telegram', e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Дата приема</label>
                  <input
                    type="date"
                    value={hireDate}
                    onChange={(e) => {
                      setHireDate(e.target.value);
                      trackFieldChange('hireDate', e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Дата рождения</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => {
                      setBirthDate(e.target.value);
                      trackFieldChange('birthDate', e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Отдел *</label>
                  {departmentsLoading ? (
                    <div className="w-full px-3 py-2 border border-gray/20 rounded-[8px] bg-gray-50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="ml-2 text-sm text-gray-500">Загрузка отделов...</span>
                    </div>
                  ) : departmentsError ? (
                    <div className="w-full px-3 py-2 border border-red-300 rounded-[8px] bg-red-50 flex items-center justify-center">
                      <span className="text-sm text-red-600">Ошибка загрузки отделов: {departmentsError}</span>
                    </div>
                  ) : (
                    <Select
                      placeholder="Выберите отдел"
                      options={departments}
                      styles={customSelectStyles}
                      value={department}
                      onChange={(option) => {
                        setDepartment(option);
                        trackFieldChange('department', option?.value);
                      }}
                      isLoading={departmentsLoading}
                      noOptionsMessage={() => "Нет доступных отделов"}
                      menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                      menuPosition="fixed"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Роль в отделе</label>
                <Select
                  placeholder="Выберите роль"
                  options={roles}
                  styles={customSelectStyles}
                  value={role}
                  onChange={(option) => {
                    setRole(option);
                    trackFieldChange('role', option?.value);
                  }}
                  menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                  menuPosition="fixed"
                />
              </div>

              {/* Competencies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Компетенции</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Введите компетенции (каждая с новой строки)"
                  rows={3}
                  value={competencies}
                  onChange={(e) => {
                    setCompetencies(e.target.value);
                    trackFieldChange('competencies', e.target.value);
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Компетенции будут отображаться как маркированный список</p>
              </div>

              {/* Skills sections */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Хард скиллы</label>
                <div className="relative">
                  <div className="min-h-[40px] border border-gray/20 rounded-[8px] focus-within:ring-2 focus-within:ring-primary focus-within:border-primary p-2">
                    <div className="flex flex-wrap gap-2 items-center">
                      {hardSkills.map((skill) => (
                        <span
                          key={skill.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm cursor-pointer hover:bg-blue-200 transition-colors"
                          onClick={() => {
                            setSelectedSkillForLevel({ tag: skill, setter: setHardSkills, type: 'hard' });
                            setShowLevelModal(true);
                          }}
                        >
                          {skill.label}
                          {skill.level && skill.level !== 'none' && (
                            <div className="flex gap-0.5">
                              {[1, 2, 3].map((star) => (
                                <svg
                                  key={star}
                                  className="w-3 h-3"
                                  viewBox="0 0 14 14"
                                  style={{ display: 'inline' }}
                                >
                                  <polygon
                                    points="7,1 8.2,5.2 13,7 8.2,8.8 7,13 5.8,8.8 1,7 5.8,5.2"
                                    fill={skill.level >= star ? 'currentColor' : '#fff'}
                                  />
                                </svg>
                              ))}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTag(skill.id, setHardSkills);
                            }}
                            className="ml-1 hover:text-blue-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder="Введите хард скилл..."
                        className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
                        value={hardSkillsInput}
                        onChange={(e) => setHardSkillsInput(e.target.value)}
                        onFocus={() => handleInputFocus('hard')}
                        onBlur={() => handleInputBlur('hard')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            e.preventDefault();
                            handleCreateTag(e.target.value.trim(), 'hard', setHardSkills);
                            setHardSkillsInput('');
                          }
                        }}
                      />
                    </div>
                  </div>
                  {/* Dropdown suggestions */}
                  <div className={`absolute top-full left-0 right-0 mt-1 bg-white border border-gray/20 rounded-[8px] shadow-lg z-50 max-h-40 overflow-y-auto ${showHardSkillsDropdown ? 'block' : 'hidden'}`}>
                    {skillsData
                      .filter(s => s.skill_type === 'hard')
                      .filter(s => s.name.toLowerCase().includes(hardSkillsInput.toLowerCase()))
                      .map(skill => (
                        <div
                          key={skill.id}
                          className="px-3 py-2 hover:bg-gray/10 cursor-pointer text-sm"
                          onClick={() => {
                            handleTagSelect({ value: skill.id, label: skill.name }, 'hard', setHardSkills);
                            setShowHardSkillsDropdown(false);
                            setHardSkillsInput('');
                          }}
                        >
                          {skill.name}
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Софт скиллы</label>
                <div className="relative">
                  <div className="min-h-[40px] border border-gray/20 rounded-[8px] focus-within:ring-2 focus-within:ring-primary focus-within:border-primary p-2">
                    <div className="flex flex-wrap gap-2 items-center">
                      {softSkills.map((skill) => (
                        <span
                          key={skill.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm cursor-pointer hover:bg-green-200 transition-colors"
                          onClick={() => {
                            setSelectedSkillForLevel({ tag: skill, setter: setSoftSkills, type: 'soft' });
                            setShowLevelModal(true);
                          }}
                        >
                          {skill.label}
                          {skill.level && skill.level !== 'none' && (
                            <div className="flex gap-0.5">
                              {[1, 2, 3].map((star) => (
                                <svg
                                  key={star}
                                  className="w-3 h-3"
                                  viewBox="0 0 14 14"
                                  style={{ display: 'inline' }}
                                >
                                  <polygon
                                    points="7,1 8.2,5.2 13,7 8.2,8.8 7,13 5.8,8.8 1,7 5.8,5.2"
                                    fill={skill.level >= star ? 'currentColor' : '#fff'}
                                  />
                                </svg>
                              ))}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTag(skill.id, setSoftSkills);
                            }}
                            className="ml-1 hover:text-green-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder="Введите софт скилл..."
                        className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
                        value={softSkillsInput}
                        onChange={(e) => setSoftSkillsInput(e.target.value)}
                        onFocus={() => handleInputFocus('soft')}
                        onBlur={() => handleInputBlur('soft')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            e.preventDefault();
                            handleCreateTag(e.target.value.trim(), 'soft', setSoftSkills);
                            setSoftSkillsInput('');
                          }
                        }}
                      />
                    </div>
                  </div>
                  {/* Dropdown suggestions */}
                  <div className={`absolute top-full left-0 right-0 mt-1 bg-white border border-gray/20 rounded-[8px] shadow-lg z-50 max-h-40 overflow-y-auto ${showSoftSkillsDropdown ? 'block' : 'hidden'}`}>
                    {skillsData
                      .filter(s => s.skill_type === 'soft')
                      .filter(s => s.name.toLowerCase().includes(softSkillsInput.toLowerCase()))
                      .map(skill => (
                        <div
                          key={skill.id}
                          className="px-3 py-2 hover:bg-gray/10 cursor-pointer text-sm"
                          onClick={() => {
                            handleTagSelect({ value: skill.id, label: skill.name }, 'soft', setSoftSkills);
                            setShowSoftSkillsDropdown(false);
                            setSoftSkillsInput('');
                          }}
                        >
                          {skill.name}
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Хобби</label>
                <div className="relative">
                  <div className="min-h-[40px] border border-gray/20 rounded-[8px] focus-within:ring-2 focus-within:ring-primary focus-within:border-primary p-2">
                    <div className="flex flex-wrap gap-2 items-center">
                      {hobbies.map((hobby) => (
                        <span
                          key={hobby.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm cursor-pointer hover:bg-purple-200 transition-colors"
                          onClick={() => {
                            setSelectedSkillForLevel({ tag: hobby, setter: setHobbies, type: 'hobby' });
                            setShowLevelModal(true);
                          }}
                        >
                          {hobby.label}
                          {hobby.level && hobby.level !== 'none' && (
                            <div className="flex gap-0.5">
                              {[1, 2, 3].map((star) => (
                                <svg
                                  key={star}
                                  className="w-3 h-3"
                                  viewBox="0 0 14 14"
                                  style={{ display: 'inline' }}
                                >
                                  <polygon
                                    points="7,1 8.2,5.2 13,7 8.2,8.8 7,13 5.8,8.8 1,7 5.8,5.2"
                                    fill={hobby.level >= star ? 'currentColor' : '#fff'}
                                  />
                                </svg>
                              ))}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTag(hobby.id, setHobbies);
                            }}
                            className="ml-1 hover:text-purple-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder="Введите хобби..."
                        className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
                        value={hobbiesInput}
                        onChange={(e) => setHobbiesInput(e.target.value)}
                        onFocus={() => handleInputFocus('hobby')}
                        onBlur={() => handleInputBlur('hobby')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            e.preventDefault();
                            handleCreateTag(e.target.value.trim(), 'hobby', setHobbies);
                            setHobbiesInput('');
                          }
                        }}
                      />
                    </div>
                  </div>
                  {/* Dropdown suggestions */}
                  <div className={`absolute top-full left-0 right-0 mt-1 bg-white border border-gray/20 rounded-[8px] shadow-lg z-50 max-h-40 overflow-y-auto ${showHobbiesDropdown ? 'block' : 'hidden'}`}>
                    {skillsData
                      .filter(s => s.skill_type === 'hobby')
                      .filter(s => s.name.toLowerCase().includes(hobbiesInput.toLowerCase()))
                      .map(skill => (
                        <div
                          key={skill.id}
                          className="px-3 py-2 hover:bg-gray/10 cursor-pointer text-sm"
                          onClick={() => {
                            handleTagSelect({ value: skill.id, label: skill.name }, 'hobby', setHobbies);
                            setShowHobbiesDropdown(false);
                            setHobbiesInput('');
                          }}
                        >
                          {skill.name}
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Примечания</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Дополнительная информация"
                  rows={3}
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    trackFieldChange('notes', e.target.value);
                  }}
                />
              </div>
            </form>
        </div>

        {/* Фиксированные кнопки внизу */}
        <div className="p-6 border-t border-gray/20 bg-white">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              form="employee-form"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors"
            >
              {editingEmployee ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </div>
      </div>

      {/* Модальное окно выбора уровня владения */}
      <SkillLevelModal
        isOpen={showLevelModal}
        onClose={() => {
          setShowLevelModal(false);
          setSelectedSkillForLevel(null);
        }}
        onSelect={handleLevelSelect}
        skillName={selectedSkillForLevel?.tag?.label || ''}
        currentLevel={selectedSkillForLevel?.tag?.level}
      />
    </div>
  );
} 