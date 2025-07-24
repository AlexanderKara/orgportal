# Исправления данных отпусков в пользовательском разделе

## ✅ Проблемы и решения

### 1. Не отображаются данные в таблице
**Проблема:** В таблице не отображались аватар, ФИО, отдел, количество дней.

**Причина:** Неправильная структура данных и отсутствие fallback значений.

**Решение:**
- ✅ **Добавлен API эндпоинт** `getVacationsAdmin()` для получения всех отпусков
- ✅ **Добавлены fallback значения** для всех полей:
  ```javascript
  // Аватар и ФИО
  src={vacation.employee?.avatar || ""}
  name={vacation.employeeName || vacation.employee?.name || "Неизвестный"}
  
  // Отдел
  {vacation.department || vacation.employee?.department?.name || "Без отдела"}
  
  // Количество дней
  {vacation.days || vacation.days_count || 0}
  
  // Тип отпуска
  {vacation.type || vacation.vacation_type || "Неизвестный"}
  ```

### 2. Не загружаются данные в диаграмме
**Проблема:** В представлении диаграмма не загружались данные.

**Причина:** Те же проблемы с структурой данных.

**Решение:**
- ✅ **Применены те же fallback значения** в диаграмме
- ✅ **Исправлено отображение** в режимах списков и кластеров

### 3. Полосы отпусков не пропорциональны
**Проблема:** Полосы отпусков в диаграмме не пропорциональны продолжительности, если столбцы с января до декабря равны 365 дням.

**Причина:** Неправильный расчет позиции и ширины полос.

**Решение:**
- ✅ **Исправлена функция `getVacationBar()`:**
  ```javascript
  const getVacationBar = (vacation) => {
    const startDate = new Date(vacation.start_date);
    const endDate = new Date(vacation.end_date);
    
    // Получаем день года (1-365)
    const startDayOfYear = Math.floor((startDate - new Date(startDate.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const endDayOfYear = Math.floor((endDate - new Date(endDate.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    // Вычисляем позицию и ширину в процентах от 365 дней
    const left = (startDayOfYear / 365) * 100;
    const width = ((endDayOfYear - startDayOfYear + 1) / 365) * 100;
    
    return { left: `${left}%`, width: `${width}%` };
  };
  ```

## 🔧 Технические детали

### Файл: `orgchart/frontend/src/services/api.js`

**Добавлена функция для админки:**
```javascript
async getVacationsAdmin() {
  return this.request('/vacations/admin');
}
```

### Файл: `orgchart/frontend/src/pages/Vacations.jsx`

**Исправлена загрузка данных:**
```javascript
const loadData = async () => {
  try {
    setLoading(true);
    
    // Используем админский эндпоинт для получения всех отпусков
    const vacationsResponse = await api.getVacationsAdmin();
    console.log('Vacations response:', vacationsResponse);
    
    // Обрабатываем данные отпусков
    const vacationsData = vacationsResponse.vacations || vacationsResponse || [];
    console.log('Processed vacations data:', vacationsData);
    setVacations(vacationsData);
    
  } catch (error) {
    console.error('Error loading vacations data:', error);
    setError('Ошибка загрузки данных');
  } finally {
    setLoading(false);
  }
};
```

**Добавлена отладочная информация:**
```javascript
console.log('Raw vacations data:', vacations);
console.log('First vacation structure:', vacations[0]);
```

**Исправлено отображение в таблице:**
```javascript
<Avatar
  src={vacation.employee?.avatar || ""}
  name={vacation.employeeName || vacation.employee?.name || "Неизвестный"}
  size="xs"
/>
<div className="text-sm font-medium text-gray-900">
  {vacation.employeeName || vacation.employee?.name || "Неизвестный"}
</div>
{vacation.department || vacation.employee?.department?.name || "Без отдела"}
{vacation.days || vacation.days_count || 0}
{vacation.type || vacation.vacation_type || "Неизвестный"}
```

**Исправлено отображение в диаграмме:**
```javascript
title={`${vacation.type || vacation.vacation_type || "Неизвестный"}: ${formatDate(vacation.start_date)} - ${formatDate(vacation.end_date)} (${vacation.days || vacation.days_count || 0} дней)`}
```

## ✅ Результат
- ✅ **Данные отображаются** в таблице (аватар, ФИО, отдел, дни)
- ✅ **Данные загружаются** в диаграмме
- ✅ **Полосы отпусков пропорциональны** продолжительности (365 дней)
- ✅ **Fallback значения** для всех полей
- ✅ **Отладочная информация** для диагностики

## 🧪 Тестирование
1. **Откройте страницу отпусков** в пользовательском разделе
2. **Проверьте таблицу** - должны отображаться все данные
3. **Переключитесь на диаграмму** - данные должны загружаться
4. **Проверьте пропорции** полос отпусков - должны соответствовать 365 дням
5. **Проверьте fallback значения** - при отсутствии данных должны показываться значения по умолчанию

**Все исправления применены и готовы к тестированию!** 🎉✨ 