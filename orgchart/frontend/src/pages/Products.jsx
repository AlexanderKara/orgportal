import React, { useState, useEffect, useRef, useMemo } from 'react';
import api from '../services/api';
import { User, LayoutGrid, Map, SortAsc, SortDesc, Trash2, ListFilter, Package, Calendar, CheckCircle, Archive, Building2, ChevronUp, ChevronDown } from 'lucide-react';
import Select from 'react-select';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import * as d3 from 'd3';
import Avatar from '../components/ui/Avatar';

const statusMap = {
  проектирование: { label: 'Проектирование', color: 'bg-blue-500 text-white' },
  разработка: { label: 'Разработка', color: 'bg-yellow-500 text-white' },
  тестирование: { label: 'Тестирование', color: 'bg-orange-500 text-white' },
  бета: { label: 'Бета', color: 'bg-secondary text-white' },
  мвп: { label: 'MVP', color: 'bg-purple-500 text-white' },
  релиз: { label: 'Релиз', color: 'bg-primary text-white' },
  завершен: { label: 'Завершен', color: 'bg-gray text-dark' },
};

const viewOptions = [
  { id: 'cards', label: 'Карточки', icon: <LayoutGrid className="w-5 h-5" /> },
  { id: 'landscape', label: 'Ландшафт', icon: <Map className="w-5 h-5" /> },
  { id: 'atlas', label: 'Атлас', icon: <Building2 className="w-5 h-5" /> },
];

const sortOptions = [
  { value: 'alphabet', label: 'По алфавиту', icon: <ListFilter className="w-5 h-5" /> },
  { value: 'type', label: 'По типу', icon: <Package className="w-5 h-5" /> },
  { value: 'year', label: 'По году', icon: <Calendar className="w-5 h-5" /> },
];

const groupOptions = [
  { value: 'alphabet', label: 'По алфавиту', icon: <ListFilter className="w-5 h-5" /> },
  { value: 'type', label: 'По типу', icon: <Package className="w-5 h-5" /> },
  { value: 'year', label: 'По году', icon: <Calendar className="w-5 h-5" /> },
];

const statusSwitcher = [
  { id: 'active', label: 'Активные', icon: <User className="w-4 h-4" /> },
  { id: 'archived', label: 'Архив', icon: <Trash2 className="w-4 h-4" /> },
];

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
    display: 'flex',
    alignItems: 'center',
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
  multiValue: (provided) => ({
    ...provided,
    alignItems: 'center',
    display: 'flex',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    display: 'flex',
    alignItems: 'center',
  }),
};

// Компонент для ландшафтного вида
const LandscapeView = ({ products }) => {
  const svgRef = useRef();
  const containerRef = useRef();

    useEffect(() => {
      try {
        if (!svgRef.current || !products || products.length === 0) {
          if (svgRef.current) {
            d3.select(svgRef.current).selectAll("*").remove();
          }
          if (containerRef.current) {
            containerRef.current.style.height = '400px';
          }
          return;
        }

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = svg.node().getBoundingClientRect().width;
        const cardWidth = 200;
        const cardHeight = 150;
        const levelHeight = 280;
        const horizontalSpacing = 350;

      // Создаем иерархическую структуру
        const nodes = [];
        const levels = {};
        
        // Простое размещение по порядку для избежания циклов
      const maxLevels = 5;
        products.forEach((product, index) => {
        levels[product.id] = Math.min(Math.floor(index / 3), maxLevels - 1);
        });

        // Группируем продукты по уровням
        const levelGroups = {};
        products.forEach(product => {
          const level = levels[product.id];
          if (!levelGroups[level]) {
            levelGroups[level] = [];
          }
          levelGroups[level].push(product);
        });

      // Позиционируем карточки по уровням
        let maxHeight = 0;
        Object.entries(levelGroups).forEach(([level, productsInLevel]) => {
          const levelY = parseInt(level) * levelHeight + 100;
          const totalWidth = productsInLevel.length * horizontalSpacing;
          const startX = Math.max(50, (width - totalWidth) / 2);
          
          productsInLevel.forEach((product, index) => {
            const x = startX + index * horizontalSpacing;
            const y = levelY;
            
            nodes.push({
              id: product.id,
              product: product,
              x: x,
              y: y,
              level: parseInt(level)
            });
          });
          
          maxHeight = Math.max(maxHeight, levelY + cardHeight);
        });

      // Создаем связи
        const links = [];
        const productIds = {};
        products.forEach(p => productIds[p.id] = true);
        const addedPairs = new Set();
      
        products.forEach(product => {
          // Связанные продукты
          if (product.related) {
            product.related.forEach(relatedId => {
              if (productIds[relatedId]) {
                const key = [product.id, relatedId].sort().join('-');
                if (!addedPairs.has(key)) {
                  const isBidirectional = products.find(p => p.id === relatedId)?.related?.includes(product.id);
                  links.push({
                    source: product.id,
                    target: relatedId,
                    type: 'related',
                    bidirectional: isBidirectional
                  });
                  addedPairs.add(key);
                }
              }
            });
          }
        });

        // Фильтруем валидные связи
        const nodeIds = {};
        nodes.forEach(n => nodeIds[n.id] = true);
        const validLinks = links.filter(link => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          return nodeIds[sourceId] && nodeIds[targetId];
        });

        // Обновляем высоту контейнера
        if (containerRef.current) {
          containerRef.current.style.height = `${maxHeight + 150}px`;
        }

      // Создаем SVG элементы
      const svgElement = svg.node();
      
      // Добавляем определения стрелок
      const defs = svg.append("defs");
      defs.append("marker")
        .attr("id", "arrowhead-related")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 8)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#FF8A15");

      defs.append("marker")
        .attr("id", "arrowhead-version")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 8)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#2D2D2D");

      // Создаем связи
        const linkGroup = svg.append("g").attr("class", "links");
        
        validLinks.forEach(link => {
          const sourceNode = nodes.find(n => n.id === (typeof link.source === 'object' ? link.source.id : link.source));
          const targetNode = nodes.find(n => n.id === (typeof link.target === 'object' ? link.target.id : link.target));
          
          if (!sourceNode || !targetNode) return;
          
          const color = link.type === 'related' ? '#FF8A15' : '#2D2D2D';
          
        // Определяем точки соединения
          let startX, startY, endX, endY;
          
          const dx = Math.abs(targetNode.x - sourceNode.x);
          const dy = Math.abs(targetNode.y - sourceNode.y);
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          const useStraightLine = distance < 300;
          
          if (useStraightLine) {
            if (sourceNode.y < targetNode.y) {
              startX = sourceNode.x + cardWidth / 2;
              startY = sourceNode.y + cardHeight;
              endX = targetNode.x + cardWidth / 2;
              endY = targetNode.y;
            } else if (sourceNode.y > targetNode.y) {
              startX = sourceNode.x + cardWidth / 2;
              startY = sourceNode.y;
              endX = targetNode.x + cardWidth / 2;
              endY = targetNode.y + cardHeight;
            } else {
              if (sourceNode.x < targetNode.x) {
                startX = sourceNode.x + cardWidth;
                startY = sourceNode.y + cardHeight / 2;
                endX = targetNode.x;
                endY = targetNode.y + cardHeight / 2;
              } else {
                startX = sourceNode.x;
                startY = sourceNode.y + cardHeight / 2;
                endX = targetNode.x + cardWidth;
                endY = targetNode.y + cardHeight / 2;
              }
            }
            
            const path = linkGroup.append("line")
              .attr("x1", startX)
              .attr("y1", startY)
              .attr("x2", endX)
              .attr("y2", endY)
              .attr("stroke", color)
              .attr("stroke-width", 2);

            if (link.bidirectional) {
              path.attr("marker-start", `url(#arrowhead-${link.type})`)
                  .attr("marker-end", `url(#arrowhead-${link.type})`);
            } else {
              path.attr("marker-end", `url(#arrowhead-${link.type})`);
            }
          } else {
          // Сложные пути с обходом препятствий
            const radius = 24;
            if (sourceNode.y === targetNode.y) {
              const minX = Math.min(sourceNode.x, targetNode.x);
              const maxX = Math.max(sourceNode.x, targetNode.x);
              const yLevel = sourceNode.y;
            
            const path = linkGroup.append("path")
              .attr("d", `M ${sourceNode.x + cardWidth / 2} ${sourceNode.y + cardHeight / 2} 
                          L ${minX - 50} ${yLevel + cardHeight / 2} 
                          L ${minX - 50} ${yLevel + cardHeight + 50} 
                          L ${maxX + cardWidth + 50} ${yLevel + cardHeight + 50} 
                          L ${maxX + cardWidth + 50} ${targetNode.y + cardHeight / 2} 
                          L ${targetNode.x + cardWidth / 2} ${targetNode.y + cardHeight / 2}`)
                  .attr("stroke", color)
              .attr("stroke-width", 2)
              .attr("fill", "none");

                if (link.bidirectional) {
                  path.attr("marker-start", `url(#arrowhead-${link.type})`)
                      .attr("marker-end", `url(#arrowhead-${link.type})`);
                } else {
                  path.attr("marker-end", `url(#arrowhead-${link.type})`);
                }
              } else {
            const path = linkGroup.append("path")
              .attr("d", `M ${sourceNode.x + cardWidth / 2} ${sourceNode.y + cardHeight / 2} 
                          L ${sourceNode.x + cardWidth / 2} ${(sourceNode.y + targetNode.y) / 2} 
                          L ${targetNode.x + cardWidth / 2} ${(sourceNode.y + targetNode.y) / 2} 
                          L ${targetNode.x + cardWidth / 2} ${targetNode.y + cardHeight / 2}`)
                    .attr("stroke", color)
                    .attr("stroke-width", 2)
              .attr("fill", "none");

                if (link.bidirectional) {
                  path.attr("marker-start", `url(#arrowhead-${link.type})`)
                      .attr("marker-end", `url(#arrowhead-${link.type})`);
                } else {
                  path.attr("marker-end", `url(#arrowhead-${link.type})`);
              }
            }
          }
        });

        // Создаем карточки продуктов
      const cardGroup = svg.append("g").attr("class", "cards");
        
        nodes.forEach(node => {
        const product = node.product;
        const responsible = employees.find(e => e.id === product.responsible);
        
        // Карточка продукта
        const card = cardGroup.append("g")
            .attr("transform", `translate(${node.x}, ${node.y})`)
            .style("cursor", "pointer")
          .on("click", () => {
            window.location.href = `/product/${product.id}`;
          });

          // Фон карточки
          card.append("rect")
            .attr("width", cardWidth)
            .attr("height", cardHeight)
            .attr("rx", 8)
            .attr("ry", 8)
          .attr("fill", "#fff")
          .attr("stroke", "#E5E5E5")
            .attr("stroke-width", 1);

          // Название продукта
          card.append("text")
            .attr("x", 10)
            .attr("y", 25)
          .attr("font-family", "Arial, sans-serif")
            .attr("font-size", "14px")
          .attr("font-weight", "bold")
          .attr("fill", "#2D2D2D")
          .text(product.name.length > 15 ? product.name.substring(0, 15) + "..." : product.name);

          // Тип продукта
          card.append("text")
            .attr("x", 10)
            .attr("y", 45)
          .attr("font-family", "Arial, sans-serif")
            .attr("font-size", "12px")
          .attr("fill", "#666")
          .text(product.type.length > 20 ? product.type.substring(0, 20) + "..." : product.type);

          // Статус
        const statusColor = statusMap[product.status]?.color || 'bg-gray text-dark';
        const statusBg = statusColor.includes('bg-blue-500') ? '#3B82F6' :
                        statusColor.includes('bg-yellow-500') ? '#EAB308' :
                        statusColor.includes('bg-orange-500') ? '#F97316' :
                        statusColor.includes('bg-secondary') ? '#FF8A15' :
                        statusColor.includes('bg-purple-500') ? '#A855F7' :
                        statusColor.includes('bg-primary') ? '#FF8A15' : '#9CA3AF';

        card.append("rect")
          .attr("x", 10)
          .attr("y", 55)
          .attr("width", 60)
          .attr("height", 20)
          .attr("rx", 10)
          .attr("ry", 10)
          .attr("fill", statusBg);

          card.append("text")
          .attr("x", 40)
          .attr("y", 68)
          .attr("font-family", "Arial, sans-serif")
          .attr("font-size", "10px")
          .attr("fill", "#fff")
          .attr("text-anchor", "middle")
          .text(statusMap[product.status]?.label || product.status);

        // Ответственный
            card.append("text")
              .attr("x", 10)
          .attr("y", 130)
          .attr("font-family", "Arial, sans-serif")
              .attr("font-size", "11px")
          .attr("fill", "#666")
          .text(responsible ? responsible.name : '—');

        // Теги
        const tags = product.tags.slice(0, 2);
        tags.forEach((tag, index) => {
          card.append("rect")
            .attr("x", 10 + index * 50)
            .attr("y", 85)
            .attr("width", 40)
            .attr("height", 16)
            .attr("rx", 8)
            .attr("ry", 8)
            .attr("fill", "#F3F4F6");

            card.append("text")
            .attr("x", 30 + index * 50)
            .attr("y", 96)
            .attr("font-family", "Arial, sans-serif")
            .attr("font-size", "9px")
            .attr("fill", "#666")
            .attr("text-anchor", "middle")
            .text(tag.length > 6 ? tag.substring(0, 6) + "..." : tag);
        });
        });

      } catch (error) {
      console.error('Error in LandscapeView:', error);
      }
    }, [products]);

    return (
    <div ref={containerRef} className="w-full overflow-x-auto">
      <svg ref={svgRef} width="100%" height="100%" style={{ minHeight: '400px' }} />
      </div>
    );
  };

// Компонент для атласа
const AtlasView = () => {
  const [imagePosition, setImagePosition] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const loadImage = () => {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.naturalHeight / img.naturalWidth;
        const containerWidth = window.innerWidth;
        const calculatedHeight = containerWidth * aspectRatio;
        const maxAvailableHeight = window.innerHeight - 250;
        const proportionalHeight = window.innerWidth * 0.5; // 4:2 пропорция = ширина * 0.5
        const containerHeight = Math.min(proportionalHeight, maxAvailableHeight);
        // Показываем нижнюю четверть по умолчанию - изображение смещено вверх (отрицательное значение)
        const initialPosition = Math.max(0, calculatedHeight - containerHeight);
        setImageHeight(calculatedHeight);
        setImagePosition(initialPosition);
      };
      img.onerror = () => {
        console.error('Failed to load image');
      };
      img.src = '/src/res/карта.png';
    };

    loadImage();
  }, []);

  const handleScrollUp = () => {
    const maxAvailableHeight = window.innerHeight - 250;
    const proportionalHeight = window.innerWidth * 0.5; // 4:2 пропорция
    const containerHeight = Math.min(proportionalHeight, maxAvailableHeight);
    const quarterHeight = imageHeight * 0.25;
    const newPosition = Math.max(imagePosition - quarterHeight, 0);
    setImagePosition(newPosition);
  };

  const handleScrollDown = () => {
    const maxAvailableHeight = window.innerHeight - 250;
    const proportionalHeight = window.innerWidth * 0.5; // 4:2 пропорция
    const containerHeight = Math.min(proportionalHeight, maxAvailableHeight);
    const quarterHeight = imageHeight * 0.25;
    const maxScroll = Math.max(0, imageHeight - containerHeight);
    const newPosition = Math.min(imagePosition + quarterHeight, maxScroll);
    setImagePosition(newPosition);
  };

  // Check if buttons should be disabled
  const maxAvailableHeight = window.innerHeight - 250;
  const proportionalHeight = window.innerWidth * 0.5; // 4:2 пропорция
  const containerHeight = Math.min(proportionalHeight, maxAvailableHeight);
  const maxScroll = Math.max(0, imageHeight - containerHeight);
  const isAtTop = imagePosition <= 0; // Can't scroll up anymore (showing bottom)
  const isAtBottom = imageHeight > 0 && imagePosition >= maxScroll; // Can't scroll down anymore (showing top)

  return (
    <div className="relative w-full h-full overflow-hidden" ref={containerRef}>
      {/* Контейнер с изображением */}
      <div 
        className="w-full transition-transform duration-1000 ease-in-out"
        style={{
          height: `${imageHeight}px`,
          transform: `translateY(-${imagePosition}px)`,
        }}
      >
        <img 
          src="/src/res/карта.png" 
          alt="Карта" 
          className="w-full h-full object-contain"
        />
      </div>
      
      {/* Кнопки навигации справа */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-4 z-10">
        <button
          onClick={handleScrollUp}
          disabled={isAtTop}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
            isAtTop 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-white/80 hover:bg-white text-gray-700 hover:text-primary hover:scale-110'
          }`}
          title="Вверх"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
        <button
          onClick={handleScrollDown}
          disabled={isAtBottom}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
            isAtBottom 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-white/80 hover:bg-white text-gray-700 hover:text-primary hover:scale-110'
          }`}
          title="Вниз"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>
      
      {/* Легенда внизу слева */}
      <div className="absolute bottom-4 left-4 z-10">
        <img 
          src="/src/res/легенда.png" 
          alt="Легенда" 
          className="max-w-[500px] h-auto shadow-lg rounded-[15px]"
        />
      </div>
    </div>
  );
};

export default function Products() {
  const { view: urlView } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Состояния для данных
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Загружаем данные
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [productsResponse, employeesResponse] = await Promise.all([
          api.getProducts(),
          api.getEmployees()
        ]);
        
        // Дедупликация продуктов по ID и нормализация данных
        let productsData = [];
        
        // Обрабатываем разные форматы ответа API
        if (productsResponse && productsResponse.success && productsResponse.data) {
          productsData = productsResponse.data;
        } else if (productsResponse && productsResponse.products) {
          productsData = productsResponse.products;
        } else if (Array.isArray(productsResponse)) {
          productsData = productsResponse;
        } else if (productsResponse && productsResponse.data) {
          productsData = productsResponse.data;
        }
        
        console.log('Сырые данные продуктов:', productsData);
        
        const uniqueProducts = productsData
          .filter((product, index, self) => 
            index === self.findIndex(p => p.id === product.id)
          )
          .map(product => ({
            ...product,
            // Нормализуем поля для совместимости с фронтендом
            recordStatus: product.status || 'active',
            description: product.short_description || product.long_description || '',
            type: product.productType?.name || 'Не указан',
            tags: product.tags || [],
            created: product.createdAt || product.created_at || new Date().toISOString(),
            responsible: product.responsible || null,
            logo: product.logo || null
          }));
        
        console.log('Обработанные продукты:', uniqueProducts);
        setProducts(uniqueProducts);
        setEmployees(employeesResponse.employees || employeesResponse.data || []);
      } catch (error) {
        console.error('Error loading products data:', error);
        console.error('Products response:', productsResponse);
        console.error('Employees response:', employeesResponse);
        setError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);
  
  // Опции фильтров, зависящие от данных
  const tagOptions = useMemo(() => 
    Array.from(new Set(products.flatMap(p => p.tags || []))).map(tag => ({ value: tag, label: tag })), 
    [products]
  );
  
  const statusOptions = [
    { value: '', label: 'Все статусы' },
    { value: 'проектирование', label: 'Проектирование' },
    { value: 'разработка', label: 'Разработка' },
    { value: 'тестирование', label: 'Тестирование' },
    { value: 'бета', label: 'Бета' },
    { value: 'мвп', label: 'MVP' },
    { value: 'релиз', label: 'Релиз' },
    { value: 'завершен', label: 'Завершен' },
  ];
  
  const typeOptions = useMemo(() => 
    Array.from(new Set(products.map(p => p.type).filter(Boolean))).map(type => ({ value: type, label: type })), 
    [products]
  );
  
  // Определяем текущее представление из URL или используем 'cards' по умолчанию
  const getCurrentView = () => {
    if (urlView && ['cards', 'landscape', 'atlas'].includes(urlView)) {
      return urlView;
    }
    return 'cards';
  };
  
  const [view, setView] = useState(getCurrentView());
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(statusOptions[0]);
  const [selectedType, setSelectedType] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [groupBy, setGroupBy] = useState(groupOptions[0]);
  const [status, setStatus] = useState('active');
  const [filtersOpen, setFiltersOpen] = useState(false); // New state for filters visibility

  // Обновляем URL при смене представления
  const handleViewChange = (newView) => {
    setView(newView);
    const basePath = '/products';
    const newPath = newView === 'cards' ? basePath : `${basePath}/${newView}`;
    navigate(newPath, { replace: true });
  };

  // Синхронизируем состояние с URL при изменении параметров
  useEffect(() => {
    const currentView = getCurrentView();
    if (currentView !== view) {
      setView(currentView);
    }
  }, [urlView]);

  // Вычисляем статистику
  const stats = useMemo(() => {
    const filtered = products.filter(p => p.recordStatus === status);
    const total = filtered.length;
    const totalResponsible = new Set(filtered.map(p => p.responsible)).size;
    const byStatus = {
      active: products.filter(p => p.recordStatus === 'active').length,
      archived: products.filter(p => p.recordStatus === 'archived').length,
    };
    return { total, totalResponsible, byStatus };
  }, [products, status]);

  // Фильтруем и сортируем продукты
  const filtered = useMemo(() => {
    let result = products.filter(p => p.recordStatus === status);
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower)) ||
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }
    
    if (selectedTags.length > 0) {
      result = result.filter(p => 
        p.tags && selectedTags.some(tag => p.tags.includes(tag.value))
      );
    }
    
    if (selectedStatus.value) {
      result = result.filter(p => p.status === selectedStatus.value);
    }
    
    if (selectedType) {
      result = result.filter(p => p.type === selectedType.value);
    }
    
    // Сортировка
    result.sort((a, b) => {
      const aVal = a.name.toLowerCase();
      const bVal = b.name.toLowerCase();
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    
    return result;
  }, [products, status, search, selectedTags, selectedStatus, selectedType, sortAsc]);

  // Группируем продукты
  const grouped = useMemo(() => {
  if (groupBy.value === 'alphabet') {
    const groups = {};
      filtered.forEach(product => {
        const firstLetter = product.name[0].toUpperCase();
        if (!groups[firstLetter]) groups[firstLetter] = [];
        groups[firstLetter].push(product);
      });
      return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  } else if (groupBy.value === 'type') {
    const groups = {};
      filtered.forEach(product => {
        if (!groups[product.type]) groups[product.type] = [];
        groups[product.type].push(product);
      });
      return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  } else if (groupBy.value === 'year') {
    const groups = {};
      filtered.forEach(product => {
        const year = new Date(product.created || product.createdAt || new Date()).getFullYear();
      if (!groups[year]) groups[year] = [];
        groups[year].push(product);
    });
      return Object.entries(groups).sort(([a], [b]) => parseInt(b) - parseInt(a));
  }
    return [['Все продукты', filtered]];
  }, [filtered, groupBy]);

  return (
    <div className="w-full max-w-none mx-auto pt-[50px] md:pt-[70px]">
      {/* Показываем загрузку */}
      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка продуктов...</p>
          </div>
        </div>
      )}

      {/* Показываем ошибку */}
      {error && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      )}

      {/* Показываем основной контент только если данные загружены */}
      {!loading && !error && (
      <>
      {/* Верхний блок */}
      <div className="flex flex-col md:flex-row items-center md:items-center justify-between mb-6 gap-2 sm:gap-4 md:gap-8 flex-wrap text-center md:text-left">
        <h1 className="text-[32px] font-bold font-accent text-primary w-full md:w-auto pb-4 md:pb-0">Продукты</h1>
        <div className="flex flex-row gap-2 flex-wrap w-full md:w-auto justify-center md:justify-end items-center">
          {/* Оба свитчера и кнопка фильтра в одной строке */}
          {view !== 'atlas' && (
            <div className="flex flex-row gap-2 w-full md:w-auto items-center">
              {/* Кнопка фильтра слева от свитчеров */}
              <button
                className="flex items-center justify-center w-10 h-10 rounded-[8px] bg-primary text-white hover:bg-primary/90 transition md:hidden"
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
              >
                <ListFilter className="w-5 h-5" />
              </button>
              <div className="flex flex-row gap-2 bg-gray rounded-[12px] p-1 flex-wrap flex-1 md:flex-none md:order-1 flex-nowrap">
                {groupOptions.map((item, idx) => (
              <button
                key={item.value}
                    className={`flex-1 md:flex-none flex items-center justify-center h-10 px-2 py-2 md:px-4 md:py-2 rounded-[8px] font-medium text-sm transition select-none
                  ${groupBy.value === item.value ? 'bg-white text-primary shadow' : 'text-dark hover:bg-secondary hover:text-white'}`}
                onClick={() => setGroupBy(item)}
              >
                    {/* Первая кнопка — иконка А-Я, остальные — item.icon */}
                    {idx === 0 ? <span style={{fontSize: '1rem', lineHeight: 1}} className="font-semibold whitespace-nowrap">А-Я</span> : item.icon}
                    <span className="hidden md:inline ml-2">{item.label}</span>
              </button>
            ))}
          </div>
              <div className="flex flex-row gap-2 bg-gray rounded-[12px] p-1 flex-wrap flex-1 md:flex-none md:order-2 flex-nowrap">
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
          )}
        </div>
      </div>

      {/* Статистика */}
      {view !== 'atlas' && (
        <div className="hidden md:grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-[15px] border border-gray/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-primary" />
              <span className="text-sm text-gray-600">Всего продуктов</span>
            </div>
            <div className="text-2xl font-bold text-dark">{stats.total}</div>
          </div>
          <div className="bg-white rounded-[15px] border border-gray/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              {/* Hammer icon for 'В разработке' */}
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.293 6.293a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-9.586 9.586a2 2 0 01-2.828 0l-2-2a2 2 0 010-2.828l9.586-9.586z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 8l1.5 1.5" /></svg>
              <span className="text-sm text-gray-600">В разработке</span>
            </div>
            <div className="text-2xl font-bold text-dark">{products.filter(p => p.status === 'разработка').length}</div>
          </div>
          <div className="bg-white rounded-[15px] border border-gray/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600">Завершенные</span>
            </div>
            <div className="text-2xl font-bold text-dark">{products.filter(p => p.status === 'завершен').length}</div>
          </div>
          <div className="bg-white rounded-[15px] border border-gray/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Archive className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-gray-600">В архиве</span>
            </div>
            <div className="text-2xl font-bold text-dark">{stats.byStatus.archived}</div>
          </div>
        </div>
      )}

      {/* Панель фильтров */}
      {view !== 'atlas' && (
        <>
          {/* Кнопка фильтров только на мобильных, корпоративный стиль, justify-between, без лишнего паддинга и бордера */}
          <div className={`transition-all duration-300 overflow-hidden ${filtersOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} md:max-h-none md:opacity-100`}>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 bg-white rounded-[12px] md:border border-gray/50 md:p-1 mb-6 min-h-[56px] flex-wrap">
              {/* Сортировка и поиск: сначала сортировка (квадратная кнопка), потом поиск в одной строке */}
              <div className="flex flex-row gap-1 items-center flex-1 min-w-0">
        <button
            className="w-10 h-10 flex items-center justify-center rounded-[8px] text-dark hover:bg-secondary hover:text-white transition"
          onClick={() => setSortAsc(v => !v)}
          title="Сменить направление сортировки"
        >
          {sortAsc ? <SortAsc className="w-5 h-5" /> : <SortDesc className="w-5 h-5" />}
        </button>
          <input
            type="text"
            placeholder="Поиск по продуктам..."
            className="w-full bg-transparent outline-none text-base"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
              {/* Фильтры и свитчеры: горизонтально на md+, столбик на мобиле */}
              <div className="relative min-w-[100px] w-auto">
          <Select
            options={tagOptions}
            value={selectedTags}
            onChange={setSelectedTags}
            placeholder="Теги"
            isMulti
            isSearchable={false}
                  styles={customSelectStyles}
          />
        </div>
        <div className="relative min-w-[100px] w-auto">
          <Select
            options={[{ value: '', label: 'Все типы' }, ...typeOptions]}
            value={selectedType || { value: '', label: 'Все типы' }}
            onChange={opt => setSelectedType(opt.value ? opt : null)}
            placeholder="Тип продукта"
            isSearchable={false}
                  styles={customSelectStyles}
          />
        </div>
        <div className="flex gap-1 bg-gray rounded-[8px] p-1 ml-auto">
          {statusSwitcher.map((item) => (
            <button
              key={item.id}
              className={`flex items-center px-3 py-2 rounded-[8px] text-sm font-medium transition select-none
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
        </>
      )}

      {/* Контент */}
      <div className="flex flex-col">
        {grouped.length === 0 ? (
          <div className="col-span-full text-gray-500 p-8 text-center">Нет продуктов</div>
        ) : view === 'landscape' ? (
          // Ландшафтный вид
          <div className="mb-6">
            <LandscapeView products={filtered} />
          </div>
        ) : view === 'atlas' ? (
          // Атлас
          <div className="w-full max-h-[calc(100vh-250px)] aspect-[4/2] overflow-hidden">
            <AtlasView />
          </div>
        ) : (
          // Карточки
          grouped.map(([group, prods]) => (
            <div key={group} className="mb-6">
              <div className="text-lg font-bold text-dark mb-2 mt-2">{group}</div>
              <div className="flex flex-wrap gap-6 w-full">
                {prods.map(product => {
                  const responsible = employees.find(e => e.id === product.responsible);
                  const versionProducts = products.filter(p => p.name === product.name && p.id !== product.id && Array.isArray(p.versions) && Array.isArray(product.versions) && p.versions.some(v => product.versions.some(v2 => v2.version === v.version)));
                  return (
                    <div
                      key={product.id}
                      className="flex flex-col bg-white rounded-[15px] border border-gray/50 shadow-sm p-4 gap-2 hover:shadow-md transition cursor-pointer w-full md:max-w-[340px]"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {product.logo ? (
                          <img src={product.logo} alt={product.name} className="w-12 h-12 rounded object-contain bg-gray-100" />
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray/20 flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-bold text-lg text-dark truncate">{product.name}</span>
                          <span className="text-xs text-gray-500 mt-0.5 truncate">{product.type}</span>
                          <span className={`text-xs mt-1 px-2 py-0.5 rounded-full w-fit ${statusMap[product.status]?.color || 'bg-gray text-dark'}`}>{statusMap[product.status]?.label || product.status}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 line-clamp-3 mb-2">{product.description || 'Описание отсутствует'}</div>
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {product.tags.map(tag => (
                            <span key={tag} className="text-xs bg-gray/60 text-dark rounded-[8px] px-2 py-0.5">{tag}</span>
                          ))}
                        </div>
                      )}
                      {/* Версии продукта */}
                      {versionProducts && versionProducts.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {versionProducts.map(p => (
                            <span key={p.id} className="flex items-center gap-1 text-xs bg-gray/30 rounded-[8px] px-2 py-0.5 cursor-pointer hover:bg-primary/10" onClick={e => {e.stopPropagation();navigate(`/product/${p.id}`);}}>
                              <Package className="w-3 h-3 text-primary" />{p.versions?.[(p.versions?.length ?? 0) - 1]?.version ? `Версия ${p.versions[(p.versions?.length ?? 0) - 1].version}` : p.name}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-auto">
                        <Avatar
                          src={responsible?.avatar || ""}
                          name={responsible ? `${responsible.first_name || ''} ${responsible.last_name || ''}`.trim() : "—"}
                          size="xs"
                        />
                        <span className="text-xs text-gray-600 truncate">
                          {responsible ? `${responsible.first_name || ''} ${responsible.last_name || ''}`.trim() : '—'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </>
      )}
    </div>
  );
} 