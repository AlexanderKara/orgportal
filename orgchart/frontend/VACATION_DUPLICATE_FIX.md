# Исправление дублирующего объявления переменной vacations

## ✅ Проблема
Ошибка компиляции: `Identifier 'vacations' has already been declared. (214:9)`

**Причина:** Переменная `vacations` была объявлена дважды в файле Profile.jsx:
- Строка 76: `const [vacations, setVacations] = useState([]);`
- Строка 214: `const [vacations, setVacations] = useState([]);`

## ✅ Решение

### Файл: `orgchart/frontend/src/pages/Profile.jsx`

**Удалено дублирующее объявление:**
```javascript
// УДАЛЕНО (строка 214):
const [vacations, setVacations] = useState([]);
```

**Добавлено недостающее состояние:**
```javascript
// ДОБАВЛЕНО (строка 76):
const [vacationsLoading, setVacationsLoading] = useState(false);
```

## ✅ Результат
- ✅ **Ошибка компиляции исправлена**
- ✅ **Дублирующее объявление удалено**
- ✅ **Все состояния правильно объявлены**
- ✅ **Код компилируется без ошибок**

## 🧪 Проверка
- ✅ Переменная `vacations` объявлена только один раз
- ✅ Состояние `vacationsLoading` добавлено
- ✅ Все функции работают корректно 