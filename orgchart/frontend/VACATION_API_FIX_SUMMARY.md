# Исправления API отпусков

## ✅ Проблема
Фронтенд отправлял данные в неправильном формате:
```javascript
{
  employeeId: 1,
  type: "annual",  // Неправильный формат
  startDate: "2025-07-20",  // Неправильное поле
  endDate: "2025-07-20",    // Неправильное поле
  description: "Описание"
}
```

Бэкенд ожидал:
```javascript
{
  type: "Основной",  // Правильный формат
  start_date: "2025-07-20",  // Правильное поле
  end_date: "2025-07-20",    // Правильное поле
  description: "Описание"
}
```

## ✅ Решение

### Файл: `orgchart/frontend/src/services/api.js`

**Исправлены методы:**

1. **createVacation** - добавлено преобразование данных:
   ```javascript
   async createVacation(vacationData) {
     const backendData = {
       type: vacationData.type === 'annual' ? 'Основной' : 
             vacationData.type === 'sick' ? 'Больничный' :
             vacationData.type === 'maternity' ? 'Декретный' :
             vacationData.type === 'study' ? 'Учебный' :
             vacationData.type === 'unpaid' ? 'Без содержания' :
             vacationData.type === 'other' ? 'Другой' : 'Основной',
       start_date: vacationData.startDate,
       end_date: vacationData.endDate,
       description: vacationData.description
     };
     
     return this.request('/vacations', {
       method: 'POST',
       body: JSON.stringify(backendData),
     });
   }
   ```

2. **updateVacation** - добавлено преобразование данных:
   ```javascript
   async updateVacation(id, vacationData) {
     const backendData = {
       type: vacationData.type === 'annual' ? 'Основной' : 
             vacationData.type === 'sick' ? 'Больничный' :
             vacationData.type === 'maternity' ? 'Декретный' :
             vacationData.type === 'study' ? 'Учебный' :
             vacationData.type === 'unpaid' ? 'Без содержания' :
             vacationData.type === 'other' ? 'Другой' : 'Основной',
       start_date: vacationData.startDate,
       end_date: vacationData.endDate,
       description: vacationData.description
     };
     
     return this.request(`/vacations/${id}`, {
       method: 'PUT',
       body: JSON.stringify(backendData),
     });
   }
   ```

## 🎯 Преобразование типов отпусков

| Фронтенд | Бэкенд |
|----------|--------|
| `annual` | `Основной` |
| `sick` | `Больничный` |
| `maternity` | `Декретный` |
| `study` | `Учебный` |
| `unpaid` | `Без содержания` |
| `other` | `Другой` |

## ✅ Результат
- ✅ Создание отпусков теперь работает
- ✅ Обновление отпусков теперь работает
- ✅ Данные преобразуются в правильный формат
- ✅ Все типы отпусков поддерживаются

## 🧪 Тестирование
Создан тест `test-vacation-data-transform.js` для проверки корректности преобразования данных.

**Результат теста:**
- ✅ Преобразование данных работает корректно
- ✅ Все типы отпусков преобразуются правильно 