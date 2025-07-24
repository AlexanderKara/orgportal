import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, HandMetal, Heart, Users } from 'lucide-react';
import api from '../services/api';

const competencyTypes = [
  { id: 'hard', label: 'Хард скиллы', icon: <Award className="w-5 h-5" />, color: '#E3F8FF' },
  { id: 'soft', label: 'Софт скиллы', icon: <HandMetal className="w-5 h-5" />, color: '#FFE5CC' },
  { id: 'hobby', label: 'Хобби', icon: <Heart className="w-5 h-5" />, color: '#F5F5F5' },
];

const hobbyGroups = [
  { id: 'family', label: 'Семья', color: '#FFE5CC' },
  { id: 'entertainment', label: 'Развлечения', color: '#E3F8FF' },
  { id: 'active', label: 'Активный отдых', color: '#F0F0F0' },
  { id: 'self-development', label: 'Саморазвитие', color: '#FFF3E0' },
  { id: 'creativity', label: 'Творчество', color: '#F5F5F5' },
];

export default function CompetencyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [competency, setCompetency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const employeesResponse = await api.getEmployees();
        const employeesData = employeesResponse.data || employeesResponse || [];
        setEmployees(employeesData);
        
        // Находим навык по ID
        let foundCompetency = null;
        
        employeesData.forEach(employee => {
          // Ищем в хард скиллах
          if (employee.hardSkills) {
            const hardSkill = employee.hardSkills.find(skill => skill.id === parseInt(id));
            if (hardSkill) {
              if (!foundCompetency) {
                foundCompetency = {
                  ...hardSkill,
                  type: 'hard',
                  employees: [],
                };
              }
              foundCompetency.employees.push(employee);
            }
          }

          // Ищем в софт скиллах
          if (employee.softSkills) {
            const softSkill = employee.softSkills.find(skill => skill.id === parseInt(id));
            if (softSkill) {
              if (!foundCompetency) {
                foundCompetency = {
                  ...softSkill,
                  type: 'soft',
                  employees: [],
                };
              }
              foundCompetency.employees.push(employee);
            }
          }

          // Ищем в хобби
          if (employee.hobbies) {
            const hobby = employee.hobbies.find(hobby => hobby.id === parseInt(id));
            if (hobby) {
              if (!foundCompetency) {
                foundCompetency = {
                  ...hobby,
                  type: 'hobby',
                  employees: [],
                  group: hobby.group || 'entertainment',
                };
              }
              foundCompetency.employees.push(employee);
            }
          }
        });
        
        setCompetency(foundCompetency);
      } catch (err) {
        console.error('Error loading competency data:', err);
        setError(err.message || 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="w-full max-w-none mx-auto pt-[70px]">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка данных...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-none mx-auto pt-[70px]">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-2">⚠️</div>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!competency) {
    return (
      <div className="w-full max-w-none mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between py-8 border-b border-gray/30 sticky top-0 bg-white z-10 px-4 sm:px-10">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold font-accent text-primary">Профиль навыка</span>
          </div>
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray/30 transition" title="Назад">
            <ArrowLeft className="w-8 h-8 text-dark" />
          </button>
        </div>
        <div className="p-8 text-center text-gray-500">Навык не найден</div>
      </div>
    );
  }

  const competencyType = competencyTypes.find(t => t.id === competency.type);
  const hobbyGroup = competency.type === 'hobby' ? hobbyGroups.find(g => g.id === competency.group) : null;

  return (
    <div className="w-full max-w-none mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between py-8 border-b border-gray/30 sticky top-0 bg-white z-10 px-4 sm:px-10">
        <div className="flex items-center gap-3">
          <Award className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold font-accent text-primary">Профиль навыка</span>
        </div>
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray/30 transition" title="Назад">
          <ArrowLeft className="w-8 h-8 text-dark" />
        </button>
      </div>
      
      {/* Двухколоночный layout */}
      <div className="flex flex-col md:flex-row gap-4 sm:gap-12 py-8 sm:py-12 w-full max-w-full md:max-w-6xl mx-auto px-4 sm:px-8">
        {/* Левая часть: Иконка и тип */}
        <aside className="md:w-1/3 max-w-full md:max-w-xs min-w-0 md:min-w-[260px] flex flex-col items-center bg-white/80 rounded-2xl shadow-sm py-8 sm:py-14 px-2 sm:px-8 mb-8 md:mb-0">
          <div
            className="w-[90px] h-[90px] sm:w-[130px] sm:h-[130px] rounded-full flex items-center justify-center mb-3 sm:mb-5"
            style={{ backgroundColor: competencyType?.color || '#F0F0F0' }}
          >
            <div className="w-[45px] h-[45px] sm:w-[65px] sm:h-[65px]">
              {competencyType?.icon}
            </div>
          </div>
          <div className="font-bold text-2xl font-accent text-primary text-center mb-4 mt-6">{competency.label}</div>
          <div className="text-lg text-gray-500 text-center mb-2">{competencyType?.label}</div>
          {hobbyGroup && (
            <div className="text-sm text-gray-400 text-center">{hobbyGroup.label}</div>
          )}
        </aside>
        
        {/* Правая часть: Main content */}
        <main className="flex-1 flex flex-col gap-8">
          {/* Группа навыков */}
          <section className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-600">Группа навыков:</span>
              <span className="text-sm text-gray-700">{competencyType?.label}</span>
            </div>
          </section>
          
          {/* Статистика */}
          <section className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-600">Сотрудников с навыком: {competency.employees.length}</span>
            </div>
          </section>
          
          {/* Список сотрудников */}
          <section className="mb-2">
            <div className="text-xs text-gray-400 mb-1">Сотрудники с этим навыком:</div>
            <div className="flex flex-wrap gap-2">
              {competency.employees.length === 0 ? (
                <span className="text-gray-400 text-xs">Нет сотрудников</span>
              ) : (
                competency.employees.map((employee) => (
                  <span 
                    key={employee.id} 
                    className="flex items-center gap-1 text-xs bg-gray/30 rounded-[8px] px-2 py-0.5 cursor-pointer hover:bg-primary/10"
                    onClick={() => navigate(`/employee/${employee.id}`)}
                  >
                    <Users className="w-3 h-3 text-primary" />
                    {employee.name}
                  </span>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
} 