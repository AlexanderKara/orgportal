import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, Search, Filter, Plus, Edit, Trash2, 
  UserPlus, Building, Mail, Phone, Calendar,
  Download, Upload, Archive, Check, X, MessageCircle, Image,
  Settings, Users as UsersIcon, Building as BuildingIcon, Mail as MailIcon, Eye,
  SortAsc, SortDesc
} from 'lucide-react';
import Select from 'react-select';
import EmployeeModal from '../../components/EmployeeModal';
import AvatarCropModal from '../../components/AvatarCropModal';
import Avatar from '../../components/ui/Avatar';
import api from '../../services/api';
import { showNotification } from '../../utils/notifications';

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
    zIndex: 9999,
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

// Mock skills data for the form
const mockSkillsData = [
  { id: 1, name: 'JavaScript', type: 'hard' },
  { id: 2, name: 'React', type: 'hard' },
  { id: 3, name: 'TypeScript', type: 'hard' },
  { id: 4, name: 'Python', type: 'hard' },
  { id: 5, name: 'Коммуникация', type: 'soft' },
  { id: 6, name: 'Лидерство', type: 'soft' },
  { id: 7, name: 'Командная работа', type: 'soft' },
  { id: 8, name: 'Путешествия', type: 'hobby' },
  { id: 9, name: 'Спорт', type: 'hobby' },
  { id: 10, name: 'Музыка', type: 'hobby' },
];

export default function Employees() {
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [editingCell, setEditingCell] = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [showMultiEditModal, setShowMultiEditModal] = useState(false);
  const [multiEditData, setMultiEditData] = useState({
    department: null,
    role: null,
    telegram: '',
    phone: ''
  });
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Import states
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importErrors, setImportErrors] = useState([]);
  const [importSuccess, setImportSuccess] = useState([]);
  const [notification, setNotification] = useState(null);

  // Inline create employee states
  const [showInlineCreate, setShowInlineCreate] = useState(false);
  const [newEmployeeData, setNewEmployeeData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    department: '',
    telegram: '',
    phone: '',
    competencies: ''
  });
  const [creatingEmployee, setCreatingEmployee] = useState(false);

  // Avatar upload states
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingEmployeeId, setUploadingEmployeeId] = useState(null);

  // Автоматическое скрытие уведомлений
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  
  // Import modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importDetails, setImportDetails] = useState([]);
  const [currentImportStep, setCurrentImportStep] = useState('');
  const [totalRows, setTotalRows] = useState(0);
  const [processedRows, setProcessedRows] = useState(0);
  const [abortImport, setAbortImport] = useState(false);

  // Загружаем данные
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [employeesResponse, departmentsResponse] = await Promise.all([
          api.getEmployees(),
          api.getDepartments()
        ]);
        
        // Извлекаем данные из ответа API
        const employeesData = employeesResponse.data || employeesResponse;
        const departmentsRaw = departmentsResponse.data?.departments || departmentsResponse.departments || departmentsResponse;
        const formattedDepartments = [
          { value: 'all', label: 'Все отделы' },
          ...(Array.isArray(departmentsRaw) ? departmentsRaw : []).map(dept => ({
            value: dept.id,
            label: dept.name
          }))
        ];
        
        setEmployees(employeesData);
        setDepartments(formattedDepartments);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);
  


  // Фильтрация и сортировка сотрудников
  const filteredEmployees = useMemo(() => {
    if (loading) return [];
    
    let filtered = [...employees];

    if (search.trim()) {
      filtered = filtered.filter(emp => 
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(search.trim().toLowerCase()) ||
        emp.email.toLowerCase().includes(search.trim().toLowerCase()) ||
        (emp.competencies && emp.competencies.toLowerCase().includes(search.trim().toLowerCase()))
      );
    }

    if (selectedDepartment && selectedDepartment.value !== 'all') {
      filtered = filtered.filter(emp => emp.department_id === selectedDepartment.value);
    }

    if (selectedRole && selectedRole.value !== '') {
      filtered = filtered.filter(emp => emp.role === selectedRole.value);
    }

    // Сортировка
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = `${a.first_name} ${a.last_name}`;
          bValue = `${b.first_name} ${b.last_name}`;
          break;
        case 'department':
          aValue = a.department?.name || '';
          bValue = b.department?.name || '';
          break;
        case 'role':
          aValue = a.role;
          bValue = b.role;
          break;
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'competencies':
          aValue = a.competencies || '';
          bValue = b.competencies || '';
          break;
        default:
          aValue = `${a.first_name} ${a.last_name}`;
          bValue = `${b.first_name} ${b.last_name}`;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [employees, search, selectedDepartment, selectedRole, sortBy, sortDirection, loading]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка сотрудников...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">⚠️</div>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Попробовать снова
          </button>
          <br />
          <a
            href="/errors/access-denied"
            className="mt-4 inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            style={{ marginTop: '12px' }}
          >
            Перейти к странице ограниченного доступа
          </a>
        </div>
      </div>
    );
  }

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setShowAddModal(true);
  };

  const handleDelete = async (employeeId) => {
    if (window.confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
      try {
        await api.deleteEmployee(employeeId);
        await loadData(); // Перезагружаем данные после удаления
      } catch (error) {
        console.error('Ошибка удаления сотрудника:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка';
        showNotification('Ошибка при удалении сотрудника: ' + errorMessage, 'error');
      }
    }
  };

  const handleArchive = (employeeId) => {
    if (window.confirm('Вы уверены, что хотите архивировать этого сотрудника?')) {
      // console.log('Архивирование сотрудника:', employeeId);
    }
  };

  const handleSelectAll = () => {
    if (selectedEmployees.size === filteredEmployees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(filteredEmployees.map(emp => emp.id)));
    }
  };

  const handleSelectEmployee = (employeeId) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
    } else {
      newSelected.add(employeeId);
    }
    setSelectedEmployees(newSelected);
  };

  const handleInlineEdit = async (employeeId, field, value) => {
    try {
      // Находим сотрудника в списке
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) {
        console.error('Сотрудник не найден:', employeeId);
        return;
      }

      // Подготавливаем данные для обновления
      const updateData = {};
      
      switch (field) {
        case 'role':
          updateData.department_role = value;
          break;
        case 'department':
          updateData.department_id = value;
          break;
        case 'email':
          updateData.email = value;
          break;
        case 'telegram':
          updateData.telegram = value;
          break;
        case 'phone':
          updateData.phone = value;
          break;
        case 'competencies':
          updateData.competencies = value;
          break;
        default:
          console.error('Неизвестное поле для редактирования:', field);
          return;
      }

      // Обновляем сотрудника через API
      await api.updateEmployee(employeeId, updateData);
      
      // Обновляем локальное состояние
      setEmployees(prevEmployees => 
        prevEmployees.map(emp => 
          emp.id === employeeId 
            ? { ...emp, ...updateData }
            : emp
        )
      );

      // Показываем уведомление об успехе
      setNotification({
        type: 'success',
        message: 'Сотрудник успешно обновлен'
      });

    } catch (error) {
      console.error('Ошибка обновления сотрудника:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка';
      
      // Показываем уведомление об ошибке
      setNotification({
        type: 'error',
        message: `Ошибка обновления: ${errorMessage}`
      });
    } finally {
      setEditingCell(null);
    }
  };

  const handleMultiEdit = () => {
    if (selectedEmployees.size === 0) {
      showNotification('Выберите сотрудников для редактирования', 'info');
      return;
    }
    setShowMultiEditModal(true);
  };

  const handleMultiEditSave = () => {
    const selectedEmployeeIds = Array.from(selectedEmployees);
    // console.log('Мульти-редактирование сотрудников:', selectedEmployeeIds, multiEditData);
    
    // Здесь будет логика сохранения изменений
    // Например, обновление данных в базе данных
    
    setShowMultiEditModal(false);
    setMultiEditData({
      department: null,
      role: null,
      telegram: '',
      phone: ''
    });
    setSelectedEmployees(new Set());
  };

  const handleMultiEditCancel = () => {
    setShowMultiEditModal(false);
    setMultiEditData({
      department: null,
      role: null,
      telegram: '',
      phone: ''
    });
  };

  const handleMultiDelete = async () => {
    if (selectedEmployees.size === 0) {
      showNotification('Выберите сотрудников для удаления', 'info');
      return;
    }
    
    if (window.confirm(`Вы уверены, что хотите удалить ${selectedEmployees.size} сотрудников?`)) {
      const selectedEmployeeIds = Array.from(selectedEmployees);
      try {
        // Удаляем каждого сотрудника по отдельности
        for (const employeeId of selectedEmployeeIds) {
          await api.deleteEmployee(employeeId);
        }
        await loadData(); // Перезагружаем данные после удаления
        setSelectedEmployees(new Set());
      } catch (error) {
        console.error('Ошибка удаления сотрудников:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка';
        showNotification('Ошибка при удалении сотрудников: ' + errorMessage, 'error');
      }
    }
  };

  const handleMultiArchive = () => {
    if (selectedEmployees.size === 0) {
      showNotification('Выберите сотрудников для архивирования', 'info');
      return;
    }
    
    if (window.confirm(`Вы уверены, что хотите архивировать ${selectedEmployees.size} сотрудников?`)) {
      const selectedEmployeeIds = Array.from(selectedEmployees);
      // console.log('Архивирование сотрудников:', selectedEmployeeIds);
      setSelectedEmployees(new Set());
    }
  };

  // Inline create employee functions
  const handleInlineCreate = () => {
    setShowInlineCreate(true);
    setNewEmployeeData({
      firstName: '',
      lastName: '',
      email: '',
      role: '',
      department: '',
      telegram: '',
      phone: '',
      competencies: ''
    });
  };

  const handleInlineCreateCancel = () => {
    setShowInlineCreate(false);
    setNewEmployeeData({
      firstName: '',
      lastName: '',
      email: '',
      role: '',
      department: '',
      telegram: '',
      phone: '',
      competencies: ''
    });
  };

  const handleInlineCreateConfirm = async () => {
    // Валидация обязательных полей
    if (!newEmployeeData.firstName?.trim() || !newEmployeeData.lastName?.trim() || !newEmployeeData.email?.trim()) {
      showNotification('Пожалуйста, заполните обязательные поля: Имя, Фамилия, Email', 'info');
      return;
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmployeeData.email)) {
      showNotification('Пожалуйста, введите корректный email', 'info');
      return;
    }

    setCreatingEmployee(true);
    try {
      const createData = {
        first_name: newEmployeeData.firstName.trim(),
        last_name: newEmployeeData.lastName.trim(),
        email: newEmployeeData.email.trim(),
        phone: newEmployeeData.phone?.trim() || null,
        telegram: newEmployeeData.telegram?.trim() || null,
        hire_date: new Date().toISOString().split('T')[0],
        department_id: newEmployeeData.department ? parseInt(newEmployeeData.department) : null,
        department_role: newEmployeeData.role || null,
        competencies: newEmployeeData.competencies?.trim() || null
      };

      await api.createEmployee(createData);
      
      // Перезагружаем данные
      const loadData = async () => {
        try {
          setLoading(true);
          const [employeesResponse, departmentsResponse] = await Promise.all([
            api.getEmployees(),
            api.getDepartments()
          ]);
          
          const employeesData = employeesResponse.data || employeesResponse;
          const departmentsRaw = departmentsResponse.data?.departments || departmentsResponse.departments || departmentsResponse;
          const formattedDepartments = [
            { value: 'all', label: 'Все отделы' },
            ...(Array.isArray(departmentsRaw) ? departmentsRaw : []).map(dept => ({
              value: dept.id,
              label: dept.name
            }))
          ];
          
          setEmployees(employeesData);
          setDepartments(formattedDepartments);
        } catch (error) {
          console.error('Error loading data:', error);
          setError('Ошибка загрузки данных');
        } finally {
          setLoading(false);
        }
      };
      
      await loadData();
      
      // Скрываем инлайн создание
      setShowInlineCreate(false);
      setNewEmployeeData({
        firstName: '',
        lastName: '',
        email: '',
        role: '',
        department: '',
        telegram: '',
        phone: '',
        competencies: ''
      });
      
      setNotification({
        type: 'success',
        message: 'Сотрудник успешно создан'
      });
      
    } catch (error) {
      console.error('Error creating employee:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка';
      setNotification({
        type: 'error',
        message: `Ошибка создания сотрудника: ${errorMessage}`
      });
    } finally {
      setCreatingEmployee(false);
    }
  };

  const handleExport = () => {
    const data = filteredEmployees.map(emp => ({
      'Имя': emp.first_name || '',
      'Фамилия': emp.last_name || '',
      'Email': emp.email || '',
      'Должность': emp.position || '',
      'Отдел': emp.department?.name || 'Не указан',
      'Роль в отделе': getRoleText(emp.department_role) || '',
      'Telegram': emp.telegram || 'Не указан',
      'Телефон': emp.phone || 'Не указан',
      'Компетенции': emp.competencies || 'Не указаны',
      'Дата приема': emp.hire_date || 'Не указана',
      'Дата рождения': emp.birth_date || 'Не указана',
      'Статус': emp.status || 'active',
      'ID сотрудника': emp.id || '',
      'ID отдела': emp.department_id || ''
    }));
    
    // Экспорт с разделителем точка с запятой и экранированием
    const csv = [
      Object.keys(data[0]).join(';'),
      ...data.map(row => Object.values(row).map(value => {
        const stringValue = String(value);
        // Экранируем кавычки и заключаем в кавычки если есть точка с запятой, кавычки или перенос строки
        if (stringValue.includes(';') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(';'))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            setImporting(true);
            setImportProgress(0);
            setImportErrors([]);
            setImportSuccess([]);
            
            const csv = e.target.result;
            const lines = csv.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) {
              showNotification('Файл должен содержать заголовки и хотя бы одну строку данных', 'info');
              return;
            }
            
            // Определяем разделитель (приоритет точке с запятой)
            const firstLine = lines[0];
            const semicolonCount = (firstLine.match(/;/g) || []).length;
            const commaCount = (firstLine.match(/,/g) || []).length;
            const delimiter = semicolonCount > 0 ? ';' : ',';
            
            const headers = parseCSVLine(lines[0], delimiter).map(h => h.trim().replace(/"/g, ''));
            const requiredHeaders = ['Имя', 'Фамилия', 'Email'];
            const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
            
            if (missingHeaders.length > 0) {
              showNotification(`Отсутствуют обязательные заголовки: ${missingHeaders.join(', ')}`, 'error');
              return;
            }
            
            const importedEmployees = lines.slice(1).map((line, index) => {
              const values = parseCSVLine(line, delimiter);
              const employee = {};
              
              headers.forEach((header, headerIndex) => {
                const value = values[headerIndex] || '';
                switch (header) {
                  case 'Имя':
                    employee.first_name = value;
                    break;
                  case 'Фамилия':
                    employee.last_name = value;
                    break;
                  case 'Email':
                    employee.email = value;
                    break;
                  case 'Должность':
                    employee.position = value;
                    break;
                  case 'Отдел':
                    employee.department_name = value;
                    break;
                  case 'Роль в отделе':
                    switch (value) {
                      case 'Лид':
                        employee.department_role = 'lead';
                        break;
                      case 'Зам':
                        employee.department_role = 'deputy';
                        break;
                      case 'Продакт':
                        employee.department_role = 'product';
                        break;
                      default:
                        employee.department_role = value;
                    }
                    break;
                  case 'Telegram':
                    employee.telegram = value === 'Не указан' ? '' : value;
                    break;
                  case 'Телефон':
                    employee.phone = normalizePhone(value);
                    break;
                  case 'Компетенции':
                    employee.competencies = value === 'Не указаны' ? '' : value;
                    break;
                  case 'Дата приема':
                    employee.hire_date = normalizeDate(value);
                    break;
                  case 'Дата рождения':
                    employee.birth_date = normalizeDate(value);
                    break;
                  case 'Статус':
                    employee.status = value || 'active';
                    break;
                  case 'ID сотрудника':
                    employee.id = value;
                    break;
                  case 'ID отдела':
                    employee.department_id = value;
                    break;
                }
              });
              
              employee._rowNumber = index + 2;
              return employee;
            });
            
            // Валидация и обработка данных
            const validEmployees = [];
            const errors = [];
            const updates = [];
            const creates = [];
            
            for (let i = 0; i < importedEmployees.length; i++) {
              const employee = importedEmployees[i];
              setImportProgress((i / importedEmployees.length) * 100);
              
              const rowErrors = [];
              
              // Проверяем обязательные поля
              if (!employee.first_name || !employee.first_name.trim()) {
                rowErrors.push('Имя обязательно');
              }
              if (!employee.last_name || !employee.last_name.trim()) {
                rowErrors.push('Фамилия обязательна');
              }
              if (!employee.email || !employee.email.trim()) {
                rowErrors.push('Email обязателен');
              } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
                rowErrors.push('Неверный формат email');
              }
              
              if (rowErrors.length > 0) {
                errors.push({
                  row: employee._rowNumber,
                  errors: rowErrors
                });
                continue;
              }
              
              // Ищем существующего сотрудника по имени и фамилии
              const existingEmployee = employees.find(emp => 
                emp.first_name.toLowerCase() === employee.first_name.toLowerCase() &&
                emp.last_name.toLowerCase() === employee.last_name.toLowerCase()
              );
              
              if (existingEmployee) {
                // Обновляем существующего сотрудника
                updates.push({
                  id: existingEmployee.id,
                  data: employee
                });
              } else {
                // Создаем нового сотрудника
                creates.push(employee);
              }
              
              validEmployees.push(employee);
            }
            
            // Выполняем операции с базой данных
            let successCount = 0;
            let errorCount = 0;
            
            // Обновляем существующих сотрудников
            for (const update of updates) {
              try {
                await api.updateEmployee(update.id, update.data);
                successCount++;
                setImportSuccess(prev => [...prev, `Обновлен: ${update.data.first_name} ${update.data.last_name}`]);
              } catch (error) {
                errorCount++;
                setImportErrors(prev => [...prev, `Ошибка обновления ${update.data.first_name} ${update.data.last_name}: ${error.message}`]);
              }
            }
            
            // Создаем новых сотрудников
            for (const create of creates) {
              try {
                await api.createEmployee(create);
                successCount++;
                setImportSuccess(prev => [...prev, `Создан: ${create.first_name} ${create.last_name}`]);
              } catch (error) {
                errorCount++;
                setImportErrors(prev => [...prev, `Ошибка создания ${create.first_name} ${create.last_name}: ${error.message}`]);
              }
            }
            
            setImportProgress(100);
            
            // Показываем результаты
            if (successCount > 0) {
              showNotification(`Импорт завершен. Успешно: ${successCount}, Ошибок: ${errorCount}`, 'success');
              await loadData(); // Перезагружаем данные
            }
            
            if (errorCount > 0) {
              showNotification(`Импорт завершен с ошибками. Успешно: ${successCount}, Ошибок: ${errorCount}`, 'warning');
            }
            
          } catch (error) {
            console.error('Ошибка при импорте:', error);
            showNotification('Ошибка при обработке файла. Проверьте формат CSV.', 'error');
          } finally {
            setImporting(false);
          }
        };
        reader.readAsText(file, 'UTF-8');
      }
    };
    input.click();
  };

  // Функция для парсинга CSV строки с учетом кавычек
  const parseCSVLine = (line, delimiter) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  // Функция для нормализации номера телефона
  const normalizePhone = (phone) => {
    if (!phone || phone === 'Не указан' || phone === '') {
      return '';
    }
    
    // Убираем все символы кроме цифр
    let digits = phone.replace(/\D/g, '');
    
    // Если номер начинается с 8, заменяем на 7
    if (digits.startsWith('8') && digits.length >= 11) {
      digits = '7' + digits.substring(1);
    }
    
    // Если номер начинается с 7, но нет кода страны, добавляем +7
    if (digits.startsWith('7') && digits.length === 11) {
      digits = '7' + digits;
    }
    
    // Если номер начинается с 9 (код России), добавляем +7
    if (digits.startsWith('9') && digits.length === 10) {
      digits = '7' + digits;
    }
    
    // Берем только первые 11 цифр после кода страны
    if (digits.length > 11) {
      digits = digits.substring(0, 11);
    }
    
    // Форматируем номер в международном формате
    if (digits.length === 11 && digits.startsWith('7')) {
      return `+${digits}`;
    }
    
    // Если номер не соответствует формату, возвращаем как есть
    return phone;
  };

  // Функция для нормализации даты
  const normalizeDate = (date) => {
    if (!date || date === 'Не указана' || date === '') {
      return '';
    }
    
    // Убираем лишние пробелы
    date = date.trim();
    
    // Если дата уже в формате YYYY-MM-DD, возвращаем как есть
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    
    // Пытаемся распарсить различные форматы даты
    const dateFormats = [
      // DD.MM.YYYY
      /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
      // DD/MM/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      // DD-MM-YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
      // MM.DD.YYYY
      /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
      // YYYY.MM.DD
      /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/
    ];
    
    for (const format of dateFormats) {
      const match = date.match(format);
      if (match) {
        let day, month, year;
        
        if (format.source.includes('YYYY')) {
          // Формат с годом в конце
          day = parseInt(match[1]);
          month = parseInt(match[2]);
          year = parseInt(match[3]);
        } else {
          // Формат с годом в начале
          year = parseInt(match[1]);
          month = parseInt(match[2]);
          day = parseInt(match[3]);
        }
        
        // Проверяем валидность даты
        if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
      }
    }
    
    // Если не удалось распарсить, возвращаем null
    return null;
  };

  // Функция для парсинга CSV данных (для совместимости)
  const parseCSV = (csvData) => {
    if (typeof csvData !== 'string') {
      console.error('parseCSV: csvData должен быть строкой, получен:', typeof csvData);
      return [];
    }
    
    const lines = csvData.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return [];
    }
    
    const headers = parseCSVLine(lines[0], ',');
    const employees = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i], ',');
      
      const employee = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        switch (header) {
          case 'Имя':
            employee.first_name = value;
            break;
          case 'Фамилия':
            employee.last_name = value;
            break;
          case 'Email':
            employee.email = value;
            break;
          case 'Должность':
            employee.position = value;
            break;
          case 'Отдел':
            employee.department_name = value;
            break;
          case 'Роль в отделе':
            switch (value) {
              case 'Лид':
                employee.department_role = 'lead';
                break;
              case 'Зам':
                employee.department_role = 'deputy';
                break;
              case 'Продакт':
                employee.department_role = 'product';
                break;
              default:
                employee.department_role = value;
            }
            break;
          case 'Telegram':
            employee.telegram = value === 'Не указан' ? '' : value;
            break;
          case 'Телефон':
            employee.phone = normalizePhone(value);
            break;
          case 'Дата приема':
            employee.hire_date = normalizeDate(value);
            break;
          case 'Дата рождения':
            employee.birth_date = normalizeDate(value);
            break;
          case 'Статус':
            employee.status = value || 'active';
            break;
          case 'ID сотрудника':
            employee.id = value;
            break;
          case 'ID отдела':
            employee.department_id = value;
            break;
        }
      });
      
      employees.push(employee);
    }
    
    return employees;
  };

  const handleImportEmployees = async (newEmployees, existingEmployees = []) => {
    setImporting(true);
    setImportProgress(0);
    setImportErrors([]);
    setImportSuccess([]);
    setImportDetails([]);
    setAbortImport(false);
    setCurrentImportStep('Начинаем импорт сотрудников...');
    setShowImportModal(true);

    try {
      // Объединяем всех сотрудников для обработки
      const allEmployees = [...newEmployees, ...existingEmployees];
      const employees = allEmployees;

      setTotalRows(employees.length);
      setProcessedRows(0);
      setCurrentImportStep(`Начинаем импорт ${employees.length} сотрудников...`);

      let successCount = 0;
      let errorCount = 0;
      const errors = [];
      const successes = [];
      const details = [];

      for (let i = 0; i < employees.length; i++) {
        // Проверяем, не был ли запрошен прерывание импорта
        if (abortImport) {
          setCurrentImportStep('Импорт прерван пользователем');
          break;
        }
        
        const employee = employees[i];
        
        setProcessedRows(i + 1);
        setImportProgress(Math.round(((i + 1) / employees.length) * 100));
        setCurrentImportStep(`Обработка ${i + 1} из ${employees.length}: ${employee.first_name} ${employee.last_name}`);

        const detail = {
          row: i + 1,
          name: `${employee.first_name} ${employee.last_name}`,
          email: employee.email,
          status: 'processing',
          message: 'Обработка...'
        };
        
        setImportDetails(prev => [...prev, detail]);

        try {
          // Подготавливаем данные для отправки
          const employeeData = {
            first_name: employee.first_name?.trim() || '',
            last_name: employee.last_name?.trim() || '',
            full_name: employee.full_name?.trim() || `${employee.first_name?.trim() || ''} ${employee.last_name?.trim() || ''}`.trim(),
            email: employee.email?.trim() || '',
            phone: employee.phone?.trim() || null,
            telegram: employee.telegram?.trim() || null,
            position: employee.position?.trim() || 'Сотрудник',
            department_id: parseInt(employee.department_id) || null, // Убираем дефолтное значение
            hire_date: employee.hire_date || new Date().toISOString().split('T')[0],
            birth_date: employee.birth_date && employee.birth_date !== 'Invalid date' && employee.birth_date !== '' ? employee.birth_date : null,
            wishlist_url: employee.wishlist_url?.trim() || null,
            status: employee.status || 'active',
            password: employee.password || 'defaultPassword123' // Временный пароль
          };

          // Валидация обязательных полей
          if (!employeeData.first_name || !employeeData.last_name || !employeeData.email) {
            throw new Error('Отсутствуют обязательные поля: имя, фамилия или email');
          }

          // Валидация email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(employeeData.email)) {
            throw new Error(`Некорректный email: ${employeeData.email}`);
          }

          // Валидация телефона (если указан)
          if (employeeData.phone && !/^\+[\d]{10,}$/.test(employeeData.phone)) {
            throw new Error(`Некорректный формат телефона: ${employeeData.phone}`);
          }

          // Валидация Telegram (если указан)
          if (employeeData.telegram && !/^@[a-zA-Z0-9_]{5,}$/.test(employeeData.telegram)) {
            throw new Error(`Некорректный формат Telegram: ${employeeData.telegram}`);
          }

          // Удаляем пустые строки из полей
          Object.keys(employeeData).forEach(key => {
            if (employeeData[key] === '') {
              employeeData[key] = null;
            }
          });

          const result = await api.createEmployee(employeeData);
          
          successes.push({
            name: employeeData.full_name,
            email: employeeData.email
          });
          successCount++;

          // Обновляем детали
          setImportDetails(prev => prev.map((item, idx) => 
            idx === i ? { ...item, status: 'success', message: 'Успешно создан' } : item
          ));

        } catch (error) {
          let errorMessage = error.message || 'Неизвестная ошибка';
          
          // Обрабатываем детальные ошибки валидации
          if (error.response && error.response.data) {
            if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
              errorMessage = error.response.data.errors.map(err => `${err.field}: ${err.message}`).join(', ');
            } else if (error.response.data.message) {
              errorMessage = error.response.data.message;
            }
          }
          
          errors.push({
            name: `${employee.first_name} ${employee.last_name}`,
            email: employee.email,
            error: errorMessage
          });
          errorCount++;

          // Обновляем детали
          setImportDetails(prev => prev.map((item, idx) => 
            idx === i ? { ...item, status: 'error', message: errorMessage } : item
          ));
        }

        // Проверяем прерывание после обработки каждого сотрудника
        if (abortImport) {
          setCurrentImportStep('Импорт прерван пользователем');
          break;
        }

        // Добавляем задержку между запросами для избежания rate limiting
        if (i < employees.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 секунды задержки
        }
      }

      setImportErrors(errors);
      setImportSuccess(successes);
      
      if (abortImport) {
        setCurrentImportStep(`Импорт прерван. Обработано: ${successCount + errorCount} из ${employees.length}`);
        setNotification({
          type: 'warning',
          message: `Импорт прерван. Обработано ${successCount + errorCount} из ${employees.length} сотрудников`
        });
      } else {
        setCurrentImportStep(`Импорт завершен. Успешно: ${successCount}, Ошибок: ${errorCount}`);
        
        if (successCount > 0) {
          setNotification({
            type: 'success',
            message: `Успешно импортировано ${successCount} сотрудников${errorCount > 0 ? `, ${errorCount} ошибок` : ''}`
          });
          // Обновляем список сотрудников
          loadData();
        } else {
          setNotification({
            type: 'error',
            message: `Ошибка импорта: ${errorCount} ошибок`
          });
        }
      }

    } catch (error) {
      setCurrentImportStep(`Ошибка: ${error.message}`);
      setNotification({
        type: 'error',
        message: 'Ошибка при обработке файла'
      });
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Имя': 'Иван',
        'Фамилия': 'Иванов',
        'Email': 'ivan.ivanov@example.com',
        'Должность': 'Разработчик',
        'Отдел': 'Разработка',
        'Роль в отделе': 'Лид',
        'Telegram': '@ivan_ivanov',
        'Телефон': '+7 (999) 123-45-67',
        'Компетенции': 'JavaScript;React;TypeScript',
        'Дата приема': '2024-01-15',
        'Дата рождения': '1990-05-15',
        'Статус': 'active',
        'ID сотрудника': '1',
        'ID отдела': '1'
      },
      {
        'Имя': 'Петр',
        'Фамилия': 'Петров',
        'Email': 'petr.petrov@example.com',
        'Должность': 'Менеджер',
        'Отдел': 'Маркетинг',
        'Роль в отделе': 'Зам',
        'Telegram': '@petr_petrov',
        'Телефон': '8-999-765-43-21',
        'Компетенции': 'Маркетинг;Аналитика;Коммуникация',
        'Дата приема': '2024-02-01',
        'Дата рождения': '1990-10-15',
        'Статус': 'active',
        'ID сотрудника': '',
        'ID отдела': ''
      },
      {
        'Имя': 'Анна',
        'Фамилия': 'Сидорова',
        'Email': 'anna.sidorova@example.com',
        'Должность': 'Продакт-менеджер',
        'Отдел': 'Продажи',
        'Роль в отделе': 'Продакт',
        'Telegram': '@anna_sidorova',
        'Телефон': '9991234567',
        'Компетенции': 'Продакт-менеджмент;Анализ требований;Планирование',
        'Дата приема': '2024-03-10',
        'Дата рождения': '1988-12-10',
        'Статус': 'active',
        'ID сотрудника': '',
        'ID отдела': ''
      }
    ];
    
    // Экспорт шаблона с разделителем точка с запятой и экранированием
    const csv = [
      Object.keys(templateData[0]).join(';'),
      ...templateData.map(row => Object.values(row).map(value => {
        const stringValue = String(value);
        if (stringValue.includes(';') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(';'))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setShowCropModal(true);
    }
  };

  const handleTableAvatarUpload = async (employeeId, file) => {
    if (!file) return;
    
    setUploadingAvatar(true);
    setUploadingEmployeeId(employeeId);
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      await api.uploadEmployeeAvatar(employeeId, formData);
      
      // Обновляем локальное состояние
      setEmployees(prevEmployees => 
        prevEmployees.map(emp => 
          emp.id === employeeId 
            ? { ...emp, avatar: URL.createObjectURL(file) }
            : emp
        )
      );
      
      setNotification({
        type: 'success',
        message: 'Аватар успешно обновлен'
      });
      
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Неизвестная ошибка';
      setNotification({
        type: 'error',
        message: `Ошибка загрузки аватара: ${errorMessage}`
      });
    } finally {
      setUploadingAvatar(false);
      setUploadingEmployeeId(null);
    }
  };

  const getRoleText = (role) => {
    if (!role || role === '') return '';
    switch (role) {
      case 'lead': return 'Лид';
      case 'deputy': return 'Зам';
      case 'product': return 'Продакт';
      default: return role;
    }
  };

  const getRoleColor = (role) => {
    if (!role || role === '') return 'bg-transparent text-gray-500';
    switch (role) {
      case 'lead': return 'bg-red-100 text-red-800';
      case 'deputy': return 'bg-blue-100 text-blue-800';
      case 'product': return 'bg-green-100 text-green-800';
      default: return 'bg-transparent text-gray-500';
    }
  };

  return (
    <div className="w-full max-w-none mx-auto pt-[70px] px-6 lg:px-8 xl:px-12">
      {/* Заголовок */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-[24px] lg:text-[32px] font-bold font-accent text-primary pb-4 md:pb-0">Сотрудники</h1>
            <p className="text-gray-600 hidden lg:block">Управление сотрудниками организации</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleImport}
              className="flex items-center gap-2 px-2 lg:px-4 py-2 border border-gray/20 text-gray-700 rounded-[8px] font-medium text-sm transition hover:bg-gray/10"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden lg:inline">Импорт</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-2 lg:px-4 py-2 border border-gray/20 text-gray-700 rounded-[8px] font-medium text-sm transition hover:bg-gray/10"
            >
              <Download className="w-4 h-4" />
              <span className="hidden lg:inline">Экспорт</span>
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-2 lg:px-4 py-2 border border-gray/20 text-gray-700 rounded-[8px] font-medium text-sm transition hover:bg-gray/10"
            >
              <Download className="w-4 h-4" />
              <span className="hidden lg:inline">Шаблон</span>
            </button>
            <button
              onClick={() => {
                setShowAddModal(true);
                setEditingEmployee(null);
              }}
              className="flex items-center gap-2 px-2 lg:px-4 py-2 bg-primary text-white rounded-[8px] font-medium text-sm transition hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden lg:inline">Добавить</span>
            </button>
          </div>
        </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm text-gray-600">Всего сотрудников</span>
          </div>
          <div className="text-2xl font-bold text-dark">{filteredEmployees.length}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">Отделов</span>
          </div>
          <div className="text-2xl font-bold text-dark">{new Set(filteredEmployees.map(emp => emp.department)).size}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">Новых в этом месяце</span>
          </div>
          <div className="text-2xl font-bold text-dark">12</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-600">Выбрано</span>
          </div>
          <div className="text-2xl font-bold text-dark">{selectedEmployees.size}</div>
        </div>
      </div>

      {/* Панель мульти-редактирования */}
      {selectedEmployees.size > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-[12px] p-4 mb-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-primary" />
              <span className="font-medium text-dark">
                Выбрано {selectedEmployees.size} сотрудников
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleMultiEdit}
                className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-[8px] font-medium text-sm transition hover:bg-primary/90"
              >
                <Settings className="w-4 h-4" />
                <span>Редактировать</span>
              </button>
              <button
                onClick={handleMultiArchive}
                className="flex items-center gap-2 px-3 py-2 border border-orange-500 text-orange-600 rounded-[8px] font-medium text-sm transition hover:bg-orange-50"
              >
                <Archive className="w-4 h-4" />
                <span>Архивировать</span>
              </button>
              <button
                onClick={handleMultiDelete}
                className="flex items-center gap-2 px-3 py-2 border border-red-500 text-red-600 rounded-[8px] font-medium text-sm transition hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Удалить</span>
              </button>
              <button
                onClick={() => setSelectedEmployees(new Set())}
                className="flex items-center gap-2 px-3 py-2 border border-gray/300 text-gray-600 rounded-[8px] font-medium text-sm transition hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
                <span>Отменить</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Панель фильтров */}
      <div className="flex flex-col lg:flex-row items-center gap-2 bg-white rounded-[12px] border border-gray/50 p-1 mb-6 min-h-[56px]">
        <div className="flex-1 flex items-center w-full">
          <input
            type="text"
            placeholder="Поиск по имени, email или компетенциям..."
            className="w-full bg-transparent outline-none text-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <Select
            placeholder="Отдел"
            value={selectedDepartment}
            onChange={setSelectedDepartment}
            options={departments}
            styles={customSelectStyles}
            className="w-full lg:w-40"
          />
          <Select
            placeholder="Роль"
            value={selectedRole}
            onChange={setSelectedRole}
            options={roles}
            styles={customSelectStyles}
            className="w-full lg:w-40"
          />
        </div>
      </div>

      {/* Таблица сотрудников */}
      <div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider sticky left-0 z-10 bg-gray">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.size === filteredEmployees.length && filteredEmployees.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider sticky left-[60px] z-10 bg-gray">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Сотрудник
                    {sortBy === 'name' ? (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1 text-primary" /> : <SortDesc className="w-4 h-4 ml-1 text-primary" />
                    ) : <SortAsc className="w-4 h-4 ml-1 text-gray-400" />}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('role')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Роль в отделе
                    {sortBy === 'role' ? (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1 text-primary" /> : <SortDesc className="w-4 h-4 ml-1 text-primary" />
                    ) : <SortAsc className="w-4 h-4 ml-1 text-gray-400" />}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
                  <button
                    onClick={() => handleSort('department')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Отдел
                    {sortBy === 'department' ? (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1 text-primary" /> : <SortDesc className="w-4 h-4 ml-1 text-primary" />
                    ) : <SortAsc className="w-4 h-4 ml-1 text-gray-400" />}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider hidden md:table-cell">
                  <button
                    onClick={() => handleSort('email')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Email
                    {sortBy === 'email' ? (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1 text-primary" /> : <SortDesc className="w-4 h-4 ml-1 text-primary" />
                    ) : <SortAsc className="w-4 h-4 ml-1 text-gray-400" />}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider hidden md:table-cell">
                  Telegram
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider hidden lg:table-cell">
                  Телефон
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider hidden md:table-cell">
                  <button
                    onClick={() => handleSort('competencies')}
                    className="flex items-center hover:text-gray-600 transition-colors"
                  >
                    Компетенции
                    {sortBy === 'competencies' ? (
                      sortDirection === 'asc' ? <SortAsc className="w-4 h-4 ml-1 text-primary" /> : <SortDesc className="w-4 h-4 ml-1 text-primary" />
                    ) : <SortAsc className="w-4 h-4 ml-1 text-gray-400" />}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider sticky right-0 z-10 bg-gray">
                  <div className="flex items-center justify-between">
                    <span>Действия</span>
                    <button
                      onClick={handleInlineCreate}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Добавить сотрудника в таблицу"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray/20">
              {/* Строка для инлайн создания сотрудника */}
              {showInlineCreate && (
                <tr className="bg-blue-50 border-b border-blue-200">
                  <td className="px-6 py-4 whitespace-nowrap sticky left-0 z-10 bg-blue-50">
                    <div className="w-4 h-4"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap sticky left-[60px] z-10 bg-blue-50">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Plus className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="ml-3 flex-1">
                        <input
                          type="text"
                          placeholder="Имя"
                          value={newEmployeeData.firstName}
                          onChange={(e) => setNewEmployeeData({...newEmployeeData, firstName: e.target.value})}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleInlineCreateConfirm();
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              handleInlineCreateCancel();
                            }
                          }}
                          className="w-full px-2 py-1 text-sm border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <input
                          type="text"
                          placeholder="Фамилия"
                          value={newEmployeeData.lastName}
                          onChange={(e) => setNewEmployeeData({...newEmployeeData, lastName: e.target.value})}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleInlineCreateConfirm();
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              handleInlineCreateCancel();
                            }
                          }}
                          className="w-full px-2 py-1 text-sm border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Select
                      placeholder="Роль"
                      value={roles.find(r => r.value === newEmployeeData.role)}
                      onChange={(option) => setNewEmployeeData({...newEmployeeData, role: option?.value || ''})}
                      options={roles.filter(r => r.value !== '')}
                      styles={customSelectStyles}
                      className="w-full"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Select
                      placeholder="Отдел"
                      value={departments.find(d => d.value === newEmployeeData.department)}
                      onChange={(option) => setNewEmployeeData({...newEmployeeData, department: option?.value || ''})}
                      options={departments.filter(d => d.value !== 'all')}
                      styles={customSelectStyles}
                      className="w-full"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                            <input
                          type="email"
                          placeholder="Email"
                          value={newEmployeeData.email}
                          onChange={(e) => setNewEmployeeData({...newEmployeeData, email: e.target.value})}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleInlineCreateConfirm();
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              handleInlineCreateCancel();
                            }
                          }}
                          className="w-full px-2 py-1 text-sm border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                            <input
                          type="text"
                          placeholder="Telegram"
                          value={newEmployeeData.telegram}
                          onChange={(e) => setNewEmployeeData({...newEmployeeData, telegram: e.target.value})}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleInlineCreateConfirm();
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              handleInlineCreateCancel();
                            }
                          }}
                          className="w-full px-2 py-1 text-sm border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                                            <input
                          type="tel"
                          placeholder="Телефон"
                          value={newEmployeeData.phone}
                          onChange={(e) => setNewEmployeeData({...newEmployeeData, phone: e.target.value})}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleInlineCreateConfirm();
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              handleInlineCreateCancel();
                            }
                          }}
                          className="w-full px-2 py-1 text-sm border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                            <textarea
                          placeholder="Компетенции"
                          value={newEmployeeData.competencies}
                          onChange={(e) => setNewEmployeeData({...newEmployeeData, competencies: e.target.value})}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              e.preventDefault();
                              handleInlineCreateConfirm();
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              handleInlineCreateCancel();
                            }
                          }}
                          className="w-full px-2 py-1 text-sm border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={2}
                        />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap sticky right-0 z-10 bg-blue-50">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleInlineCreateConfirm}
                        disabled={creatingEmployee}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        title="Подтвердить"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleInlineCreateCancel}
                        disabled={creatingEmployee}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        title="Отменить"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {filteredEmployees.map((employee, index) => (
                <tr key={employee.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray/5'}>
                  <td className={`px-6 py-4 whitespace-nowrap sticky left-0 z-10 ${index % 2 === 0 ? 'bg-white' : 'bg-gray/5'}`}>
                    <input
                      type="checkbox"
                      checked={selectedEmployees.has(employee.id)}
                      onChange={() => handleSelectEmployee(employee.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap sticky left-[60px] z-10 ${index % 2 === 0 ? 'bg-white' : 'bg-gray/5'}`}>
                    <div className="flex items-center">
                      <div className="relative group">
                        <Avatar
                          src={employee.avatar}
                          name={`${employee.first_name} ${employee.last_name}`}
                          size="sm"
                          roleInDept={employee.department_role}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                          <label className="cursor-pointer w-full h-full flex items-center justify-center">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  handleTableAvatarUpload(employee.id, file);
                                }
                              }}
                              className="hidden"
                              disabled={uploadingAvatar && uploadingEmployeeId === employee.id}
                            />
                            {uploadingAvatar && uploadingEmployeeId === employee.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <Image className="w-4 h-4 text-white" />
                            )}
                          </label>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{`${employee.first_name} ${employee.last_name}`}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingCell === `${employee.id}-role` ? (
                      <Select
                        value={roles.find(r => r.value === employee.role)}
                        onChange={(option) => handleInlineEdit(employee.id, 'role', option.value)}
                        options={roles}
                        styles={customSelectStyles}
                        autoFocus
                        onBlur={() => setEditingCell(null)}
                        className="w-full"
                      />
                    ) : (
                      <span 
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(employee.department_role)} cursor-pointer`}
                        onClick={() => setEditingCell(`${employee.id}-role`)}
                      >
                        {getRoleText(employee.department_role) || '—'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingCell === `${employee.id}-department` ? (
                      <Select
                        value={departments.find(d => d.value === employee.department_id)}
                        onChange={(option) => handleInlineEdit(employee.id, 'department', option.value)}
                        options={departments.filter(d => d.value !== 'all')}
                        styles={customSelectStyles}
                        autoFocus
                        onBlur={() => setEditingCell(null)}
                        className="w-full"
                      />
                    ) : (
                      <span 
                        className="cursor-pointer hover:bg-gray/10 px-2 py-1 rounded"
                        onClick={() => setEditingCell(`${employee.id}-department`)}
                      >
                        {employee.department?.name || 'Не указан'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                    {editingCell === `${employee.id}-email` ? (
                      <input
                        type="email"
                        defaultValue={employee.email}
                        className="w-full px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        onBlur={(e) => {
                          handleInlineEdit(employee.id, 'email', e.target.value);
                          setEditingCell(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleInlineEdit(employee.id, 'email', e.target.value);
                            setEditingCell(null);
                          }
                          if (e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="cursor-pointer hover:bg-gray/10 px-2 py-1 rounded w-full block"
                        onClick={() => setEditingCell(`${employee.id}-email`)}
                      >
                        {employee.email}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                    {editingCell === `${employee.id}-telegram` ? (
                      <input
                        type="text"
                        defaultValue={employee.telegram || ''}
                        className="w-full px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        onBlur={(e) => {
                          handleInlineEdit(employee.id, 'telegram', e.target.value);
                          setEditingCell(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleInlineEdit(employee.id, 'telegram', e.target.value);
                            setEditingCell(null);
                          }
                          if (e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="cursor-pointer hover:bg-gray/10 px-2 py-1 rounded flex items-center gap-1 w-full"
                        onClick={() => setEditingCell(`${employee.id}-telegram`)}
                      >
                        {employee.telegram ? (
                          <>
                            <MessageCircle className="w-3 h-3" />
                            {employee.telegram}
                          </>
                        ) : (
                          <span className="text-gray-400">Не указан</span>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                    {editingCell === `${employee.id}-phone` ? (
                      <input
                        type="tel"
                        defaultValue={employee.phone}
                        className="w-full px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        onBlur={(e) => {
                          handleInlineEdit(employee.id, 'phone', e.target.value);
                          setEditingCell(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleInlineEdit(employee.id, 'phone', e.target.value);
                            setEditingCell(null);
                          }
                          if (e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="cursor-pointer hover:bg-gray/10 px-2 py-1 rounded w-full block"
                        onClick={() => setEditingCell(`${employee.id}-phone`)}
                      >
                        {employee.phone}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                    {editingCell === `${employee.id}-competencies` ? (
                      <textarea
                        defaultValue={employee.competencies || ''}
                        className="w-full px-2 py-1 border border-gray/20 rounded focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        rows={3}
                        onBlur={(e) => {
                          handleInlineEdit(employee.id, 'competencies', e.target.value);
                          setEditingCell(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            handleInlineEdit(employee.id, 'competencies', e.target.value);
                            setEditingCell(null);
                          }
                          if (e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }}
                        autoFocus
                        placeholder="Введите компетенции..."
                      />
                    ) : (
                      <div 
                        className="cursor-pointer hover:bg-gray/10 px-2 py-1 rounded min-h-[20px] w-full"
                        onClick={() => setEditingCell(`${employee.id}-competencies`)}
                      >
                        {employee.competencies ? (
                          <div className="text-sm">
                            {employee.competencies.split('\n').slice(0, 2).map((line, index) => (
                              <div key={index} className="truncate">
                                • {line.trim()}
                              </div>
                            ))}
                            {employee.competencies.split('\n').length > 2 && (
                              <div className="text-xs text-gray-500 mt-1">
                                +{employee.competencies.split('\n').length - 2} еще
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Не указаны</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium sticky right-0 z-10 ${index % 2 === 0 ? 'bg-white' : 'bg-gray/5'}`}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(employee)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleArchive(employee.id)}
                        className="text-orange-600 hover:text-orange-900"
                        title="Архивировать"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальное окно добавления сотрудника */}
      <EmployeeModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingEmployee(null);
        }}
        onSubmit={async (employeeData) => {
          try {
            if (editingEmployee) {
              // Создаем объект только с измененными полями
              const updateData = {};
              
              // Проверяем каждое поле на изменения
              if (employeeData.changedFields?.has('firstName')) {
                updateData.first_name = employeeData.firstName;
              }
              if (employeeData.changedFields?.has('lastName')) {
                updateData.last_name = employeeData.lastName;
              }
              if (employeeData.changedFields?.has('email')) {
                updateData.email = employeeData.email;
              }
              if (employeeData.changedFields?.has('phone')) {
                updateData.phone = employeeData.phone;
              }
              if (employeeData.changedFields?.has('telegram')) {
                updateData.telegram = employeeData.telegram;
              }
              if (employeeData.changedFields?.has('hireDate')) {
                updateData.hire_date = employeeData.hireDate;
              }
              if (employeeData.changedFields?.has('birthDate')) {
                updateData.birth_date = employeeData.birthDate;
              }
              if (employeeData.changedFields?.has('department')) {
                updateData.department_id = employeeData.department;
              }
              if (employeeData.changedFields?.has('role')) {
                updateData.department_role = employeeData.role;
              }
              if (employeeData.changedFields?.has('competencies')) {
                updateData.competencies = employeeData.competencies;
              }
              if (employeeData.changedFields?.has('notes')) {
                updateData.notes = employeeData.notes;
              }
              // Аватар уже сохранен отдельно в EmployeeModal, не отправляем его повторно
              // if (employeeData.changedFields?.has('avatar')) {
              //   updateData.avatar = employeeData.avatar;
              // }
              
              // Обновляем только если есть изменения в основных полях
              if (Object.keys(updateData).length > 0) {
                console.log('Обновляем поля сотрудника:', updateData);
                await api.updateEmployee(editingEmployee.id, updateData);
              } else {
                console.log('Основные поля не изменились, пропускаем обновление');
              }

              // Сохраняем навыки только если они изменились
              if (employeeData.skills && employeeData.skillsChanged) {
                console.log('Навыки изменились, обновляем...');
                
                // Получаем текущие навыки сотрудника
                const existingSkills = editingEmployee.employeeSkills || [];
                const existingSkillIds = new Set(existingSkills.map(es => es.skill.id));
                
                // Получаем новые навыки
                const allSkills = [
                  ...employeeData.skills.hardSkills,
                  ...employeeData.skills.softSkills,
                  ...employeeData.skills.hobbies
                ];
                
                // Фильтруем только валидные навыки
                const validSkills = allSkills.filter(skill => skill && skill.value && skill.value !== '' && skill.value !== null && skill.value !== undefined);
                const newSkillIds = new Set(validSkills.map(skill => skill.value));
                
                // Удаляем навыки, которых больше нет
                for (const existingSkill of existingSkills) {
                  if (!newSkillIds.has(existingSkill.skill.id)) {
                    try {
                      await api.removeEmployeeSkill(editingEmployee.id, existingSkill.skill.id);
                      console.log('Удален навык:', existingSkill.skill.name);
                    } catch (err) {
                      console.error('Ошибка при удалении навыка:', existingSkill.skill.name, err);
                    }
                  }
                }
                
                // Добавляем новые навыки
                for (const skill of validSkills) {
                  if (!existingSkillIds.has(skill.value)) {
                    try {
                      await api.addEmployeeSkill(editingEmployee.id, {
                        skill_id: skill.value,
                        level: skill.level || 1
                      });
                      console.log('Добавлен навык:', skill.label);
                    } catch (err) {
                      console.error('Ошибка при добавлении навыка:', skill, err);
                      showNotification('Ошибка при добавлении навыка: ' + (err?.message || err, 'error'));
                    }
                  }
                }
              } else {
                console.log('Навыки не изменились, пропускаем обновление навыков');
              }
            } else {
              // Создание нового сотрудника
              const createData = {
                first_name: employeeData.firstName,
                last_name: employeeData.lastName,
                email: employeeData.email,
                phone: employeeData.phone,
                telegram: employeeData.telegram,
                hire_date: employeeData.hireDate,
                birth_date: employeeData.birthDate,
                department_id: employeeData.department,
                department_role: employeeData.role,
                competencies: employeeData.competencies
              };
              
              // Добавляем аватар только если он есть
              if (employeeData.avatar) {
                createData.avatar = employeeData.avatar;
              }
              
              await api.createEmployee(createData);
            }
            
            // Перезагружаем данные
            const loadData = async () => {
              try {
                setLoading(true);
                const [employeesResponse, departmentsResponse] = await Promise.all([
                  api.getEmployees(),
                  api.getDepartments()
                ]);
                
                const employeesData = employeesResponse.data || employeesResponse;
                const departmentsRaw = departmentsResponse.data?.departments || departmentsResponse.departments || departmentsResponse;
                const formattedDepartments = [
                  { value: 'all', label: 'Все отделы' },
                  ...(Array.isArray(departmentsRaw) ? departmentsRaw : []).map(dept => ({
                    value: dept.id,
                    label: dept.name
                  }))
                ];
                
                setEmployees(employeesData);
                setDepartments(formattedDepartments);
              } catch (error) {
                console.error('Error loading data:', error);
                setError('Ошибка загрузки данных');
              } finally {
                setLoading(false);
              }
            };
            
            await loadData();
            setShowAddModal(false);
            setEditingEmployee(null);
          } catch (error) {
            console.error('Error saving employee:', error);
            showNotification('Ошибка сохранения сотрудника', 'error');
          }
        }}
        editingEmployee={editingEmployee}
        existingEmployees={employees}
      />

      {/* Модальное окно кропа аватара */}
      <AvatarCropModal
        isOpen={showCropModal}
        onClose={() => {
          setShowCropModal(false);
          setAvatarFile(null);
        }}
        onSave={(cropData) => {
          // console.log('Crop data:', cropData);
          setShowCropModal(false);
          setAvatarFile(null);
        }}
        imageFile={avatarFile}
      />

      {/* Модальное окно мульти-редактирования */}
      {showMultiEditModal && (
        <div className="fixed top-[70px] left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[15px] w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            {/* Заголовок */}
            <div className="flex items-center justify-between p-6 border-b border-gray/20">
              <h3 className="text-lg font-semibold text-dark">
                Мульти-редактирование сотрудников
              </h3>
              <button
                onClick={handleMultiEditCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Содержимое */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-[8px]">
                <p className="text-sm text-blue-700">
                  Выбрано {selectedEmployees.size} сотрудников. Изменения будут применены ко всем выбранным сотрудникам.
                </p>
              </div>

              <div className="space-y-4">
                {/* Отдел */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Отдел</label>
                  <Select
                    placeholder="Выберите отдел"
                    options={departments.filter(d => d.value !== 'all')}
                    styles={customSelectStyles}
                    value={multiEditData.department}
                    onChange={(option) => setMultiEditData({...multiEditData, department: option})}
                  />
                  <p className="text-xs text-gray-500 mt-1">Оставьте пустым, чтобы не изменять</p>
                </div>

                {/* Роль */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Роль в отделе</label>
                  <Select
                    placeholder="Выберите роль"
                    options={roles.filter(r => r.value !== '')}
                    styles={customSelectStyles}
                    value={multiEditData.role}
                    onChange={(option) => setMultiEditData({...multiEditData, role: option})}
                  />
                  <p className="text-xs text-gray-500 mt-1">Оставьте пустым, чтобы не изменять</p>
                </div>

                {/* Telegram */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telegram</label>
                  <input
                    type="text"
                    placeholder="Введите Telegram username"
                    value={multiEditData.telegram}
                    onChange={(e) => setMultiEditData({...multiEditData, telegram: e.target.value})}
                    className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">Оставьте пустым, чтобы не изменять</p>
                </div>

                {/* Телефон */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                  <input
                    type="tel"
                    placeholder="Введите номер телефона"
                    value={multiEditData.phone}
                    onChange={(e) => setMultiEditData({...multiEditData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray/20 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">Оставьте пустым, чтобы не изменять</p>
                </div>
              </div>
            </div>

            {/* Фиксированные кнопки внизу */}
            <div className="p-6 border-t border-gray/20 bg-white">
              <div className="flex gap-3">
                <button
                  onClick={handleMultiEditCancel}
                  className="flex-1 px-4 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleMultiEditSave}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors"
                >
                  Применить изменения
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно импорта */}
      {showImportModal && (
        <div className="fixed top-[70px] left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[15px] w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
            {/* Заголовок */}
            <div className="flex items-center justify-between p-6 border-b border-gray/20">
              <h3 className="text-lg font-semibold text-dark">
                Импорт сотрудников
              </h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setAbortImport(false);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={importing && !abortImport}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Содержимое */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Прогресс */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    abortImport ? 'text-red-600' : 'text-gray-700'
                  }`}>
                    {currentImportStep}
                  </span>
                  <span className="text-sm text-gray-500">
                    {processedRows} из {totalRows}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      abortImport ? 'bg-red-500' : 'bg-primary'
                    }`}
                    style={{ width: `${importProgress}%` }}
                  ></div>
                </div>
                {abortImport && (
                  <div className="mt-2 text-sm text-red-600 font-medium">
                    ⚠️ Импорт будет прерван после завершения текущего сотрудника
                  </div>
                )}
              </div>

              {/* Статистика */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-[8px] p-3">
                  <div className="text-2xl font-bold text-green-600">
                    {importSuccess.length}
                  </div>
                  <div className="text-sm text-green-700">Успешно</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-[8px] p-3">
                  <div className="text-2xl font-bold text-red-600">
                    {importErrors.length}
                  </div>
                  <div className="text-sm text-red-700">Ошибок</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-[8px] p-3">
                  <div className="text-2xl font-bold text-blue-600">
                    {importDetails.length}
                  </div>
                  <div className="text-sm text-blue-700">Всего</div>
                </div>
              </div>

              {/* Детали импорта */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {importDetails.map((detail, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-[8px] border ${
                      detail.status === 'success' 
                        ? 'bg-green-50 border-green-200' 
                        : detail.status === 'error'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          detail.status === 'success' 
                            ? 'bg-green-500' 
                            : detail.status === 'error'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                        }`}></div>
                        <div>
                          <div className="font-medium text-gray-900">
                            Строка {detail.row}: {detail.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {detail.email}
                          </div>
                        </div>
                      </div>
                      <div className={`text-sm font-medium ${
                        detail.status === 'success' 
                          ? 'text-green-700' 
                          : detail.status === 'error'
                          ? 'text-red-700'
                          : 'text-yellow-700'
                      }`}>
                        {detail.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Фиксированные кнопки внизу */}
            <div className="p-6 border-t border-gray/20 bg-white">
              <div className="flex gap-3">
                {importing && (
                  <button
                    onClick={() => setAbortImport(true)}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-[8px] hover:bg-red-600 transition-colors"
                    disabled={abortImport}
                  >
                    {abortImport ? 'Прерывание...' : 'Прервать импорт'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setAbortImport(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors"
                  disabled={importing && !abortImport}
                >
                  {importing && !abortImport ? 'Закрыть (после завершения)' : 'Закрыть'}
                </button>
                {!importing && importSuccess.length > 0 && (
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setAbortImport(false);
                      loadData();
                    }}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors"
                  >
                    Обновить список
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Уведомления */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : notification.type === 'error'
            ? 'bg-red-500 text-white'
            : 'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

    </div>
  );
} 