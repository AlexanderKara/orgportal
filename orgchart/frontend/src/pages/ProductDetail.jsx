import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, ArrowLeft, Package, Calendar, Tag, FileText, Newspaper } from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import api from '../services/api';

const statusMap = {
  проектирование: { label: 'Проектирование', color: 'bg-blue-500 text-white' },
  разработка: { label: 'Разработка', color: 'bg-yellow-500 text-white' },
  тестирование: { label: 'Тестирование', color: 'bg-orange-500 text-white' },
  бета: { label: 'Бета', color: 'bg-secondary text-white' },
  мвп: { label: 'MVP', color: 'bg-purple-500 text-white' },
  релиз: { label: 'Релиз', color: 'bg-primary text-white' },
  завершен: { label: 'Завершен', color: 'bg-gray text-dark' },
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [productResponse, employeesResponse] = await Promise.all([
          api.getProduct(id),
          api.getEmployees()
        ]);
        
        setProduct(productResponse);
        setEmployees(employeesResponse.data || employeesResponse || []);
      } catch (err) {
        console.error('Error loading product data:', err);
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

  if (error || !product) {
    return (
      <div className="w-full max-w-none mx-auto pt-[70px]">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-2">⚠️</div>
            <p className="text-red-600">{error || 'Продукт не найден'}</p>
          </div>
        </div>
      </div>
    );
  }

  const responsible = employees.find(e => e.id === product.responsible);
  const team = (product.team || []).map(id => employees.find(e => e.id === id)).filter(Boolean);
  // Для связанных продуктов и версий пока используем пустые массивы
  // TODO: Добавить API для получения связанных продуктов и версий
  const relatedProducts = [];
  const versionProducts = [];

  return (
    <div className="w-full max-w-none mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between py-8 border-b border-gray/30 sticky top-0 bg-white z-10 px-4 sm:px-10">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold font-accent text-primary">Профиль продукта</span>
        </div>
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray/30 transition" title="Назад">
          <ArrowLeft className="w-8 h-8 text-dark" />
        </button>
      </div>
      {/* Двухколоночный layout */}
      <div className="flex flex-col md:flex-row gap-4 sm:gap-12 py-8 sm:py-12 w-full max-w-full md:max-w-6xl mx-auto px-4 sm:px-8">
        {/* Левая часть: Логотип и статус */}
        <aside className="md:w-1/3 max-w-full md:max-w-xs min-w-0 md:min-w-[260px] flex flex-col items-center bg-white/80 rounded-2xl shadow-sm py-8 sm:py-14 px-2 sm:px-8 mb-8 md:mb-0">
          <Avatar
            src={product.logo}
            name={product.name}
            size="2xl"
            className="mb-4"
          />
          <span className={`text-xs mt-1 px-2 py-0.5 rounded-full w-fit ${statusMap[product.status]?.color || 'bg-gray text-dark'}`}>{statusMap[product.status]?.label || product.status}</span>
          <div className="font-bold text-2xl font-accent text-primary text-center mb-4 mt-6">{product.name}</div>
          <div className="text-lg text-gray-500 text-center mb-2">{product.type}</div>
        </aside>
        {/* Правая часть: Main content */}
        <main className="flex-1 flex flex-col gap-8">
          {/* Краткое и полное описание */}
          <section className="mb-4">
            <div className="text-sm text-gray-700 mb-2"><b>Краткое описание:</b> {product.description}</div>
            <div className="text-sm text-gray-700 mb-2"><b>Полное описание:</b> {product.fullDescription}</div>
          </section>
          {/* Теги */}
          <section className="mb-4">
            <div className="flex flex-wrap gap-2 mb-2">
              {product.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-xs bg-gray/60 text-dark rounded-[8px] px-2 py-0.5"><Tag className="w-3 h-3" />{tag}</span>
              ))}
            </div>
          </section>
          {/* Даты */}
          <section className="flex flex-wrap gap-10 text-base text-gray-700 mb-4">
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />Создан: {product.created || '—'}</div>
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />Обновлён: {product.updated || '—'}</div>
          </section>
          {/* Ответственный */}
          <section className="mb-2">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-600">ПМ: {responsible ? responsible.name : '—'}</span>
            </div>
          </section>
          {/* Команда */}
          <section className="mb-2">
            <div className="text-xs text-gray-400 mb-1">Команда:</div>
            <div className="flex flex-wrap gap-2">
              {team.length === 0 ? <span className="text-gray-400 text-xs">Нет участников</span> : team.map(e => (
                <span key={e.id} className="flex items-center gap-1 text-xs bg-gray/30 rounded-[8px] px-2 py-0.5">
                  <User className="w-3 h-3 text-primary" />{e.name}
                </span>
              ))}
            </div>
          </section>
          {/* Связанные продукты */}
          <section className="mb-2">
            <div className="text-xs text-gray-400 mb-1">Связанные продукты:</div>
            <div className="flex flex-wrap gap-2">
              {relatedProducts.length === 0 ? <span className="text-gray-400 text-xs">Нет</span> : relatedProducts.map(p => (
                <span key={p.id} className="flex items-center gap-1 text-xs bg-gray/30 rounded-[8px] px-2 py-0.5">
                  <Package className="w-3 h-3 text-primary" />{p.name}
                </span>
              ))}
            </div>
          </section>
          {/* Версии продукта */}
          <section className="mb-2">
            <div className="text-xs text-gray-400 mb-1">Версии продукта:</div>
            <div className="flex flex-wrap gap-2">
              {versionProducts.length === 0 ? <span className="text-gray-400 text-xs">Нет версий</span> : versionProducts.map(p => (
                <span key={p.id} className="flex items-center gap-1 text-xs bg-gray/30 rounded-[8px] px-2 py-0.5 cursor-pointer hover:bg-primary/10" onClick={() => navigate(`/product/${p.id}`)}>
                  <Package className="w-3 h-3 text-primary" />{p.versions?.[(p.versions?.length ?? 0) - 1]?.version ? `Версия ${p.versions[(p.versions?.length ?? 0) - 1].version}` : p.name}
                </span>
              ))}
            </div>
          </section>
          
          {/* Блок Файлы */}
          {product.files && product.files.length > 0 && (
            <section>
              <button
                type="button"
                className="block text-sm text-gray-400 mb-2 flex items-center gap-1 font-bold hover:underline cursor-pointer"
                aria-label="Перейти к файлам"
                onClick={() => navigate('/files')}
              >
                <span><FileText className="w-5 h-5" /></span>Файлы
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                {product.files.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white rounded-[15px] border border-gray/50 p-4">
                    <FileText className="w-10 h-10 text-primary" />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-dark line-clamp-2">{file.name}</span>
                      <span className="text-xs text-gray-500">{file.size} • {file.type}</span>
                      <span className="text-xs text-gray-400">{file.uploadDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Блок Новости */}
          {product.news && product.news.length > 0 && (
            <section>
              <button
                type="button"
                className="block text-sm text-gray-400 mb-2 flex items-center gap-1 font-bold hover:underline cursor-pointer"
                aria-label="Перейти к новостям"
                onClick={() => navigate('/news')}
              >
                <span><Newspaper className="w-5 h-5" /></span>Новости
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                {product.news.map((news, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white rounded-[15px] border border-gray/50 p-4">
                    {news.preview && <img src={news.preview} alt={news.title} className="w-12 h-12 rounded object-cover bg-gray-100" />}
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-dark line-clamp-2">{news.title}</span>
                      <span className="text-xs text-gray-500">{news.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
} 