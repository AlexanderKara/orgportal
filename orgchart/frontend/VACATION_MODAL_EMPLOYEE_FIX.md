# Исправление модального окна отпусков для ЛК

## ✅ Проблема
В модальном окне создания отпуска из ЛК отображался выбор сотрудников, хотя отпуск должен создаваться автоматически для авторизованного пользователя.

## ✅ Решение

### Файл: `orgchart/frontend/src/components/VacationModal.jsx`

**Добавлены новые пропсы:**
```javascript
export default function VacationModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingVacation = null,
  existingVacations = [],
  hideEmployeeSelect = false,  // НОВЫЙ ПРОПС
  currentEmployee = null       // НОВЫЙ ПРОПС
}) {
```

**Изменена логика загрузки сотрудников:**
```javascript
// Загружаем сотрудников только если hideEmployeeSelect=false
if (isOpen && employees.length === 0 && !hideEmployeeSelect) {
  // ... загрузка сотрудников
}
```

**Изменена валидация:**
```javascript
// Не проверяем selectedEmployee если hideEmployeeSelect=true
if (!hideEmployeeSelect && !selectedEmployee) {
  setEmployeeError('Выберите сотрудника');
  isValid = false;
}
```

**Изменена отправка данных:**
```javascript
// Используем currentEmployee если hideEmployeeSelect=true
const employee = hideEmployeeSelect ? currentEmployee : selectedEmployee;
onSubmit({
  employeeId: employee.id,
  // ... остальные данные
});
```

**Изменен JSX:**
```javascript
{/* Скрываем выбор сотрудника если hideEmployeeSelect=true */}
{!hideEmployeeSelect && (
  <div>
    <label>Сотрудник *</label>
    <Select ... />
  </div>
)}

{/* Показываем информацию о текущем сотруднике */}
{hideEmployeeSelect && currentEmployee && (
  <div>
    <label>Сотрудник</label>
    <div className="px-3 py-2 bg-gray-100 rounded-[8px]">
      {currentEmployee.first_name} {currentEmployee.last_name}
    </div>
  </div>
)}
```

### Файл: `orgchart/frontend/src/pages/Profile.jsx`

**Обновлен вызов VacationModal:**
```javascript
<VacationModal
  isOpen={showVacationModal}
  onClose={() => setShowVacationModal(false)}
  onSubmit={handleVacationSubmit}
  hideEmployeeSelect={true}        // Скрываем выбор сотрудников
  currentEmployee={userData}       // Передаем текущего пользователя
/>
```

## ✅ Результат
- ✅ **Выбор сотрудников скрыт** в модальном окне из ЛК
- ✅ **Отображается информация** о текущем авторизованном пользователе
- ✅ **Отпуск создается** автоматически для авторизованного пользователя
- ✅ **Валидация работает** корректно без проверки выбора сотрудника
- ✅ **Админская функциональность** сохранена (выбор сотрудников в админке)

## 🧪 Проверка
- ✅ В ЛК: модальное окно отпусков не показывает выбор сотрудников
- ✅ В ЛК: отображается информация о текущем пользователе
- ✅ В ЛК: отпуск создается для авторизованного пользователя
- ✅ В админке: выбор сотрудников работает как раньше