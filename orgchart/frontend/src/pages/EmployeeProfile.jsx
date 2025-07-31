import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Building, Award, Calendar, Clock, Gift, HandMetal, Heart } from 'lucide-react';
import { SiTelegram } from 'react-icons/si';
import { RiTelegram2Line } from 'react-icons/ri';
import api from '../services/api';
import Avatar from '../components/ui/Avatar';
import EmployeeCard from '../components/EmployeeCard';
import { calculateTimeInTeam, formatDate } from '../utils/dateUtils';

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false); // Для индикатора обновления данных

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Сначала пытаемся загрузить из кеша
        const cachedEmployee = localStorage.getItem(`employee_cache_${id}`);
        if (cachedEmployee) {
          try {
            const employeeData = JSON.parse(cachedEmployee);
            if (Date.now() - employeeData.timestamp < 10 * 60 * 1000) { // 10 минут
              const cachedEmployeeData = employeeData.data.employee;
              
              const formattedEmployee = {
                id: cachedEmployeeData.id,
                name: `${cachedEmployeeData.first_name} ${cachedEmployeeData.last_name}`,
                avatar: cachedEmployeeData.avatar,
                position: cachedEmployeeData.position,
                department: cachedEmployeeData.department?.name || 'Не указан',
                roleInDept: cachedEmployeeData.department_role || '',
                email: cachedEmployeeData.email,
                telegram: cachedEmployeeData.telegram,
                phone: cachedEmployeeData.phone,
                birth: cachedEmployeeData.birth_date ? (() => {
                  const date = new Date(cachedEmployeeData.birth_date);
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  return `${year}-${month}-${day}`;
                })() : '',
                wishlist: cachedEmployeeData.wishlist_url,
                joined: cachedEmployeeData.hire_date,
                competencies: cachedEmployeeData.competencies ? cachedEmployeeData.competencies.split('\n') : [],
                hardSkills: cachedEmployeeData.hardSkills || [],
                softSkills: cachedEmployeeData.softSkills || [],
                hobbies: cachedEmployeeData.hobbies || [],
                status: cachedEmployeeData.status
              };
              
              setEmployee(formattedEmployee);
              setLoading(false); // Устанавливаем loading в false сразу после загрузки кеша
            }
          } catch (error) {
            console.warn('Error parsing cached employee:', error);
          }
        }
        
        // Загружаем свежие данные (в фоне, если есть кеш)
        if (cachedEmployee) {
          setRefreshing(true); // Показываем индикатор обновления
        }
        
        const response = await api.getEmployee(id);
        const employeeData = response.employee;
        
        // Преобразуем данные API в нужный формат
        const formattedEmployee = {
          id: employeeData.id,
          name: `${employeeData.first_name} ${employeeData.last_name}`,
          avatar: employeeData.avatar,
          position: employeeData.position,
          department: employeeData.department?.name || 'Не указан',
          roleInDept: employeeData.department_role || '',
          email: employeeData.email,
          telegram: employeeData.telegram,
          phone: employeeData.phone,
          birth: employeeData.birth_date ? (() => {
            const date = new Date(employeeData.birth_date);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          })() : '',
          wishlist: employeeData.wishlist_url,
          joined: employeeData.hire_date,
          competencies: employeeData.competencies ? employeeData.competencies.split('\n') : [],
          hardSkills: employeeData.hardSkills || [],
          softSkills: employeeData.softSkills || [],
          hobbies: employeeData.hobbies || [],
          status: employeeData.status
        };
        
        setEmployee(formattedEmployee);
      } catch (error) {
        console.error('Error loading employee:', error);
        setError('Ошибка загрузки данных сотрудника');
      } finally {
        setLoading(false);
        setRefreshing(false); // Сбрасываем индикатор обновления
      }
    };

    if (id) {
      loadEmployee();
    }
  }, [id]);

  // Показываем загрузку только если еще загружаемся и нет данных
  if (loading && !employee) {
    return (
      <div className="w-full max-w-none mx-auto min-h-screen flex flex-col">
        <div className="flex items-center justify-between py-8 border-b border-gray/30 sticky top-0 bg-white z-10 px-4 sm:px-10">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold font-accent text-primary">Профиль сотрудника</span>
          </div>
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray/30 transition" title="Назад">
            <ArrowLeft className="w-8 h-8 text-dark" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка профиля сотрудника...</p>
          </div>
        </div>
      </div>
    );
  }

  // Показываем ошибку только если загрузка завершена и сотрудник не найден
  if (!loading && !employee) {
    return (
      <div className="w-full max-w-none mx-auto min-h-screen flex flex-col">
        <div className="flex items-center justify-between py-8 border-b border-gray/30 sticky top-0 bg-white z-10 px-4 sm:px-10">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold font-accent text-primary">Профиль сотрудника</span>
          </div>
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray/30 transition" title="Назад">
            <ArrowLeft className="w-8 h-8 text-dark" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">Сотрудник не найден</h2>
            <p className="text-gray-500">Запрашиваемый сотрудник не существует или был удален</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none mx-auto min-h-screen flex flex-col">
      {/* Показываем загрузку только если нет данных сотрудника */}
      {loading && !employee && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка профиля сотрудника...</p>
          </div>
        </div>
      )}

      {/* Показываем основной контент если есть данные сотрудника */}
      {employee && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between py-8 border-b border-gray/30 sticky top-0 bg-white px-4 sm:px-10" style={{ zIndex: 100 }}>
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold font-accent text-primary">Профиль сотрудника</span>
            </div>
            <div className="flex items-center gap-4">
              {refreshing && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span>Обновление данных...</span>
                </div>
              )}
              <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray/30 transition" title="Назад">
                <ArrowLeft className="w-8 h-8 text-dark" />
              </button>
            </div>
          </div>
          {/* Рабочая область: новый детальный компонент */}
          <div className="py-8 sm:py-12 w-full max-w-full md:max-w-6xl mx-auto px-4 sm:px-8">
            <EmployeeCard
              employee={employee}
              variant="detailed"
              showEditButton={true}
            />
          </div>
        </>
      )}
    </div>
  );
}

 