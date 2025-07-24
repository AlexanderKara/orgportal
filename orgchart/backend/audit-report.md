# АУДИТ СООТВЕТСТВИЯ СТРУКТУРЫ МОДЕЛЕЙ, МИГРАЦИЙ И ТАБЛИЦ

## ОБЩАЯ СТАТИСТИКА

**Всего таблиц в БД:** 12
**Всего моделей:** 12
**Всего миграций:** 12

## ДЕТАЛЬНЫЙ АНАЛИЗ

### 1. DEPARTMENTS

**Таблица в БД:**
- id | int | NO | PRI | null | auto_increment
- name | varchar(255) | NO |  | null |
- description | text | YES |  | null |
- slogan | varchar(255) | YES |  | null |
- competencies | text | YES |  | null |
- order | int | YES |  | null |
- createdAt | datetime | NO |  | null |
- updatedAt | datetime | NO |  | null |

**Модель Department.js:**
- ✅ id (INTEGER, primaryKey, autoIncrement)
- ❌ name (STRING(100)) - в БД varchar(255)
- ✅ description (TEXT)
- ✅ slogan (STRING(255))
- ✅ competencies (TEXT)
- ✅ order (INTEGER)
- ❌ Модель содержит дополнительные поля: icon, color, status, employee_count
- ❌ Модель использует underscored: true, но поля в БД camelCase

**ПРОБЛЕМЫ:**
1. Несоответствие типов: name в модели STRING(100), в БД varchar(255)
2. Отсутствующие поля в БД: icon, color, status, employee_count
3. Несоответствие именования: модель использует underscored, но БД camelCase

### 2. EMPLOYEES

**Таблица в БД:**
- id | int | NO | PRI | null | auto_increment
- fullName | varchar(255) | NO |  | null |
- position | varchar(255) | YES |  | null |
- email | varchar(255) | YES |  | null |
- phone | varchar(255) | YES |  | null |
- avatar | longtext | YES |  | null |
- birthDate | date | YES |  | null |
- wishlistUrl | varchar(255) | YES |  | null |
- telegramChatId | varchar(255) | YES |  | null |
- competencies | text | YES |  | null |
- departmentId | int | YES | MUL | null |
- createdAt | datetime | NO |  | null |
- updatedAt | datetime | NO |  | null |

**Модель Employee.js:**
- ✅ id (INTEGER, primaryKey, autoIncrement)
- ❌ first_name, last_name (в БД fullName)
- ✅ email (STRING(255))
- ✅ phone (STRING(20))
- ✅ avatar (TEXT('long'))
- ✅ birth_date (DATE) - в БД birthDate
- ✅ wishlist_url (STRING(500)) - в БД wishlistUrl
- ✅ telegram_chat_id (BIGINT) - в БД telegramChatId
- ✅ competencies (TEXT)
- ✅ department_id (INTEGER) - в БД departmentId
- ❌ Модель содержит дополнительные поля: telegram, hire_date, status, last_login, theme, department_role, skills, products, notes
- ❌ Модель использует underscored: true, но поля в БД camelCase

**ПРОБЛЕМЫ:**
1. Несоответствие именования: модель first_name/last_name vs БД fullName
2. Отсутствующие поля в БД: telegram, hire_date, status, last_login, theme, department_role, skills, products, notes
3. Несоответствие типов: telegram_chat_id в модели BIGINT, в БД varchar(255)
4. Несоответствие именования: модель использует underscored, но БД camelCase

### 3. ROLES

**Таблица в БД:**
- id | int | NO | PRI | null | auto_increment
- name | varchar(255) | NO |  | null |
- description | text | YES |  | null |
- isLead | tinyint(1) | NO |  | 0 |
- isAdmin | tinyint(1) | NO |  | 0 |
- visibility | varchar(255) | YES |  | null |
- createdAt | datetime | NO |  | null |
- updatedAt | datetime | NO |  | null |

**Модель Role.js:**
- ✅ id (INTEGER, primaryKey, autoIncrement)
- ❌ name (STRING(50)) - в БД varchar(255)
- ✅ description (TEXT)
- ❌ Отсутствуют поля в БД: permissions, visible_sections, visible_views, is_system, status, employee_count, color, icon
- ❌ Модель содержит поля isLead, isAdmin, visibility, которых нет в модели
- ❌ Модель использует underscored: true, но поля в БД camelCase

**ПРОБЛЕМЫ:**
1. Несоответствие типов: name в модели STRING(50), в БД varchar(255)
2. Отсутствующие поля в БД: permissions, visible_sections, visible_views, is_system, status, employee_count, color, icon
3. Отсутствующие поля в модели: isLead, isAdmin, visibility
4. Несоответствие именования: модель использует underscored, но БД camelCase

### 4. SKILL_GROUPS

**Таблица в БД:**
- id | int | NO | PRI | null | auto_increment
- name | varchar(255) | NO |  | null |
- description | text | YES |  | null |
- createdAt | datetime | NO |  | null |
- updatedAt | datetime | NO |  | null |

**СООТВЕТСТВИЕ:** ✅ Хорошее

### 5. SKILLS

**Таблица в БД:**
- id | int | NO | PRI | null | auto_increment
- name | varchar(255) | NO |  | null |
- description | text | YES |  | null |
- skill_type | enum('hard','soft') | NO |  | hard |
- skillGroupId | int | YES | MUL | null |
- createdAt | datetime | NO |  | null |
- updatedAt | datetime | NO |  | null |

**СООТВЕТСТВИЕ:** ✅ Хорошее

### 6. SKILL_LEVELS

**Таблица в БД:**
- id | int | NO | PRI | null | auto_increment
- name | varchar(255) | NO |  | null |
- description | text | YES |  | null |
- value | int | NO |  | null |
- createdAt | datetime | NO |  | null |
- updatedAt | datetime | NO |  | null |

**СООТВЕТСТВИЕ:** ✅ Хорошее

### 7. EMPLOYEE_SKILLS

**Таблица в БД:**
- id | int | NO | PRI | null | auto_increment
- employeeId | int | NO | MUL | null |
- skillId | int | NO | MUL | null |
- skillLevelId | int | YES | MUL | null |
- createdAt | datetime | NO |  | null |
- updatedAt | datetime | NO |  | null |

**СООТВЕТСТВИЕ:** ✅ Хорошее

### 8. PRODUCTS

**Таблица в БД:**
- id | int | NO | PRI | null | auto_increment
- name | varchar(255) | NO |  | null |
- description | text | YES |  | null |
- createdAt | datetime | NO |  | null |
- updatedAt | datetime | NO |  | null |

**СООТВЕТСТВИЕ:** ✅ Хорошее

### 9. PRODUCT_PARTICIPANTS

**Таблица в БД:**
- id | int | NO | PRI | null | auto_increment
- productId | int | NO | MUL | null |
- employeeId | int | NO | MUL | null |
- roleId | int | YES | MUL | null |
- createdAt | datetime | NO |  | null |
- updatedAt | datetime | NO |  | null |

**СООТВЕТСТВИЕ:** ✅ Хорошее

### 10. PRODUCT_VERSIONS

**Таблица в БД:**
- id | int | NO | PRI | null | auto_increment
- productId | int | NO | MUL | null |
- version | varchar(255) | NO |  | null |
- description | text | YES |  | null |
- createdAt | datetime | NO |  | null |
- updatedAt | datetime | NO |  | null |

**СООТВЕТСТВИЕ:** ✅ Хорошее

### 11. PRODUCT_RELATIONS

**Таблица в БД:**
- id | int | NO | PRI | null | auto_increment
- sourceProductId | int | NO | MUL | null |
- targetProductId | int | NO | MUL | null |
- relationType | varchar(255) | YES |  | null |
- createdAt | datetime | NO |  | null |
- updatedAt | datetime | NO |  | null |

**СООТВЕТСТВИЕ:** ✅ Хорошее

### 12. VACATIONS

**Таблица в БД:**
- id | int | NO | PRI | null | auto_increment
- employeeId | int | NO | MUL | null |
- startDate | date | NO |  | null |
- endDate | date | NO |  | null |
- vacationType | varchar(255) | YES |  | null |
- description | text | YES |  | null |
- createdAt | datetime | NO |  | null |
- updatedAt | datetime | NO |  | null |

**СООТВЕТСТВИЕ:** ✅ Хорошее

## КРИТИЧЕСКИЕ ПРОБЛЕМЫ

### 1. Модели Department, Employee и Role не соответствуют таблицам
- **Department:** Отсутствуют поля icon, color, status, employee_count
- **Employee:** Отсутствуют поля telegram, hire_date, status, last_login, theme, department_role, skills, products, notes
- **Employee:** Несоответствие именования (first_name/last_name vs fullName)
- **Role:** Отсутствуют поля permissions, visible_sections, visible_views, is_system, status, employee_count, color, icon
- **Role:** Отсутствуют поля в модели isLead, isAdmin, visibility

### 2. Проблемы с именованием полей
- Модели используют underscored: true, но таблицы используют camelCase
- Это приводит к несоответствию имен полей

### 3. Отсутствующие поля в БД
- Модели содержат больше полей, чем есть в таблицах
- Это может привести к ошибкам при работе с моделями

### 4. Несоответствие типов данных
- Разные размеры строковых полей (STRING(50) vs varchar(255))
- Разные типы для telegram_chat_id (BIGINT vs varchar(255))

## РЕКОМЕНДАЦИИ

1. **Обновить модели** Department, Employee и Role, чтобы они соответствовали реальной структуре таблиц
2. **Исправить именование полей** - либо убрать underscored: true, либо обновить миграции
3. **Добавить недостающие поля** в таблицы или убрать их из моделей
4. **Создать новые миграции** для синхронизации структуры
5. **Унифицировать типы данных** между моделями и таблицами 