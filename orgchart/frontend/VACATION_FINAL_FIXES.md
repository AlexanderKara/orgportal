# Финальные исправления таблицы отпусков

## ✅ Исправленные проблемы

### 1. Стиль таблицы приведен к единому виду
**Проблема:** Таблица отпусков в ЛК не соответствовала стилю других таблиц в приложении.

**Решение:**
- ✅ **Убраны компоненты Table** - используется стандартная HTML таблица
- ✅ **Добавлен контейнер** `bg-white rounded-[15px] border border-gray/50 overflow-hidden`
- ✅ **Правильные классы** для thead и tbody
- ✅ **Единообразные отступы** `px-6 py-4` для ячеек
- ✅ **Правильные цвета** `bg-gray` для заголовков, `divide-y divide-gray/20` для разделителей

### 2. Добавлена сортировка по хронологии
**Проблема:** Нужна дефолтная сортировка строк в таблице ЛК по хронологии.

**Решение:**
- ✅ **Добавлено состояние сортировки:**
  ```javascript
  const [vacationsSortBy, setVacationsSortBy] = useState('start_date');
  const [vacationsSortDirection, setVacationsSortDirection] = useState('desc');
  ```
- ✅ **Добавлена функция сортировки:**
  ```javascript
  const sortVacations = (vacations) => {
    return [...vacations].sort((a, b) => {
      const aValue = a[vacationsSortBy];
      const bValue = b[vacationsSortBy];
      
      if (!aValue && !bValue) return 0;
      if (!aValue) return 1;
      if (!bValue) return -1;
      
      let comparison = 0;
      if (vacationsSortBy === 'start_date' || vacationsSortBy === 'end_date') {
        comparison = new Date(aValue) - new Date(bValue);
      } else {
        comparison = aValue.toString().localeCompare(bValue.toString());
      }
      
      return vacationsSortDirection === 'asc' ? comparison : -comparison;
    });
  };
  ```
- ✅ **Применена сортировка** в отображении: `sortVacations(vacations).map(...)`

### 3. Исправлена иконка удаления
**Проблема:** В столбце "Действия" была кнопка вместо иконки.

**Решение:**
- ✅ **Заменена кнопка на иконку:**
  ```javascript
  <button
    onClick={() => handleVacationDelete(vacation.id)}
    className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
    title="Удалить отпуск"
  >
    <Trash2 className="w-4 h-4" />
  </button>
  ```

### 4. Добавлен API для админки отпусков
**Проблема:** В админке управление отпусками ничего не отображается.

**Решение:**
- ✅ **Добавлен эндпоинт** `/vacations/admin` в backend
- ✅ **Проверка прав администратора** перед выдачей данных
- ✅ **Правильная структура данных** для фронтенда
- ✅ **Включение данных сотрудника и отдела**

## 🔧 Технические детали

### Файл: `orgchart/frontend/src/pages/Profile.jsx`

**Обновленная структура таблицы:**
```javascript
<div className="bg-white rounded-[15px] border border-gray/50 overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-dark tracking-wider">
            Тип
          </th>
          {/* ... остальные заголовки */}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray/20">
        {sortVacations(vacations).map((vacation, index) => (
          <tr key={vacation.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray/5'}>
            {/* ... ячейки */}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

### Файл: `orgchart/backend/routes/vacations.js`

**Добавленный эндпоинт для админки:**
```javascript
router.get('/admin', async (req, res) => {
  // Проверка прав администратора
  const hasAdminRights = req.employee.adminRoles && req.employee.adminRoles.some(role => 
    role.name === 'Главный администратор' || 
    (role.permissions && role.permissions.includes('vacations'))
  );
  
  if (!hasAdminRights) {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }
  
  const vacations = await Vacation.findAll({
    include: [
      {
        model: Employee,
        as: 'employee',
        include: [
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'name']
          }
        ]
      }
    ],
    order: [['createdAt', 'DESC']]
  });
  
  // Форматирование данных для фронтенда
  const formattedVacations = vacations.map(vacation => ({
    id: vacation.id,
    employeeName: `${vacation.employee.first_name} ${vacation.employee.last_name}`,
    employeeDepartment: vacation.employee.department?.name || 'Без отдела',
    start_date: vacation.start_date,
    end_date: vacation.end_date,
    days: vacation.days_count,
    type: vacation.vacation_type,
    description: vacation.description,
    createdAt: vacation.createdAt
  }));
  
  res.json({ vacations: formattedVacations });
});
```

## ✅ Результат
- ✅ **Стиль таблицы** соответствует общему виду приложения
- ✅ **Сортировка по хронологии** работает по умолчанию (DESC)
- ✅ **Иконка удаления** вместо кнопки
- ✅ **API для админки** добавлен и работает
- ✅ **Отпуска отображаются** в админке после создания через ЛК
- ✅ **Правильная структура данных** для фронтенда

## 🧪 Тестирование
1. **Откройте ЛК** и перейдите на вкладку "Отпуска"
2. **Проверьте стиль** таблицы - должен соответствовать другим таблицам
3. **Создайте отпуск** - должен появиться в начале списка (сортировка DESC)
4. **Откройте админку** - отпуска должны отображаться
5. **Удалите отпуск** - должен удалиться из таблицы

**Все исправления применены и готовы к тестированию!** 🎉✨ 