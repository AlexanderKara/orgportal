import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Award, HandMetal, Heart, Users, 
  Filter, Star, TrendingUp, User, Building, Calendar, Clock, BarChart3,
  Trash2, LayoutGrid, Maximize2, Minimize2
} from 'lucide-react';
import Select from 'react-select';
import * as d3 from 'd3';
import { tree, cluster } from 'd3-hierarchy';
import api from '../services/api';

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
    zIndex: 20,
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

const competencyTypes = [
  { id: 'hard', label: 'Хард скиллы', icon: <Award className="w-5 h-5" />, color: '#E3F8FF' },
  { id: 'soft', label: 'Софт скиллы', icon: <HandMetal className="w-5 h-5" />, color: '#FFE5CC' },
  { id: 'hobby', label: 'Хобби', icon: <Heart className="w-5 h-5" />, color: '#F5F5F5' },
];

const treeLayouts = [
  { id: 'radial-tree', label: 'Радиальное дерево' },
  { id: 'radial-cluster', label: 'Радиальная кластеризация' },
  { id: 'tree', label: 'Дерево' },
  { id: 'cluster', label: 'Кластеризация' },
];

const statusSwitcher = [
  { id: 'active', label: 'Активные', icon: <User className="w-4 h-4" /> },
  { id: 'archived', label: 'Архив', icon: <Trash2 className="w-4 h-4" /> },
];

export default function KioskMode() {
  const [treeLayout, setTreeLayout] = useState('radial-tree');
  const [selectedSkillType, setSelectedSkillType] = useState('all');
  const [dataSet, setDataSet] = useState('organization'); // 'organization' или 'skills'
  const [status, setStatus] = useState('active');
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const svgRef = useRef();
  const containerRef = useRef();

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [employeesResponse, departmentsResponse] = await Promise.all([
          api.getEmployees(),
          api.getDepartments()
        ]);
        
        setEmployees(employeesResponse.data || employeesResponse || []);
        setDepartments(departmentsResponse.departments || departmentsResponse.data || departmentsResponse || []);
      } catch (err) {
        console.error('Error loading kiosk data:', err);
        setError(err.message || 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Собираем все компетенции из данных сотрудников
  const allCompetencies = useMemo(() => {
    const competencies = {
      hard: new Map(),
      soft: new Map(),
      hobby: new Map(),
    };

    employees.forEach(employee => {
      // Хард скиллы
      if (employee.hardSkills) {
        employee.hardSkills.forEach(skill => {
          if (!competencies.hard.has(skill.id)) {
            competencies.hard.set(skill.id, {
              ...skill,
              type: 'hard',
              employees: [],
              department: employee.department,
            });
          }
          competencies.hard.get(skill.id).employees.push(employee);
        });
      }

      // Софт скиллы
      if (employee.softSkills) {
        employee.softSkills.forEach(skill => {
          if (!competencies.soft.has(skill.id)) {
            competencies.soft.set(skill.id, {
              ...skill,
              type: 'soft',
              employees: [],
              department: employee.department,
            });
          }
          competencies.soft.get(skill.id).employees.push(employee);
        });
      }

      // Хобби
      if (employee.hobbies) {
        employee.hobbies.forEach(hobby => {
          if (!competencies.hobby.has(hobby.id)) {
            competencies.hobby.set(hobby.id, {
              ...hobby,
              type: 'hobby',
              employees: [],
              department: employee.department,
              group: hobby.group || 'entertainment',
            });
          }
          competencies.hobby.get(hobby.id).employees.push(employee);
        });
      }
    });

    return competencies;
  }, []);

  // Фильтрация компетенций
  const filteredCompetencies = useMemo(() => {
    let all = [];
    
    // Собираем все компетенции в один массив
    Object.values(allCompetencies).forEach(typeMap => {
      typeMap.forEach(competency => {
        all.push(competency);
      });
    });

    // Фильтрация по типу
    if (selectedSkillType !== 'all') {
      all = all.filter(c => c.type === selectedSkillType);
    }

    return all;
  }, [allCompetencies, selectedSkillType]);

  // Создание данных для дерева
  const createTreeData = () => {
    if (dataSet === 'organization') {
      // Организационная структура
      const root = {
        id: 'root',
        name: 'Организация',
        children: []
      };

      // Группируем сотрудников по отделам
      const deptMap = new Map();
      employees.filter(e => e.status === status).forEach(employee => {
        if (!deptMap.has(employee.department)) {
          deptMap.set(employee.department, {
            id: `dept-${employee.department}`,
            name: employee.department,
            children: []
          });
        }
        deptMap.get(employee.department).children.push({
          id: `emp-${employee.id}`,
          name: employee.name,
          department: employee.department,
          type: 'employee',
          skills: [
            ...(employee.hardSkills || []),
            ...(employee.softSkills || []),
            ...(employee.hobbies || [])
          ]
        });
      });

      root.children = Array.from(deptMap.values());
      return root;
    } else {
      // Структура навыков
      const root = {
        id: 'root',
        name: 'Компетенции',
        children: []
      };

      // Группируем по типам навыков
      const typeMap = new Map();
      filteredCompetencies.forEach(competency => {
        const type = competency.type;
        if (!typeMap.has(type)) {
          typeMap.set(type, {
            id: `type-${type}`,
            name: competencyTypes.find(t => t.id === type)?.label || type,
            children: []
          });
        }
        typeMap.get(type).children.push({
          id: `skill-${competency.id}`,
          name: competency.label,
          type: competency.type,
          employees: competency.employees,
          department: competency.department
        });
      });

      root.children = Array.from(typeMap.values());
      return root;
    }
  };

  // D3 диаграмма
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const treeData = createTreeData();
    const root = d3.hierarchy(treeData);

    let layout;
    if (treeLayout === 'radial-tree') {
      layout = tree().size([2 * Math.PI, Math.min(width, height) / 2 - 100]);
    } else if (treeLayout === 'radial-cluster') {
      layout = cluster().size([2 * Math.PI, Math.min(width, height) / 2 - 100]);
    } else if (treeLayout === 'tree') {
      layout = tree().size([height - 100, width - 100]);
    } else {
      layout = cluster().size([height - 100, width - 100]);
    }

    const treeLayoutData = layout(root);

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Связи
    const link = g.selectAll(".link")
      .data(treeLayoutData.links())
      .enter().append("path")
      .attr("class", "link")
      .attr("d", d => {
        if (treeLayout.startsWith('radial')) {
          return d3.linkRadial()
            .angle(d => d.x)
            .radius(d => d.y)(d);
        } else {
          return d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x)(d);
        }
      })
      .style("fill", "none")
      .style("stroke", "#ccc")
      .style("stroke-width", "1px");

    // Узлы
    const node = g.selectAll(".node")
      .data(treeLayoutData.descendants())
      .enter().append("g")
      .attr("class", "node")
      .attr("transform", d => {
        if (treeLayout.startsWith('radial')) {
          return `rotate(${(d.x * 180 / Math.PI - 90)}) translate(${d.y},0)`;
        } else {
          return `translate(${d.y},${d.x})`;
        }
      });

    // Круги узлов
    node.append("circle")
      .attr("r", d => {
        if (d.data.id === 'root') return 20;
        if (d.data.type === 'employee') return 12;
        return 8;
      })
      .style("fill", d => {
        if (d.data.id === 'root') return "#FF8A15";
        if (d.data.type === 'employee') return "#4A90E2";
        return "#7ED321";
      })
      .style("stroke", "#fff")
      .style("stroke-width", "2px");

    // Тексты узлов
    node.append("text")
      .attr("dy", d => {
        if (treeLayout.startsWith('radial')) {
          return d.children ? "-.5em" : ".5em";
        } else {
          return d.children ? "-.5em" : "1em";
        }
      })
      .attr("text-anchor", d => {
        if (treeLayout.startsWith('radial')) {
          return d.children ? "end" : "start";
        } else {
          return "middle";
        }
      })
      .style("font-size", "12px")
      .style("font-weight", "500")
      .style("fill", "#333")
      .text(d => d.data.name)
      .style("text-shadow", "0 1px 2px rgba(255,255,255,0.8)");

  }, [treeLayout, dataSet, selectedSkillType, status]);

  return (
    <div className="w-screen h-screen bg-gray-100 flex flex-col">
      {/* Верхняя панель управления */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Kiosk Mode - Компетенции</h1>
          
          <div className="flex items-center gap-4">
            {/* Переключатель активные/архив */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {statusSwitcher.map(item => (
                <button
                  key={item.id}
                  onClick={() => setStatus(item.id)}
                  className={`flex items-center justify-center px-2 lg:px-3 py-1.5 rounded text-sm font-medium transition-colors w-[40px] h-[40px] lg:w-auto lg:h-auto ${
                    status === item.id
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-center w-full h-full">
                    {item.icon}
                    <span className="hidden lg:inline lg:ml-1">{item.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Переключатель набора данных */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setDataSet('organization')}
                className={`flex items-center justify-center px-2 lg:px-3 py-1.5 rounded text-sm font-medium transition-colors w-[40px] h-[40px] lg:w-auto lg:h-auto ${
                  dataSet === 'organization'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center justify-center w-full h-full">
                  <Building className="w-4 h-4" />
                  <span className="hidden lg:inline lg:ml-1">Организация</span>
                </div>
              </button>
              <button
                onClick={() => setDataSet('skills')}
                className={`flex items-center justify-center px-2 lg:px-3 py-1.5 rounded text-sm font-medium transition-colors w-[40px] h-[40px] lg:w-auto lg:h-auto ${
                  dataSet === 'skills'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center justify-center w-full h-full">
                  <Award className="w-4 h-4" />
                  <span className="hidden lg:inline lg:ml-1">Навыки</span>
                </div>
              </button>
            </div>

            {/* Переключатель типов навыков */}
            {dataSet === 'skills' && (
              <Select
                placeholder="Тип навыков"
                value={selectedSkillType === 'all' ? null : { value: selectedSkillType, label: competencyTypes.find(t => t.id === selectedSkillType)?.label }}
                onChange={(option) => setSelectedSkillType(option ? option.value : 'all')}
                options={competencyTypes.map(type => ({ value: type.id, label: type.label }))}
                styles={customSelectStyles}
                className="w-48"
              />
            )}

            {/* Переключатель layout */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {treeLayouts.map(layout => (
                <button
                  key={layout.id}
                  onClick={() => setTreeLayout(layout.id)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    treeLayout === layout.id
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {layout.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Диаграмма */}
      <div className="flex-1 p-4" ref={containerRef}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          style={{ minHeight: '600px' }}
        />
      </div>
    </div>
  );
} 