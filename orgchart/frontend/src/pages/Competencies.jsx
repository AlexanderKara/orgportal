import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Award, HandMetal, Heart, Search, SortAsc, SortDesc, Users, 
  Filter, Star, TrendingUp, User, Building, Calendar, Clock, BarChart3,
  Trash2, LayoutGrid, Maximize2, Minimize2, Plus, Edit, ListFilter
} from 'lucide-react';
import Select from 'react-select';
import * as d3 from 'd3';
import { tree, cluster } from 'd3-hierarchy';
import SkillLevelModal from '../components/SkillLevelModal';
import Avatar from '../components/ui/Avatar';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../components/RoleProvider';

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

const hobbyGroups = [
  { id: 'family', label: 'Семья', color: '#FFE5CC' },
  { id: 'entertainment', label: 'Развлечения', color: '#E3F8FF' },
  { id: 'active', label: 'Активный отдых', color: '#F0F0F0' },
  { id: 'self-development', label: 'Саморазвитие', color: '#FFF3E0' },
  { id: 'creativity', label: 'Творчество', color: '#F5F5F5' },
];

const sortOptions = [
  { id: 'name', label: 'По названию', icon: <SortAsc className="w-4 h-4" /> },
  { id: 'popularity', label: 'По популярности', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'type', label: 'По типу', icon: <Filter className="w-4 h-4" /> },
];

const viewOptions = [
  { id: 'cards', label: 'Карточки', icon: <LayoutGrid className="w-4 h-4" /> },
  { id: 'chart', label: 'Диаграмма', icon: <BarChart3 className="w-4 h-4" /> },
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

export default function Competencies() {
  const navigate = useNavigate();
  const { view: urlView } = useParams();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedHobbyGroup, setSelectedHobbyGroup] = useState(null);
  const [sortBy, setSortBy] = useState('popularity');
  const [sortDirection, setSortDirection] = useState('desc');
  const [view, setView] = useState(urlView || 'cards');
  const [status, setStatus] = useState('active');
  const [treeLayout, setTreeLayout] = useState(() => {
    const saved = localStorage.getItem('competencies-treeLayout');
    return saved || 'radial-tree';
  });
  const [selectedSkillType, setSelectedSkillType] = useState(() => {
    const saved = localStorage.getItem('competencies-selectedSkillType');
    return saved || 'all';
  });
  const [dataSet, setDataSet] = useState(() => {
    const saved = localStorage.getItem('competencies-dataSet');
    return saved || 'organization';
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Состояние для реальных данных
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const svgRef = useRef();
  const containerRef = useRef();

  const { userData } = useAuth();
  const { activeRole } = useRole();
  
  // Определяем, есть ли кнопка администрирования
  const hasAdminMenu = (() => {
    const hasAdminRoles = userData?.adminRoles && userData.adminRoles.length > 0;
    const isAdminRoleActive = hasAdminRoles && activeRole && userData.adminRoles.some(role => role.id.toString() === activeRole);
    const activeRoleData = hasAdminRoles && activeRole ? userData.adminRoles.find(role => role.id.toString() === activeRole) : null;
    const hasAdminPermissions = activeRoleData && (
      activeRoleData.name === 'Главный администратор' ||
      (activeRoleData.permissions && activeRoleData.permissions.some(permission => {
        const adminModules = ['employees', 'departments', 'skills', 'skillGroups', 'products', 'vacations', 'roles', 'system'];
        return adminModules.includes(permission);
      }))
    );
    return hasAdminRoles && activeRole && isAdminRoleActive && hasAdminPermissions;
  })();
  
  // Загрузка данных из API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Загружаем сотрудников, отделы и навыки параллельно
        const [employeesResponse, departmentsResponse, skillsResponse] = await Promise.all([
          api.getEmployees(),
          api.getDepartments(),
          api.getSkills()
        ]);

        // Извлекаем данные из ответов API
        const employeesData = employeesResponse.data || employeesResponse;
        const departmentsData = departmentsResponse.departments || departmentsResponse.data || departmentsResponse;
        const skillsData = skillsResponse.skills || skillsResponse.data || skillsResponse;

        // Проверяем, что данные являются массивами
        if (!Array.isArray(employeesData)) {
          console.warn('Employees data is not an array:', employeesData);
        }
        if (!Array.isArray(departmentsData)) {
          console.warn('Departments data is not an array:', departmentsData);
        }
        if (!Array.isArray(skillsData)) {
          console.warn('Skills data is not an array:', skillsData);
        }

        setEmployees(Array.isArray(employeesData) ? employeesData : []);
        setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
        setSkills(Array.isArray(skillsData) ? skillsData : []);
      } catch (err) {
        console.error('Error loading competencies data:', err);
        setError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Синхронизация URL с состоянием view
  useEffect(() => {
    if (urlView && urlView !== view) {
      setView(urlView);
    }
  }, [urlView, view]);

  // Обновление URL при изменении view
  const handleViewChange = (newView) => {
    setView(newView);
    if (newView === 'cards') {
      navigate('/competencies');
    } else {
      navigate(`/competencies/${newView}`);
    }
  };

  // Сохранение настроек D3 диаграммы в localStorage
  useEffect(() => {
    localStorage.setItem('competencies-treeLayout', treeLayout);
  }, [treeLayout]);

  useEffect(() => {
    localStorage.setItem('competencies-selectedSkillType', selectedSkillType);
  }, [selectedSkillType]);

  useEffect(() => {
    localStorage.setItem('competencies-dataSet', dataSet);
  }, [dataSet]);

  // Собираем все компетенции из данных сотрудников
  const allCompetencies = useMemo(() => {
    const competencies = {
      hard: new Map(),
      soft: new Map(),
      hobby: new Map(),
    };

    employees.forEach(employee => {
      // Обрабатываем навыки сотрудника
      if (employee.employeeSkills) {
        employee.employeeSkills.forEach(employeeSkill => {
          const skill = employeeSkill.skill;
          const category = skill.skill_type;
          
          // Определяем тип компетенции на основе категории
          let type;
          switch (category) {
            case 'hard':
              type = 'hard';
              break;
            case 'soft':
              type = 'soft';
              break;
            case 'hobby':
              type = 'hobby';
              break;
            default:
              type = 'hard'; // По умолчанию
          }

          if (!competencies[type].has(skill.id)) {
            competencies[type].set(skill.id, {
              id: skill.id,
              label: skill.name,
              color: skill.color || '#E3F8FF',
              type: type,
              employees: [],
              department: employee.department?.name || 'Не назначен',
              level: employeeSkill.level,
              verified: employeeSkill.verified,
            });
          }
          
          const competency = competencies[type].get(skill.id);
          competency.employees.push({
            id: employee.id,
            name: `${employee.first_name} ${employee.last_name}`,
            avatar: employee.avatar,
            department: employee.department?.name,
            level: employeeSkill.level,
            verified: employeeSkill.verified,
          });
        });
      }
    });

    return competencies;
  }, [employees]);

  // Фильтрация и сортировка компетенций
  const filteredCompetencies = useMemo(() => {
    let all = [];
    
    // Собираем все компетенции в один массив
    Object.values(allCompetencies).forEach(typeMap => {
      typeMap.forEach(competency => {
        all.push(competency);
      });
    });

    // Фильтрация по поиску
    if (search.trim()) {
      all = all.filter(c => 
        c.label.toLowerCase().includes(search.trim().toLowerCase())
      );
    }

    // Фильтрация по типу
    if (selectedType) {
      all = all.filter(c => c.type === selectedType.value);
    }

    // Фильтрация по отделу
    if (selectedDepartment) {
      all = all.filter(c => 
        c.employees.some(e => e.department === selectedDepartment.value)
      );
    }

    // Фильтрация по группе хобби
    if (selectedHobbyGroup) {
      all = all.filter(c => c.type === 'hobby' && c.group === selectedHobbyGroup.value);
    }

    // Сортировка
    all.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return sortDirection === 'asc' 
            ? a.label.localeCompare(b.label)
            : b.label.localeCompare(a.label);
        case 'popularity':
          return sortDirection === 'asc'
            ? a.employees.length - b.employees.length
            : b.employees.length - a.employees.length;
        case 'type':
          return sortDirection === 'asc'
            ? a.type.localeCompare(b.type)
            : b.type.localeCompare(a.type);
        default:
          return 0;
      }
    });

    return all;
  }, [allCompetencies, search, selectedType, selectedDepartment, selectedHobbyGroup, sortBy, sortDirection]);

  // Статистика
  const stats = useMemo(() => {
    const total = filteredCompetencies.length;
    const byType = {
      hard: filteredCompetencies.filter(c => c.type === 'hard').length,
      soft: filteredCompetencies.filter(c => c.type === 'soft').length,
      hobby: filteredCompetencies.filter(c => c.type === 'hobby').length,
    };
    const totalEmployees = new Set(
      filteredCompetencies.flatMap(c => c.employees.map(e => e.id))
    ).size;

    return { total, byType, totalEmployees };
  }, [filteredCompetencies]);

  // Опции для фильтров
  const departmentOptions = useMemo(() => {
    const deps = new Set(employees.map(e => e.department?.name));
    return Array.from(deps).map(dept => ({ value: dept, label: dept }));
  }, [employees]);

  const typeOptions = competencyTypes.map(type => ({ value: type.id, label: type.label }));
  const hobbyGroupOptions = hobbyGroups.map(group => ({ value: group.id, label: group.label }));

  // ===== ПРОСТАЯ ВЕРСИЯ КАК В РЕФЕРЕНСЕ =====
  
  // Глобальные переменные D3 (современный D3)
  let width = 800, height = 800;
  let diameter = 600;
  let duration = 2000;
  let root, nodes, links;
  let svg, link, node;
  let treeLayoutInstance, clusterLayoutInstance, radialTreeLayoutInstance, radialClusterLayoutInstance;
  let diagonal, radialDiagonal;

  // Обработка состояния загрузки
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Загрузка компетенций...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Обработка ошибок
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Ошибка загрузки</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Функция изменения layout'а (буквально как в референсе)
  const change = function() {
    if (this.value === "radial-tree") {
      transitionToRadialTree();
      setTreeLayout("radial-tree");
    } else if (this.value === "radial-cluster") {
      transitionToRadialCluster();
      setTreeLayout("radial-cluster");
    } else if (this.value === "tree") {
      transitionToTree();
      setTreeLayout("tree");
    } else if (this.value === "cluster") {
      transitionToCluster();
      setTreeLayout("cluster");
    }
  };

  // Radial Tree Transition (современный D3)
  const transitionToRadialTree = function() {
    const nodes = radialTreeLayoutInstance(root);
      const links = nodes.links();

    svg.transition().duration(duration)
      .attr("transform", "translate(" + (width/2) + "," + (height/2) + ")");

        link.data(links)
          .transition()
          .duration(duration)
          .attr("stroke", "#fc8d62")
          .attr("d", radialDiagonal);

        node.data(nodes.descendants())
          .transition()
          .duration(duration)
      .attr("transform", function(d) {
        return "translate(" + (d.y * Math.cos((d.x - 90) * Math.PI / 180)) + "," + (d.y * Math.sin((d.x - 90) * Math.PI / 180)) + ")";
      });
        
        // Обновляем поворот текста для радиальных лэйаутов
        node.selectAll("text").transition().duration(duration)
          .attrTween("transform", function(d) {
            if ((treeLayout === 'radial-tree' || treeLayout === 'radial-cluster') && 
                ((dataSet === 'organization' && d.data.type === 'skill') || 
                 (dataSet === 'skills' && d.data.type === 'employee'))) {
              const angle = (d.x - 90) * Math.PI / 180;
              const rotation = angle * 180 / Math.PI;
              return `rotate(${rotation})`;
            }
            return null;
          })
          .attrTween("text-anchor", function(d) {
            if ((treeLayout === 'radial-tree' || treeLayout === 'radial-cluster') && 
                ((dataSet === 'organization' && d.data.type === 'skill') || 
                 (dataSet === 'skills' && d.data.type === 'employee'))) {
              // Всегда устанавливаем text-anchor в "start" для радиальных лэйаутов
              // чтобы текст всегда был ориентирован "наружу" от центра
              return "start";
            }
            return null;
          });

        // Обновляем поворот подложек для радиальных лэйаутов
        node.selectAll("rect").transition().duration(duration)
          .attrTween("transform", function(d) {
            if ((treeLayout === 'radial-tree' || treeLayout === 'radial-cluster') && 
                ((dataSet === 'organization' && d.data.type === 'skill') || 
                 (dataSet === 'skills' && d.data.type === 'employee'))) {
              const angle = (d.x - 90) * Math.PI / 180;
              const rotation = angle * 180 / Math.PI;
              return `rotate(${rotation})`;
            }
            return null;
          });

        node.select("circle")
          .transition()
          .duration(duration)
          .attr("stroke", "#984ea3")
          .attr("fill", function(d) {
            if (d.data.type === "employee") return "#FF8A15";
            if (d.depth === 0) return "#FF8A15";
            return "gray";
          })
          .attr("r", function(d) {
            if (d.data.type === "employee") return 12.5;
            if (d.depth === 0) return 20;
            return 6;
          });
  };

  // Radial Cluster Transition (современный D3)
  const transitionToRadialCluster = function() {
    const nodes = radialClusterLayoutInstance(root);
        const links = nodes.links();

    svg.transition().duration(duration)
      .attr("transform", "translate(" + (width/2) + "," + (height/2) + ")");

        link.data(links)
          .transition()
          .duration(duration)
          .attr("stroke", "#66c2a5")
          .attr("d", radialDiagonal);

        node.data(nodes.descendants())
          .transition()
          .duration(duration)
      .attr("transform", function(d) {
        return "translate(" + (d.y * Math.cos((d.x - 90) * Math.PI / 180)) + "," + (d.y * Math.sin((d.x - 90) * Math.PI / 180)) + ")";
      });
        
        // Обновляем поворот текста для радиальных лэйаутов
        node.selectAll("text").transition().duration(duration)
          .attrTween("transform", function(d) {
            if ((treeLayout === 'radial-tree' || treeLayout === 'radial-cluster') && 
                ((dataSet === 'organization' && d.data.type === 'skill') || 
                 (dataSet === 'skills' && d.data.type === 'employee'))) {
              const angle = (d.x - 90) * Math.PI / 180;
              const rotation = angle * 180 / Math.PI;
              return `rotate(${rotation})`;
            }
            return null;
          })
          .attrTween("text-anchor", function(d) {
            if ((treeLayout === 'radial-tree' || treeLayout === 'radial-cluster') && 
                ((dataSet === 'organization' && d.data.type === 'skill') || 
                 (dataSet === 'skills' && d.data.type === 'employee'))) {
              // Всегда устанавливаем text-anchor в "start" для радиальных лэйаутов
              // чтобы текст всегда был ориентирован "наружу" от центра
              return "start";
            }
            return null;
          });

        // Обновляем поворот подложек для радиальных лэйаутов
        node.selectAll("rect").transition().duration(duration)
          .attrTween("transform", function(d) {
            if ((treeLayout === 'radial-tree' || treeLayout === 'radial-cluster') && 
                ((dataSet === 'organization' && d.data.type === 'skill') || 
                 (dataSet === 'skills' && d.data.type === 'employee'))) {
              const angle = (d.x - 90) * Math.PI / 180;
              const rotation = angle * 180 / Math.PI;
              return `rotate(${rotation})`;
            }
            return null;
          });

        node.select("circle")
          .transition()
          .duration(duration)
          .attr("stroke", "#4daf4a")
          .attr("fill", function(d) {
            if (d.data.type === "employee") return "#FF8A15";
            if (d.depth === 0) return "#FF8A15";
            return "gray";
          })
          .attr("r", function(d) {
            if (d.data.type === "employee") return 12.5;
            if (d.depth === 0) return 20;
            return 6;
          });
  };

  // Tree Transition (современный D3)
  const transitionToTree = function() {
    const nodes = treeLayoutInstance(root);
        const links = nodes.links();

    svg.transition().duration(duration)
          .attr("transform", "translate(40,0)");

        link.data(links)
          .transition()
          .duration(duration)
          .attr("stroke", "#e78ac3")
          .attr("d", diagonal);

        node.data(nodes.descendants())
          .transition()
          .duration(duration)
      .attr("transform", function(d) {
        return "translate(" + d.y + "," + d.x + ")";
      });

        // Сбрасываем поворот подложек для обычных layout'ов
        node.selectAll("rect").transition().duration(duration)
          .attr("transform", null);

        node.select("circle")
          .transition()
          .duration(duration)
          .attr("stroke", "#e78ac3")
          .attr("fill", function(d) {
            if (d.data.type === "employee") return "#FF8A15";
            if (d.depth === 0) return "#FF8A15";
            return "gray";
          })
          .attr("r", function(d) {
            if (d.data.type === "employee") return 12.5;
            if (d.depth === 0) return 20;
            return 6;
          });
  };

  // Cluster Transition (современный D3)
  const transitionToCluster = function() {
    const nodes = clusterLayoutInstance(root);
        const links = nodes.links();

    svg.transition().duration(duration)
          .attr("transform", "translate(40,0)");

        link.data(links)
          .transition()
          .duration(duration)
          .attr("stroke", "#8da0cb")
          .attr("d", diagonal);

        node.data(nodes.descendants())
          .transition()
          .duration(duration)
      .attr("transform", function(d) {
        return "translate(" + d.y + "," + d.x + ")";
      });

        // Сбрасываем поворот подложек для обычных layout'ов
        node.selectAll("rect").transition().duration(duration)
          .attr("transform", null);

        node.select("circle")
          .transition()
          .duration(duration)
          .attr("stroke", "#8da0cb")
          .attr("fill", function(d) {
            if (d.data.type === "employee") return "#FF8A15";
            if (d.depth === 0) return "#FF8A15";
            return "gray";
          })
          .attr("r", function(d) {
            if (d.data.type === "employee") return 12.5;
            if (d.depth === 0) return 20;
            return 6;
          });
  };

  // Компонент D3.js дерева (простая версия как в референсе)
  const TreeView = () => {
    useEffect(() => {
      if (!svgRef.current || view !== 'chart' || svg) return;
      if (loading || !Array.isArray(departments) || !Array.isArray(employees)) return;

      // Устанавливаем размеры контейнера и svg явно
      if (containerRef.current) {
        containerRef.current.style.minHeight = '600px';
        containerRef.current.style.minWidth = '600px';
      }
      const svgElement = d3.select(svgRef.current);
      svgElement.selectAll("*").remove();
      svgElement.attr("width", 800).attr("height", 600);

      const width = 800;
      const height = 600;

      // Создаем данные в зависимости от выбранного набора
      const createTreeData = () => {
        // Проверяем, что departments и employees являются массивами
        const departmentsArray = Array.isArray(departments) ? departments : [];
        const employeesArray = Array.isArray(employees) ? employees : [];
        
        if (dataSet === 'organization') {
          // Организация - отделы - сотрудники - навыки
          return {
            name: "Организация",
            children: departmentsArray.map(dept => ({
              name: dept.name,
              type: "department",
              children: employeesArray
                .filter(emp => emp.department?.name === dept.name && emp.status === status)
                .map(emp => ({
                  name: emp.first_name + ' ' + emp.last_name,
                  type: "employee",
                  employee: emp,
                  children: [
                    ...(emp.employeeSkills || []).filter(skill => selectedSkillType === 'all' || skill.skill.skill_type === 'hard').map(skill => ({
                      name: skill.skill.name,
                      type: "skill",
                      skillType: "hard",
                      skill: skill.skill,
                      level: skill.level,
                      verified: skill.verified
                    })),
                    ...(emp.employeeSkills || []).filter(skill => selectedSkillType === 'all' || skill.skill.skill_type === 'soft').map(skill => ({
                      name: skill.skill.name,
                      type: "skill",
                      skillType: "soft",
                      skill: skill.skill,
                      level: skill.level,
                      verified: skill.verified
                    })),
                    ...(emp.employeeSkills || []).filter(skill => selectedSkillType === 'all' || skill.skill.skill_type === 'hobby').map(skill => ({
                      name: skill.skill.name,
                      type: "skill",
                      skillType: "hobby",
                      skill: skill.skill,
                      level: skill.level,
                      verified: skill.verified
                    }))
                  ].filter(child => child.name)
                }))
                .filter(emp => emp.children.length > 0)
            }))
            .filter(dept => dept.children.length > 0)
          };
        } else {
          // Организация - типы навыков - группы навыков - навыки - сотрудники
          const competencyTypesArray = Array.isArray(competencyTypes) ? competencyTypes : [];
          const hobbyGroupsArray = Array.isArray(hobbyGroups) ? hobbyGroups : [];
          
          return {
            name: "Организация",
            children: competencyTypesArray.map(type => ({
              name: type.label,
              type: "skillType",
              children: type.id === 'hobby' ? 
                // Для хобби используем группы
                hobbyGroupsArray.map(group => ({
                  name: group.label,
                  type: "hobbyGroup",
                  children: Array.from((allCompetencies?.hobby || new Map()).values())
                    .filter(hobby => hobby.group === group.id)
                    .map(hobby => ({
                      name: hobby.label,
                      type: "skill",
                      skillType: "hobby",
                      skill: hobby,
                      children: (hobby.employees || []).map(emp => ({
                        name: emp.name,
                        type: "employee",
                        employee: emp
                      }))
                    }))
                    .filter(hobby => hobby.children.length > 0)
                })).filter(group => group.children.length > 0) :
                // Для hard и soft навыков
                [{
                  name: "Все навыки",
                  type: "skillGroup",
                  children: Array.from((allCompetencies?.[type.id] || new Map()).values())
                    .map(skill => ({
                      name: skill.label,
                      type: "skill",
                      skillType: type.id,
                      skill: skill,
                      children: (skill.employees || []).map(emp => ({
                        name: emp.name,
                        type: "employee",
                        employee: emp
                      }))
                    }))
                    .filter(skill => skill.children.length > 0)
                }].filter(group => group.children.length > 0)
            }))
            .filter(type => type.children.length > 0)
          };
        }
      };

      const treeData = createTreeData();
      if (!treeData.children || treeData.children.length === 0) {
        svgElement.append('text')
          .attr('x', width / 2)
          .attr('y', height / 2)
          .attr('text-anchor', 'middle')
          .attr('fill', '#aaa')
          .attr('font-size', 24)
          .text('Нет данных для отображения');
        return;
      }

      // Создаем корень (создаем иерархию D3)
      root = d3.hierarchy(treeData);
      root.x0 = height / 2;
      root.y0 = 0;

      // Создаем layout'ы (современный D3)
      treeLayoutInstance = tree().size([height, width - 160]);
      clusterLayoutInstance = cluster().size([height, width - 160]);
      radialTreeLayoutInstance = tree().size([360, Math.min(width, height) / 2 - 120]);
      radialClusterLayoutInstance = cluster().size([360, Math.min(width, height) / 2 - 120]);

      // Создаем диагонали (современный D3)
      diagonal = d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x);

      radialDiagonal = d3.linkRadial()
        .angle(d => d.x / 180 * Math.PI)
        .radius(d => d.y);

      // Очищаем SVG перед созданием новой диаграммы
      svgElement.selectAll("*").remove();
      
      // Создаем SVG группу (как в референсе)
      svg = svgElement.append("g")
        .attr("transform", "translate(40,0)");

      // Начальный layout - используем текущий treeLayout
      let nodes, links;
      if (treeLayout === 'radial-tree') {
        nodes = radialTreeLayoutInstance(root);
        links = nodes.links();
        svg.attr("transform", "translate(" + (width/2) + "," + (height/2) + ")");
        link = svg.selectAll(".link")
        .data(links)
        .enter().append("path")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", "#fc8d62")
        .attr("stroke-width", 1.5)
        .attr("d", radialDiagonal);
        node = svg.selectAll(".node")
        .data(nodes.descendants())
        .enter().append("g")
        .attr("class", "node")
          .attr("transform", function(d) {
            return "translate(" + (d.y * Math.cos((d.x - 90) * Math.PI / 180)) + "," + (d.y * Math.sin((d.x - 90) * Math.PI / 180)) + ")";
          });
      } else if (treeLayout === 'radial-cluster') {
        nodes = radialClusterLayoutInstance(root);
        links = nodes.links();
        svg.attr("transform", "translate(" + (width/2) + "," + (height/2) + ")");
        link = svg.selectAll(".link")
          .data(links)
          .enter().append("path")
          .attr("class", "link")
          .attr("fill", "none")
          .attr("stroke", "#66c2a5")
          .attr("stroke-width", 1.5)
          .attr("d", radialDiagonal);
        node = svg.selectAll(".node")
          .data(nodes.descendants())
          .enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) {
            return "translate(" + (d.y * Math.cos((d.x - 90) * Math.PI / 180)) + "," + (d.y * Math.sin((d.x - 90) * Math.PI / 180)) + ")";
          });
      } else if (treeLayout === 'tree') {
        nodes = treeLayoutInstance(root);
        links = nodes.links();
        svg.attr("transform", "translate(40,0)");
        link = svg.selectAll(".link")
          .data(links)
          .enter().append("path")
          .attr("class", "link")
          .attr("fill", "none")
          .attr("stroke", "#e78ac3")
          .attr("stroke-width", 1.5)
          .attr("d", diagonal);
        node = svg.selectAll(".node")
          .data(nodes.descendants())
          .enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });
      } else {
        // cluster по умолчанию
        nodes = clusterLayoutInstance(root);
        links = nodes.links();
        svg.attr("transform", "translate(40,0)");
        link = svg.selectAll(".link")
          .data(links)
          .enter().append("path")
          .attr("class", "link")
          .attr("fill", "none")
          .attr("stroke", "#8da0cb")
          .attr("stroke-width", 1.5)
          .attr("d", diagonal);
        node = svg.selectAll(".node")
          .data(nodes.descendants())
          .enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });
      }
      
      // Добавляем узлы с разными размерами и стилями
      node.each(function(d) {
        const nodeGroup = d3.select(this);
        
        // Определяем размер узла в зависимости от типа
        let nodeRadius;
        let nodeFill;
        let nodeStroke;
        let nodeStrokeWidth;
        
        if (d.data.type === "employee") {
          // Узлы сотрудников - 25x25 с аватарами
          nodeRadius = 12.5;
          nodeFill = "#FF8A15";
          nodeStroke = "#FF8A15";
          nodeStrokeWidth = 2;
        } else if (d.depth === 0) {
          // Корневой узел - 40x40 с логотипом
          nodeRadius = 20;
          nodeFill = "#FF8A15";
          nodeStroke = "#FF8A15";
          nodeStrokeWidth = 2;
        } else {
          // Остальные узлы - стандартный размер
          nodeRadius = 6;
          nodeFill = "gray";
          nodeStroke = "#e78ac3";
          nodeStrokeWidth = 1.5;
        }
        
        // Создаем круг узла
        const circle = nodeGroup.append("circle")
          .attr("r", nodeRadius)
          .attr("fill", nodeFill)
          .attr("stroke", nodeStroke)
          .attr("stroke-width", nodeStrokeWidth);
        
        // Для корневого узла добавляем логотип
        if (d.depth === 0) {
          nodeGroup.append("image")
            .attr("x", -20)
            .attr("y", -20)
            .attr("width", 40)
            .attr("height", 40)
            .attr("href", "/src/res/A_logo.svg");
        }
        
        // Для узлов сотрудников добавляем аватар или инициалы
        if (d.data.type === "employee" && d.data.employee) {
          const employee = d.data.employee;
          if (employee.avatar) {
            // Если есть аватар, создаем image
            nodeGroup.append("image")
              .attr("x", -12.5)
              .attr("y", -12.5)
              .attr("width", 25)
              .attr("height", 25)
              .attr("href", employee.avatar)
              .attr("clip-path", "circle(12.5px at 12.5px 12.5px)");
          } else {
            // Если нет аватара, показываем инициалы
            nodeGroup.append("text")
        .attr("text-anchor", "middle")
              .attr("dy", "0.35em")
              .attr("fill", "white")
              .attr("font-size", "10px")
        .attr("font-weight", "bold")
              .text(employee.name ? employee.name.split(' ').map(n => n[0]).join('') : '—');
          }
        }
        
        // Добавляем кликабельность для узлов сотрудников
        if (d.data.type === "employee" && d.data.employee) {
          nodeGroup
            .style("cursor", "pointer")
            .on("click", function() {
            navigate(`/employee/${d.data.employee.id}`);
            });
        }
      });

      // Добавляем текст к узлам с полупрозрачной подложкой
      node.each(function(d) {
        const nodeGroup = d3.select(this);
        
        // Пропускаем корневой узел (у него нет подписи)
        if (d.depth === 0) return;
        
        // Создаем группу для текста
        const textGroup = nodeGroup.append("g");
        
        // Определяем позицию текста в зависимости от типа узла
        let textX, textY, textAnchor;
        
        if (d.data.type === "employee") {
          // Для узлов сотрудников - подпись под узлом с отступом 16px
          textX = 0;
          textY = 12.5 + 16; // радиус узла + отступ
          textAnchor = "middle";
        } else if (d.data.type === "department") {
          // Для узлов отделов - подпись под узлом с отступом 16px
          textX = 0;
          textY = 6 + 16; // радиус узла + отступ
          textAnchor = "middle";
        } else if (d.data.type === "skill") {
          // Для узлов навыков - подпись справа от узла с отступом 8px
          textX = 6 + 8; // радиус узла + отступ
          textY = 0;
          textAnchor = "start";
        } else {
          // Для остальных узлов - стандартное позиционирование
          textX = d.children ? -8 : 8;
          textY = 0;
          textAnchor = d.children ? "end" : "start";
        }
        
        // Добавляем текст
        const textElement = textGroup.append("text")
          .attr("dy", ".31em")
          .attr("x", textX)
          .attr("y", textY)
          .attr("text-anchor", textAnchor)
          .attr("fill", "#2D2D2D")
          .attr("font-size", "12px")
          .text(function(d) { return d.data.name; });
        
        // Добавляем поворот текста для радиальных лэйаутов только для конечных узлов
        if ((treeLayout === 'radial-tree' || treeLayout === 'radial-cluster') && 
            ((dataSet === 'organization' && d.data.type === 'skill') || 
             (dataSet === 'skills' && d.data.type === 'employee'))) {
          // Вычисляем угол для поворота текста
          const angle = (d.x - 90) * Math.PI / 180;
          const rotation = angle * 180 / Math.PI;
          
          // Поворачиваем текст
          textElement.attr("transform", `rotate(${rotation})`);
          
          // Всегда устанавливаем text-anchor в "start" для радиальных лэйаутов
          // чтобы текст всегда был ориентирован "наружу" от центра
          textElement.attr("text-anchor", "start");
        }
        
        // Получаем размеры текста для создания подложки
        const bbox = textElement.node().getBBox();
        
        // Добавляем полупрозрачную подложку
        const backgroundRect = textGroup.insert("rect", "text")
          .attr("x", bbox.x - 2)
          .attr("y", bbox.y - 1)
          .attr("width", bbox.width + 4)
          .attr("height", bbox.height + 2)
          .attr("fill", "rgba(255, 255, 255, 0.8)")
          .attr("rx", 2);
        
        // Для радиальных лэйаутов применяем тот же поворот к подложке
        if ((treeLayout === 'radial-tree' || treeLayout === 'radial-cluster') && 
            ((dataSet === 'organization' && d.data.type === 'skill') || 
             (dataSet === 'skills' && d.data.type === 'employee'))) {
          const angle = (d.x - 90) * Math.PI / 180;
          const rotation = angle * 180 / Math.PI;
          
          // Поворачиваем подложку вместе с текстом
          backgroundRect.attr("transform", `rotate(${rotation})`);
        }
        
        // Перемещаем текст поверх подложки
        textElement.raise();
      });
    }, [treeLayout, dataSet, selectedSkillType, status, loading, departments, employees, view]);

    // Привязка обработчика событий (как в референсе)
    useEffect(() => {
      if (view === 'chart' && root) {
        // Создаем скрытые input элементы для каждого layout'а
        const container = svgRef.current?.parentElement;
        if (container) {
          // Удаляем старые переключатели
          const oldSwitchContainer = container.querySelector('.layout-switch-container');
          if (oldSwitchContainer) {
            oldSwitchContainer.remove();
          }
          
          // Удаляем старые input элементы
          container.querySelectorAll('.layout-input').forEach(el => el.remove());
          
          // Создаем контейнер для переключателей
          const switchContainer = document.createElement('div');
          switchContainer.className = 'layout-switch-container';
          switchContainer.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 1000;
            display: flex;
            flex-direction: row;
            gap: 4px;
            background: #D9D9D9;
            padding: 4px;
            border-radius: 8px;
            pointer-events: auto;
          `;
          container.appendChild(switchContainer);
          
          // Создаем кнопки-переключатели для каждого layout'а
          treeLayouts.forEach(layout => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'layout-switch-button';
            button.textContent = layout.label;
            button.style.cssText = `
              padding: 6px 12px;
              border: none;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s ease;
              background: ${layout.id === treeLayout ? '#fff' : 'transparent'};
              color: ${layout.id === treeLayout ? '#FF8A15' : '#2D2D2D'};
              box-shadow: ${layout.id === treeLayout ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};
              font-family: inherit;
            `;
            
            button.setAttribute('data-layout', layout.id);
            button.addEventListener('click', () => {
              // Обновляем состояние всех кнопок
              switchContainer.querySelectorAll('.layout-switch-button').forEach(btn => {
                btn.style.background = 'transparent';
                btn.style.color = '#2D2D2D';
                btn.style.boxShadow = 'none';
              });
              
              // Активируем текущую кнопку
              button.style.background = '#fff';
              button.style.color = '#FF8A15';
              button.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
              button.style.fontFamily = 'inherit';
              
              // Вызываем функцию change
              change.call({ value: layout.id });
            });
            
            switchContainer.appendChild(button);
          });
        }
      }
    }, [view, root, dataSet]); // Добавили dataSet в зависимости

    // Обновление состояния кнопок-переключателей при изменении treeLayout
    useEffect(() => {
      if (view === 'chart') {
        const container = svgRef.current?.parentElement;
        if (container) {
          const switchContainer = container.querySelector('.layout-switch-container');
          if (switchContainer) {
            // Обновляем состояние кнопок
            switchContainer.querySelectorAll('.layout-switch-button').forEach(button => {
              const layoutId = button.getAttribute('data-layout');
              const isActive = layoutId === treeLayout;
              
              button.style.background = isActive ? '#fff' : 'transparent';
              button.style.color = isActive ? '#FF8A15' : '#2D2D2D';
              button.style.boxShadow = isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none';
              button.style.fontFamily = 'inherit';
            });
          }
        }
      }
    }, [treeLayout, view]);

    // Убираем useEffect для treeLayout - перестроение только через кнопки

    return (
      <div ref={containerRef} className={`${isFullscreen ? 'flex-1' : 'w-full'} relative flex justify-center`} style={{ minHeight: 600, minWidth: 600 }}>
        <svg ref={svgRef} width={800} height={600} style={{ minHeight: 600, minWidth: 600, display: 'block' }} />
      </div>
    );
  };

  return (
    <div className="w-full max-w-none mx-auto pt-[50px] md:pt-[70px]">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6 gap-2 sm:gap-4 md:gap-8 flex-wrap">
        <h1 className="text-[32px] font-bold font-accent text-primary w-full text-center md:w-auto md:text-left pb-4 md:pb-0">Компетенции</h1>
        <div className="flex flex-row gap-2 w-full md:w-auto items-center">
          {/* Кнопка фильтра слева от свитчеров */}
          <button
            className="flex items-center justify-center w-10 h-10 rounded-[8px] bg-primary text-white hover:bg-primary/90 transition md:hidden"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
          >
            <ListFilter className="w-5 h-5" />
          </button>
          <div className="flex flex-row gap-2 bg-gray rounded-[12px] p-1 flex-wrap flex-1 md:flex-none flex-nowrap">
            {sortOptions.map((item, idx) => (
              <button
                key={item.id}
                className={`flex-1 md:flex-none flex items-center justify-center h-10 px-2 py-2 md:px-4 md:py-2 rounded-[8px] font-medium text-sm transition select-none
                  ${sortBy === item.id ? 'bg-white text-primary shadow' : 'text-dark hover:bg-secondary hover:text-white'}`}
                onClick={() => setSortBy(item.id)}
              >
                {idx === 0 ? <span className="text-base font-semibold whitespace-nowrap leading-none" style={{fontSize: '1rem', lineHeight: 1}}>А-Я</span> : item.icon}
                <span className="hidden md:inline ml-2">{item.label}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-row gap-2 bg-gray rounded-[12px] p-1 flex-wrap flex-1 md:flex-none flex-nowrap">
            {viewOptions.map((item) => (
              <button
                key={item.id}
                className={`flex-1 md:flex-none flex items-center justify-center h-10 px-2 py-2 md:px-4 md:py-2 rounded-[8px] font-medium text-sm transition select-none
                  ${view === item.id ? 'bg-white text-primary shadow' : 'text-dark hover:bg-secondary hover:text-white'}`}
                onClick={() => handleViewChange(item.id)}
              >
                  {item.icon}
                <span className="hidden md:inline ml-2">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-primary" />
            <span className="text-sm text-gray-600">Всего компетенций</span>
          </div>
          <div className="text-2xl font-bold text-dark">{stats.total}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">Хард скиллы</span>
          </div>
          <div className="text-2xl font-bold text-dark">{stats.byType.hard}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <HandMetal className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-600">Софт скиллы</span>
          </div>
          <div className="text-2xl font-bold text-dark">{stats.byType.soft}</div>
        </div>
        <div className="bg-white rounded-[15px] border border-gray/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-pink-500" />
            <span className="text-sm text-gray-600">Хобби</span>
          </div>
          <div className="text-2xl font-bold text-dark">{stats.byType.hobby}</div>
        </div>
      </div>

      {/* Фильтры */}
      <div className={`transition-all duration-300 overflow-hidden ${filtersOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} md:max-h-none md:opacity-100`}>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 bg-white rounded-[12px] md:border border-gray/50 md:p-1 mb-6 min-h-[56px] flex-wrap">
          {/* Сортировка и поиск в одной строке (слева) */}
          <div className="flex flex-row gap-1 items-center flex-1 min-w-0 order-1">
        <button
            className="w-10 h-10 flex items-center justify-center rounded-[8px] text-dark hover:bg-secondary hover:text-white transition"
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          title="Сменить направление сортировки"
        >
          {sortDirection === 'asc' ? <SortAsc className="w-5 h-5" /> : <SortDesc className="w-5 h-5" />}
        </button>
          <input
            type="text"
            placeholder="Найти компетенцию..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none text-base"
          />
        </div>
        {/* Тип компетенции */}
          <div className="relative min-w-[100px] w-auto order-2">
          <Select
            value={selectedType}
            onChange={setSelectedType}
            options={typeOptions}
            placeholder="Тип"
            isClearable
            styles={{
              ...customSelectStyles,
              control: (provided, state) => ({
                ...customSelectStyles.control(provided, state),
                minWidth: '100px',
                width: 'auto',
              }),
              menu: (provided) => ({
                ...customSelectStyles.menu(provided),
                minWidth: 'fit-content',
                width: 'auto',
              }),
            }}
          />
        </div>
        {/* Отдел */}
          <div className="relative min-w-[100px] w-auto order-3">
          <Select
            value={selectedDepartment}
            onChange={setSelectedDepartment}
            options={departmentOptions}
            placeholder="Отдел"
            isClearable
            styles={{
              ...customSelectStyles,
              control: (provided, state) => ({
                ...customSelectStyles.control(provided, state),
                minWidth: '100px',
                width: 'auto',
              }),
              menu: (provided) => ({
                ...customSelectStyles.menu(provided),
                minWidth: 'fit-content',
                width: 'auto',
              }),
            }}
          />
        </div>
        {/* Группа */}
          <div className="relative min-w-[100px] w-auto order-4">
            <Select
            value={selectedHobbyGroup}
            onChange={setSelectedHobbyGroup}
            options={hobbyGroupOptions}
            placeholder="Группа"
            isClearable
            styles={{
              ...customSelectStyles,
              control: (provided, state) => ({
                ...customSelectStyles.control(provided, state),
                minWidth: '100px',
                width: 'auto',
              }),
              menu: (provided) => ({
                ...customSelectStyles.menu(provided),
                minWidth: 'fit-content',
                width: 'auto',
              }),
            }}
            />
          </div>
          {/* Свитчер активные-архив отдельной строкой */}
          <div className="flex flex-row gap-2 bg-gray rounded-[8px] p-1 w-full md:w-auto mt-2 md:mt-0 order-5">
          {statusSwitcher.map((item) => (
            <button
              key={item.id}
                className={`flex-1 md:flex-none flex items-center justify-center px-2 py-2 md:px-4 md:py-2 rounded-[8px] text-sm font-medium transition select-none
                ${status === item.id ? 'bg-white text-primary shadow' : 'text-dark hover:bg-secondary hover:text-white'}`}
              onClick={() => setStatus(item.id)}
            >
                {item.icon}
                <span className="hidden md:inline ml-2">{item.label}</span>
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Контент */}
      {view === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCompetencies.length > 0 ? (
            filteredCompetencies.map((competency) => (
              <div
                key={competency.id}
                className="bg-white rounded-[15px] border border-gray/50 p-4 hover:shadow-lg transition cursor-pointer"
                onClick={() => navigate(`/competency/${competency.id}`)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: competencyTypes.find(t => t.id === competency.type)?.color || '#F0F0F0' }}
                  >
                    <div className="w-5 h-5">
                      {competencyTypes.find(t => t.id === competency.type)?.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark">{competency.label}</h3>
                    <p className="text-xs text-gray-400 capitalize">
                      {competency.type === 'hard' ? 'Хард' : 
                       competency.type === 'soft' ? 'Софт' : 
                       competency.type === 'hobby' ? 'Хобби' : competency.type}
                    </p>
                  </div>
                </div>
                
                {/* Группа навыков */}
                {competency.type === 'hobby' && competency.group && (
                  <div className="mb-3">
                    <span className="text-xs text-gray-500">
                      {hobbyGroups.find(g => g.id === competency.group)?.label || competency.group}
                    </span>
                  </div>
                )}
                
              <div className="flex items-center gap-2">
                  {competency.employees.length <= 2 ? (
                    // Показываем только аватарки для 1-2 сотрудников
                    competency.employees.slice(0, 2).map((employee, index) => (
                      <Avatar
                        key={employee.id}
                        src={employee.avatar}
                        name={employee.name}
                        size="xs"
                      />
                    ))
                  ) : (
                    // Показываем наложенные аватарки для 3+ сотрудников
                    <div className="flex -space-x-2">
                      {competency.employees.slice(0, 4).map((employee, index) => (
                        <Avatar
                          key={employee.id}
                          src={employee.avatar}
                          name={employee.name}
                          size="xs"
                          className="border-2 border-white"
                          style={{ zIndex: 4 - index }}
                        />
                      ))}
                      {competency.employees.length > 4 && (
                        <div className="w-6 h-6 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center border-2 border-white">
                          +{competency.employees.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-gray-400 text-6xl mb-4">📚</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Компетенции не найдены</h3>
                <p className="text-gray-500">
                  {search.trim() 
                   ? `По запросу "${search}" ничего не найдено`
                   : 'Попробуйте изменить фильтры или поисковый запрос'}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <TreeView />
      )}
    </div>
  );
}