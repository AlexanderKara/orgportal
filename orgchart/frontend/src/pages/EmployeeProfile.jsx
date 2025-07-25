import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Building, Award, Calendar, Clock, Gift, HandMetal, Heart } from 'lucide-react';
import { SiTelegram } from 'react-icons/si';
import { RiTelegram2Line } from 'react-icons/ri';
import api from '../services/api';
import Avatar from '../components/ui/Avatar';
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
          {/* Рабочая область: двухколоночный layout */}
          <div className="flex flex-col md:flex-row gap-4 sm:gap-12 py-8 sm:py-12 w-full max-w-full md:max-w-6xl mx-auto px-4 sm:px-8">
            {/* Левая часть: Sidebar */}
            <aside className="md:w-1/3 max-w-full md:max-w-xs min-w-0 md:min-w-[260px] flex flex-col items-center bg-white/80 rounded-2xl shadow-sm py-8 sm:py-14 px-2 sm:px-8 mb-8 md:mb-0">
              <Avatar
                src={employee.avatar}
                name={employee.name}
                size="3xl"
                className="mb-3 sm:mb-5"
                roleInDept={employee.roleInDept}
              />
              <div className="font-bold text-2xl font-accent text-primary text-center mb-4">{employee.name}</div>
              {employee.position && <div className="text-lg text-gray-500 text-center mb-2">{employee.position}</div>}
            </aside>

            {/* Правая часть: Основная информация */}
            <main className="flex-1 min-w-0">
              {/* Контактная информация */}
              <section className="bg-white/80 rounded-2xl shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Контактная информация</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <a href={`mailto:${employee.email}`} className="text-primary hover:underline">
                        {employee.email}
                      </a>
                    </div>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Телефон</p>
                        <a href={`tel:${employee.phone}`} className="text-primary hover:underline">
                          {employee.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {employee.telegram && (
                    <div className="flex items-center gap-3">
                      <RiTelegram2Line className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Telegram</p>
                        <a href={`https://t.me/${employee.telegram.replace('@','')}`} className="text-primary hover:underline">
                          {employee.telegram}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Общая информация */}
              <section className="bg-white/80 rounded-2xl shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Общая информация</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Отдел</p>
                      <p className="font-medium">{employee.department}</p>
                    </div>
                  </div>
                  {employee.roleInDept && (
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Роль в отделе</p>
                        <p className="font-medium">{getRoleText(employee.roleInDept)}</p>
                      </div>
                    </div>
                  )}
                  {employee.birth && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">День рождения</p>
                        <span className="font-medium flex items-center gap-1 align-middle">
                          {formatDate(employee.birth)}
                          {employee.wishlist && (
                            <a href={employee.wishlist} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1 flex items-center" style={{lineHeight: 1}}>
                              <Gift className="w-4 h-4 inline align-middle" />
                            </a>
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                  {employee.joined && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">В команде с</p>
                        <p className="font-medium">{calculateTimeInTeam(employee.joined)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Компетенции */}
              {employee.competencies && employee.competencies.length > 0 && (
                <section className="bg-white/80 rounded-2xl shadow-sm p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Ключевые компетенции</h2>
                  <ul className="space-y-2">
                    {employee.competencies.map((comp, i) => (
                      <li key={i} className="flex items-start mb-1">
                        <div className="mt-[3px]">
                          <StarBullet />
                        </div>
                        <span className="ml-1">{comp}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Навыки */}
              {(employee.hardSkills?.length > 0 || employee.softSkills?.length > 0 || employee.hobbies?.length > 0) && (
                <section className="bg-white/80 rounded-2xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Навыки</h2>
                  <div className="space-y-4">
                    {employee.hardSkills?.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-800 mb-2 flex items-center gap-2">
                          <Award className="w-5 h-5 text-blue-500" />
                          Хард навыки
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {employee.hardSkills.map((skill) => (
                            <span
                              key={skill.id}
                              className="px-3 py-1 bg-blue-50 text-blue-900 rounded-lg text-sm flex items-center gap-1"
                            >
                              {skill.label}
                              {skill.level && (
                                <span className="ml-1 flex items-center">
                                  {Array.from({ length: skill.level }).map((_, i) => (
                                    <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <polygon points="7,1 8.2,5.2 13,7 8.2,8.8 7,13 5.8,8.8 1,7 5.8,5.2" fill="currentColor" />
                                    </svg>
                                  ))}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {employee.softSkills?.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-800 mb-2 flex items-center gap-2">
                          <HandMetal className="w-5 h-5 text-orange-500" />
                          Софт навыки
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {employee.softSkills.map((skill) => (
                            <span
                              key={skill.id}
                              className="px-3 py-1 bg-orange-50 text-orange-900 rounded-lg text-sm flex items-center gap-1"
                            >
                              {skill.label}
                              {skill.level && (
                                <span className="ml-1 flex items-center">
                                  {Array.from({ length: skill.level }).map((_, i) => (
                                    <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <polygon points="7,1 8.2,5.2 13,7 8.2,8.8 7,13 5.8,8.8 1,7 5.8,5.2" fill="currentColor" />
                                    </svg>
                                  ))}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {employee.hobbies?.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-800 mb-2 flex items-center gap-2">
                          <Heart className="w-5 h-5 text-green-500" />
                          Хобби
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {employee.hobbies.map((hobby) => (
                            <span
                              key={hobby.id}
                              className="px-3 py-1 bg-green-50 text-green-900 rounded-lg text-sm flex items-center gap-1"
                            >
                              {hobby.label}
                              {hobby.level && (
                                <span className="ml-1 flex items-center">
                                  {Array.from({ length: hobby.level }).map((_, i) => (
                                    <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <polygon points="7,1 8.2,5.2 13,7 8.2,8.8 7,13 5.8,8.8 1,7 5.8,5.2" fill="currentColor" />
                                    </svg>
                                  ))}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </main>
          </div>
        </>
      )}
    </div>
  );
}

function StarBullet() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
      <polygon points="7,1 8.2,5.2 13,7 8.2,8.8 7,13 5.8,8.8 1,7 5.8,5.2" fill="#E42E0F" />
    </svg>
  );
} 

function getRoleText(role) {
  switch (role) {
    case 'lead': return 'Лид';
    case 'deputy': return 'Зам';
    case 'product': return 'Продакт';
    default: return role || '';
  }
} 