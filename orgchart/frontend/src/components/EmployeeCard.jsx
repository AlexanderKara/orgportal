import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Mail, Phone, Building, Award, Calendar, Clock, Gift, Heart, Share2 } from 'lucide-react';
import { RiTelegram2Line } from 'react-icons/ri';
import Avatar from './ui/Avatar';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from './RoleProvider';
import { formatDate } from '../utils/dateUtils';

// Функция для получения текста роли
function getRoleText(role) {
  switch (role) {
    case 'lead': return 'Лид';
    case 'deputy': return 'Зам';
    case 'product': return 'Продакт';
    default: return role || '';
  }
}

// Функция для определения пола по имени (улучшенная эвристика)
function getGenderByFirstName(firstName) {
  if (!firstName) return 'male'; // по умолчанию мужской
  
  const name = firstName.toLowerCase();
  
  // Женские окончания (более полный список)
  const femaleEndings = [
    'ова', 'ева', 'ина', 'ая', 'яя', 'ская', 'цкая', 'ская', 'цкая',
    'а', 'я', 'ия', 'ея', 'уя', 'оя', 'ея', 'ия', 'ая', 'яя'
  ];
  
  // Мужские окончания
  const maleEndings = [
    'ов', 'ев', 'ин', 'ый', 'ой', 'ий', 'ой', 'ий', 'ой', 'ий',
    'ов', 'ев', 'ин', 'ый', 'ой', 'ий', 'ой', 'ий', 'ой', 'ий'
  ];
  
  // Проверяем женские окончания
  for (const ending of femaleEndings) {
    if (name.endsWith(ending)) return 'female';
  }
  
  // Проверяем мужские окончания
  for (const ending of maleEndings) {
    if (name.endsWith(ending)) return 'male';
  }
  
  // Дополнительные женские имена
  const femaleNames = [
    'анна', 'мария', 'елена', 'ольга', 'наталья', 'ирина', 'татьяна',
    'светлана', 'людмила', 'галина', 'валентина', 'раиса', 'зоя',
    'лидия', 'нина', 'валерия', 'марина', 'лариса', 'инна', 'вероника'
  ];
  
  // Дополнительные мужские имена
  const maleNames = [
    'александр', 'сергей', 'владимир', 'дмитрий', 'андрей', 'алексей',
    'михаил', 'игорь', 'николай', 'виктор', 'павел', 'евгений',
    'константин', 'артем', 'максим', 'денис', 'антон', 'илья'
  ];
  
  // Проверяем точные совпадения имен
  if (femaleNames.includes(name)) return 'female';
  if (maleNames.includes(name)) return 'male';
  
  return 'male'; // по умолчанию мужской
}

// Компонент для отображения тегов
function TagsBlock({ employee, variant = 'compact' }) {
  const tags = [];
  
  // Роль в отделе
  if (employee.roleInDept) {
    tags.push({
      text: getRoleText(employee.roleInDept),
      color: 'bg-primary/90 text-white'
    });
  }
  
  // Статус в отпуске
  if (employee.status === 'vacation' || employee.isOnVacation) {
    tags.push({
      text: 'В отпуске',
      color: 'bg-gray-500 text-white'
    });
  }
  
  // Другие статусы можно добавить здесь
  
  const containerClass = variant === 'mini' 
    ? 'flex flex-wrap gap-1 justify-center min-h-[22px] items-center'
    : 'flex flex-wrap gap-1 justify-center min-h-[22px] items-center';
  
  return (
    <div className={containerClass}>
      {tags.length > 0 ? (
        tags.map((tag, index) => (
          <span
            key={index}
            className={`text-xs rounded-[12px] px-2 py-0.5 text-center ${tag.color}`}
          >
            {tag.text}
          </span>
        ))
      ) : (
        <div className="text-xs text-transparent">—</div>
      )}
    </div>
  );
}

// Мини-карточка
function MiniCard({ employee, onClick, className = '' }) {
  return (
    <div
      className={`flex flex-col items-center rounded-[12px] p-3 border border-gray/50 transition hover:bg-gray/30 cursor-pointer ${className}`}
      onClick={onClick}
    >
      <Avatar
        src={employee.avatar}
        name={`${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.full_name || employee.name}
        size="md"
        className="mb-3"
        roleInDept={employee.roleInDept}
      />
      <div className="font-medium text-sm text-dark text-center mb-2">
        {`${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.full_name || employee.name || 'Нет ФИО'}
      </div>
      <TagsBlock employee={employee} variant="mini" />
    </div>
  );
}

// Компактная карточка
function CompactCard({ employee, onClick, onEdit, showEditButton = false, className = '' }) {
  const navigate = useNavigate();
  
  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(employee);
    else navigate(`/admin/employees?edit=${employee.id}`);
  };
  
  return (
    <div
      className={`employee-card-base flex flex-col items-center rounded-[15px] border border-gray/50 transition hover:bg-gray/30 cursor-pointer relative group overflow-hidden ${className}`}
      onClick={onClick}
    >
      {/* Кнопка редактирования для администраторов */}
      {showEditButton && (
        <div 
          className="absolute top-2 right-2 z-20 bg-white rounded-full p-1.5 shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
          onClick={handleEdit}
          title="Редактировать сотрудника"
        >
          <Edit className="w-4 h-4 text-gray-500 hover:text-primary" />
        </div>
      )}
      
      <div className="flex-1 flex flex-col items-center p-2 sm:p-4 pt-8 sm:pt-8">
        <Avatar
          src={employee.avatar}
          name={`${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.full_name || employee.name}
          size="lg"
          className="mb-4"
          roleInDept={employee.roleInDept}
        />
      
      <div className="font-bold text-dark text-center mb-3">
        {`${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.full_name || employee.name || 'Нет ФИО'}
      </div>
      
      <TagsBlock employee={employee} variant="compact" />
      
      {/* Блок с параметрами сотрудника */}
      <div className="w-full mt-3 space-y-2">
        {/* Отдел */}
        {employee.departmentInfo && (
          <div className="text-xs min-h-[16px] leading-relaxed flex items-center">
            <div className="w-24 text-right text-gray-pale pr-2">
              Отдел:
            </div>
            <div className="flex-1 text-left text-gray-500">
              {employee.departmentInfo}
            </div>
          </div>
        )}
        
        {/* В команде */}
        {employee.teamInfo && (
          <div className="text-xs min-h-[16px] leading-relaxed flex items-center">
            <div className="w-24 text-right text-gray-pale pr-2">
              В команде:
            </div>
            <div className="flex-1 text-left text-gray-500">
              {employee.teamInfo}
            </div>
          </div>
        )}
        
        {/* Рейтинг */}
        {employee.ratingInfo && (
          <div className="text-xs min-h-[16px] leading-relaxed flex items-center">
            <div className="w-24 text-right text-gray-pale pr-2">
              Рейтинг:
            </div>
            <div className="flex-1 text-left text-gray-500">
              {employee.ratingInfo}
            </div>
          </div>
        )}
        
        {/* Дата рождения с вишлистом */}
        {employee.birth && (
          <div className="text-xs min-h-[16px] leading-relaxed flex items-center">
            <div className="w-24 text-right text-gray-pale pr-2">
              {(() => {
                const firstName = employee.first_name || '';
                const gender = getGenderByFirstName(firstName);
                return gender === 'female' ? 'Родилась:' : 'Родился:';
              })()}
            </div>
            <div className="flex-1 text-left text-gray-500 flex items-center">
              <span>{formatDate(employee.birth)}</span>
              {employee.wishlist && employee.wishlist.trim() !== '' && (
                <a 
                  href={employee.wishlist} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:text-primary/80 transition-colors ml-1 flex items-center" 
                  onClick={e => e.stopPropagation()} 
                  title="Вишлист"
                >
                  <Gift className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        )}
        
        {/* Отпуска */}
        {employee.vacationInfo && (
          <div className="text-xs min-h-[16px] leading-relaxed flex items-center">
            <div className="w-24 text-right text-gray-pale pr-2">
              Отпуск:
            </div>
            <div className="flex-1 text-left text-gray-500">
              {employee.vacationInfo}
            </div>
          </div>
        )}
      </div>

      {/* Компетенции для представления departments */}
      {employee.showCompetencies && Array.isArray(employee.competencies) && employee.competencies.length > 0 && (
        <div className="text-xs text-gray-600 w-full flex-1 overflow-visible leading-relaxed mt-2">
          <ul className="text-left list-none pl-2">
            {employee.competencies.slice(0, 3).map((comp, index) => (
              <li key={index} className="flex items-start justify-start mb-1">
                <div className="mt-[3px]">
                  <StarBullet />
                </div>
                <span className="text-left ml-1">{comp}</span>
              </li>
            ))}
            {employee.competencies.length > 3 && (
              <li className="text-gray-400 text-center">...и ещё {employee.competencies.length - 3}</li>
            )}
          </ul>
        </div>
      )}
      
      {/* Пустое место для компенсации компетенций */}
      {employee.showCompetencies && (!Array.isArray(employee.competencies) || employee.competencies.length === 0) && (
        <div className="text-xs text-gray-600 w-full min-h-[24px] flex-1 leading-relaxed mt-2"></div>
      )}
      </div>
      
      {/* Темный блок с иконками контактов */}
      <div className="w-full bg-dark-gray py-2 px-4 flex justify-center gap-8">
        {employee.phone && (
          <a 
            href={`tel:${employee.phone}`}
            className="text-white-custom hover:text-white-hover transition-colors p-2 rounded-full hover:bg-white-hover"
            onClick={e => e.stopPropagation()}
            title="Позвонить"
          >
            <Phone className="w-5 h-5" />
          </a>
        )}
        {employee.email && (
          <a 
            href={`mailto:${employee.email}`}
            className="text-white-custom hover:text-white-hover transition-colors p-2 rounded-full hover:bg-white-hover"
            onClick={e => e.stopPropagation()}
            title="Написать email"
          >
            <Mail className="w-5 h-5" />
          </a>
        )}
        {employee.telegram && (
          <a 
            href={`https://t.me/${employee.telegram.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white-custom hover:text-white-hover transition-colors p-2 rounded-full hover:bg-white-hover"
            onClick={e => e.stopPropagation()}
            title="Написать в Telegram"
          >
            <RiTelegram2Line className="w-5 h-5" />
          </a>
        )}
        <button
          className="text-white-custom hover:text-white-hover transition-colors p-2 rounded-full hover:bg-white-hover"
          onClick={e => {
            e.stopPropagation();
            // Здесь можно добавить логику для шаринга
            if (navigator.share) {
              navigator.share({
                title: `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.full_name || employee.name,
                text: `Профиль сотрудника: ${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.full_name || employee.name,
                url: window.location.href
              });
            } else {
              // Fallback для браузеров без Web Share API
              navigator.clipboard.writeText(window.location.href);
            }
          }}
          title="Поделиться"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// Компонент звездочки для компетенций
function StarBullet() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-[6px] min-w-[14px] rounded-[1px]">
      <polygon points="7,1 8.2,5.2 13,7 8.2,8.8 7,13 5.8,8.8 1,7 5.8,5.2" fill="#E42E0F" />
    </svg>
  );
}

// Детальная карточка (UI)
function DetailedCard({ employee, onEdit, showEditButton = false, className = '' }) {
  const navigate = useNavigate();
  
  const handleEdit = () => {
    if (onEdit) onEdit(employee);
    else navigate(`/admin/employees?edit=${employee.id}`);
  };
  
  return (
    <div className={`bg-white/80 rounded-2xl shadow-sm p-6 ${className}`}>
      {/* Заголовок с кнопкой редактирования */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <Avatar
            src={employee.avatar}
            name={employee.name}
            size="3xl"
            roleInDept={employee.roleInDept}
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{employee.name}</h1>
            {employee.position && <p className="text-lg text-gray-600">{employee.position}</p>}
            <TagsBlock employee={employee} variant="detailed" />
          </div>
        </div>
        
        {showEditButton && (
          <button
            onClick={handleEdit}
            className="p-2 rounded-full hover:bg-gray/30 transition"
            title="Редактировать сотрудника"
          >
            <Edit className="w-6 h-6 text-gray-600 hover:text-primary" />
          </button>
        )}
      </div>
      
      {/* Контактная информация */}
      <section className="mb-6">
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
      <section className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Общая информация</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Отдел</p>
              <a href={`/structure?dept=${employee.department}`} className="text-primary hover:underline font-medium">
                {employee.department}
              </a>
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
                <p className="text-sm text-gray-500">Дата приема</p>
                <p className="font-medium">{formatDate(employee.joined)}</p>
              </div>
            </div>
          )}
        </div>
      </section>
      
      {/* Компетенции и навыки */}
      {(employee.competencies?.length > 0 || employee.hardSkills?.length > 0 || employee.softSkills?.length > 0) && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Компетенции и навыки</h2>
          <div className="space-y-4">
            {employee.competencies?.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Компетенции</h3>
                <div className="flex flex-wrap gap-2">
                  {employee.competencies.map((comp, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {comp}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {employee.hardSkills?.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Hard Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {employee.hardSkills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {employee.softSkills?.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Soft Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {employee.softSkills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

// Карточка для печати (A4)
function PrintCard({ employee, className = '' }) {
  return (
    <div className={`bg-white p-8 max-w-[210mm] mx-auto ${className}`}>
      <div className="flex items-start gap-6 mb-6">
        <Avatar
          src={employee.avatar}
          name={employee.name}
          size="3xl"
          roleInDept={employee.roleInDept}
        />
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{employee.name}</h1>
          {employee.position && <p className="text-xl text-gray-600 mb-2">{employee.position}</p>}
          <TagsBlock employee={employee} variant="detailed" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Контактная информация</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{employee.email}</p>
            </div>
            {employee.phone && (
              <div>
                <p className="text-sm text-gray-500">Телефон</p>
                <p className="font-medium">{employee.phone}</p>
              </div>
            )}
            {employee.telegram && (
              <div>
                <p className="text-sm text-gray-500">Telegram</p>
                <p className="font-medium">{employee.telegram}</p>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Общая информация</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Отдел</p>
              <p className="font-medium">{employee.department}</p>
            </div>
            {employee.roleInDept && (
              <div>
                <p className="text-sm text-gray-500">Роль в отделе</p>
                <p className="font-medium">{getRoleText(employee.roleInDept)}</p>
              </div>
            )}
            {employee.birth && (
              <div>
                <p className="text-sm text-gray-500">День рождения</p>
                <p className="font-medium">{formatDate(employee.birth)}</p>
              </div>
            )}
            {employee.joined && (
              <div>
                <p className="text-sm text-gray-500">Дата приема</p>
                <p className="font-medium">{formatDate(employee.joined)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {(employee.competencies?.length > 0 || employee.hardSkills?.length > 0 || employee.softSkills?.length > 0) && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Компетенции и навыки</h2>
          <div className="space-y-4">
            {employee.competencies?.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Компетенции</h3>
                <p className="text-gray-700">{employee.competencies.join(', ')}</p>
              </div>
            )}
            {employee.hardSkills?.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Hard Skills</h3>
                <p className="text-gray-700">{employee.hardSkills.join(', ')}</p>
              </div>
            )}
            {employee.softSkills?.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Soft Skills</h3>
                <p className="text-gray-700">{employee.softSkills.join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Основной компонент EmployeeCard
export default function EmployeeCard({ 
  employee, 
  variant = 'compact', 
  onClick, 
  onEdit, 
  showEditButton = false, 
  className = '' 
}) {
  if (!employee) {
    return <div className="p-4 text-center text-gray-500">Нет данных о сотруднике</div>;
  }
  
  // Определяем, есть ли права на редактирование сотрудников
  const { userData, activeRole } = useAuth();
  const { hasAdminMenu } = useRole();
  
  // Показываем кнопку всем, если showEditButton = true
  const hasEmployeeEditRights = true;
  
  const shouldShowEditButton = showEditButton && hasEmployeeEditRights;
  
  switch (variant) {
    case 'mini':
      return <MiniCard employee={employee} onClick={onClick} className={className} />;
    case 'compact':
      return <CompactCard employee={employee} onClick={onClick} onEdit={onEdit} showEditButton={shouldShowEditButton} className={className} />;
    case 'detailed':
      return <DetailedCard employee={employee} onEdit={onEdit} showEditButton={shouldShowEditButton} className={className} />;
    case 'print':
      return <PrintCard employee={employee} className={className} />;
    default:
      return <CompactCard employee={employee} onClick={onClick} onEdit={onEdit} showEditButton={shouldShowEditButton} className={className} />;
  }
} 