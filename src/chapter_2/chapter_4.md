# Продвинутые паттерны проектирования и архитектура в Go

В этой главе мы изучим продвинутые паттерны проектирования и архитектурные подходы, которые помогут создавать масштабируемые и поддерживаемые приложения на Go. Мы рассмотрим как классические паттерны, адаптированные под Go, так и специфичные для Go подходы.

## Почему важны паттерны и архитектура?

Правильно выбранные паттерны и архитектура позволяют:
- Создавать гибкие и расширяемые системы
- Упрощать поддержку кода
- Повышать тестируемость
- Улучшать производительность
- Упрощать масштабирование

> 💡 **Интересный факт**: Go, в отличие от многих других языков, не требует строгого следования классическим паттернам ООП, что позволяет создавать более простые и эффективные решения.

## Основные паттерны

### 1. Фабрика с опциями

```go
package main

import (
    "fmt"
    "time"
)

// Опции для конфигурации сервера
type ServerOptions struct {
    Host        string
    Port        int
    Timeout     time.Duration
    MaxConn     int
    EnableTLS   bool
}

// Функция-опция для изменения конфигурации
type Option func(*ServerOptions)

// Конструкторы опций
func WithHost(host string) Option {
    return func(o *ServerOptions) {
        o.Host = host
    }
}

func WithPort(port int) Option {
    return func(o *ServerOptions) {
        o.Port = port
    }
}

func WithTimeout(timeout time.Duration) Option {
    return func(o *ServerOptions) {
        o.Timeout = timeout
    }
}

// Создание сервера с опциями
func NewServer(opts ...Option) *ServerOptions {
    // Значения по умолчанию
    server := &ServerOptions{
        Host:      "localhost",
        Port:      8080,
        Timeout:   time.Second * 30,
        MaxConn:   100,
        EnableTLS: false,
    }

    // Применяем опции
    for _, opt := range opts {
        opt(server)
    }

    return server
}

func main() {
    // Создаём сервер с кастомными опциями
    server := NewServer(
        WithHost("api.example.com"),
        WithPort(443),
        WithTimeout(time.Second * 60),
    )

    fmt.Printf("Сервер: %+v\n", server)
}
```

**Объяснение:**
- Паттерн "Фабрика с опциями" позволяет гибко конфигурировать объекты
- Каждая опция - это функция, модифицирующая конфигурацию
- Значения по умолчанию обеспечивают работоспособность без явной конфигурации

**Ожидаемый вывод:**
```
Сервер: {Host:api.example.com Port:443 Timeout:1m0s MaxConn:100 EnableTLS:false}
```

### 2. Middleware

```go
package main

import (
    "fmt"
    "net/http"
    "time"
)

// Тип для middleware
type Middleware func(http.HandlerFunc) http.HandlerFunc

// Логирование запросов
func Logging() Middleware {
    return func(next http.HandlerFunc) http.HandlerFunc {
        return func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()
            defer func() {
                fmt.Printf("Запрос: %s %s, время: %v\n",
                    r.Method, r.URL.Path, time.Since(start))
            }()
            next(w, r)
        }
    }
}

// Проверка аутентификации
func Auth() Middleware {
    return func(next http.HandlerFunc) http.HandlerFunc {
        return func(w http.ResponseWriter, r *http.Request) {
            token := r.Header.Get("Authorization")
            if token == "" {
                http.Error(w, "Unauthorized", http.StatusUnauthorized)
                return
            }
            next(w, r)
        }
    }
}

// Применение middleware
func Chain(f http.HandlerFunc, middlewares ...Middleware) http.HandlerFunc {
    for i := len(middlewares) - 1; i >= 0; i-- {
        f = middlewares[i](f)
    }
    return f
}

// Обработчик
func handler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello, World!")
}

func main() {
    // Создаём обработчик с middleware
    http.HandleFunc("/", Chain(handler, Logging(), Auth()))
    
    // Запускаем сервер
    fmt.Println("Сервер запущен на :8080")
    http.ListenAndServe(":8080", nil)
}
```

**Объяснение:**
- Middleware позволяет добавлять функциональность к обработчикам
- Каждый middleware - это функция, принимающая и возвращающая HandlerFunc
- Chain применяет middleware в правильном порядке

## Архитектурные паттерны

### 1. Clean Architecture

```go
package main

import (
    "fmt"
    "time"
)

// Domain layer
type User struct {
    ID        int
    Name      string
    Email     string
    CreatedAt time.Time
}

// Repository interface
type UserRepository interface {
    FindByID(id int) (*User, error)
    Save(user *User) error
}

// Use case
type UserService struct {
    repo UserRepository
}

func NewUserService(repo UserRepository) *UserService {
    return &UserService{repo: repo}
}

func (s *UserService) GetUser(id int) (*User, error) {
    return s.repo.FindByID(id)
}

// Infrastructure layer
type InMemoryUserRepository struct {
    users map[int]*User
}

func NewInMemoryUserRepository() *InMemoryUserRepository {
    return &InMemoryUserRepository{
        users: make(map[int]*User),
    }
}

func (r *InMemoryUserRepository) FindByID(id int) (*User, error) {
    user, exists := r.users[id]
    if !exists {
        return nil, fmt.Errorf("user not found")
    }
    return user, nil
}

func (r *InMemoryUserRepository) Save(user *User) error {
    r.users[user.ID] = user
    return nil
}

func main() {
    // Создаём зависимости
    repo := NewInMemoryUserRepository()
    service := NewUserService(repo)

    // Создаём тестового пользователя
    user := &User{
        ID:        1,
        Name:      "Иван",
        Email:     "ivan@example.com",
        CreatedAt: time.Now(),
    }
    repo.Save(user)

    // Получаем пользователя
    foundUser, err := service.GetUser(1)
    if err != nil {
        fmt.Printf("Ошибка: %v\n", err)
        return
    }
    fmt.Printf("Найден пользователь: %+v\n", foundUser)
}
```

**Объяснение:**
- Clean Architecture разделяет код на слои
- Каждый слой зависит только от внутренних слоёв
- Интерфейсы определяют контракты между слоями
- Легко тестировать и модифицировать

**Ожидаемый вывод:**
```
Найден пользователь: &{ID:1 Name:Иван Email:ivan@example.com CreatedAt:2024-03-21 10:00:00 +0000 UTC}
```

### 2. CQRS (Command Query Responsibility Segregation)

```go
package main

import (
    "fmt"
    "sync"
)

// Команды
type CreateUserCommand struct {
    Name  string
    Email string
}

type UpdateUserCommand struct {
    ID    int
    Name  string
    Email string
}

// Запросы
type GetUserQuery struct {
    ID int
}

// Модель
type User struct {
    ID    int
    Name  string
    Email string
}

// Command Handler
type CommandHandler struct {
    mu    sync.RWMutex
    users map[int]*User
}

func NewCommandHandler() *CommandHandler {
    return &CommandHandler{
        users: make(map[int]*User),
    }
}

func (h *CommandHandler) HandleCreate(cmd CreateUserCommand) (*User, error) {
    h.mu.Lock()
    defer h.mu.Unlock()

    id := len(h.users) + 1
    user := &User{
        ID:    id,
        Name:  cmd.Name,
        Email: cmd.Email,
    }
    h.users[id] = user
    return user, nil
}

// Query Handler
type QueryHandler struct {
    commandHandler *CommandHandler
}

func NewQueryHandler(ch *CommandHandler) *QueryHandler {
    return &QueryHandler{commandHandler: ch}
}

func (h *QueryHandler) HandleGet(query GetUserQuery) (*User, error) {
    h.commandHandler.mu.RLock()
    defer h.commandHandler.mu.RUnlock()

    user, exists := h.commandHandler.users[query.ID]
    if !exists {
        return nil, fmt.Errorf("user not found")
    }
    return user, nil
}

func main() {
    // Создаём обработчики
    cmdHandler := NewCommandHandler()
    queryHandler := NewQueryHandler(cmdHandler)

    // Создаём пользователя
    user, err := cmdHandler.HandleCreate(CreateUserCommand{
        Name:  "Иван",
        Email: "ivan@example.com",
    })
    if err != nil {
        fmt.Printf("Ошибка: %v\n", err)
        return
    }

    // Получаем пользователя
    foundUser, err := queryHandler.HandleGet(GetUserQuery{ID: user.ID})
    if err != nil {
        fmt.Printf("Ошибка: %v\n", err)
        return
    }
    fmt.Printf("Найден пользователь: %+v\n", foundUser)
}
```

**Объяснение:**
- CQRS разделяет операции на команды и запросы
- Команды изменяют состояние
- Запросы только читают данные
- Разделение упрощает масштабирование

**Ожидаемый вывод:**
```
Найден пользователь: &{ID:1 Name:Иван Email:ivan@example.com}
```

## Практические задания

### Задание 1: Микросервисная архитектура
Создайте базовую структуру микросервиса, которая:
1. Использует Clean Architecture
2. Поддерживает CQRS
3. Включает middleware для логирования и мониторинга
4. Имеет конфигурацию через опции

**Ожидаемый результат:**
- Масштабируемая архитектура
- Чёткое разделение ответственности
- Гибкая конфигурация
- Лёгкость тестирования

### Задание 2: Event Sourcing
Реализуйте систему с Event Sourcing, которая:
1. Хранит все изменения как события
2. Восстанавливает состояние из событий
3. Поддерживает проекции для быстрого чтения
4. Обеспечивает атомарность операций

**Ожидаемый результат:**
- Надёжное хранение данных
- Возможность аудита
- Высокая производительность
- Масштабируемость

### Задание 3: Шаблон Repository
Создайте универсальный репозиторий, который:
1. Работает с любыми типами данных
2. Поддерживает CRUD операции
3. Включает кэширование
4. Обеспечивает транзакционность

**Ожидаемый результат:**
- Универсальный доступ к данным
- Эффективное кэширование
- Надёжные транзакции
- Чистый интерфейс

> 🎯 **Цель главы**: К концу этой главы вы должны уметь:
> - Применять продвинутые паттерны проектирования
> - Создавать масштабируемые архитектуры
> - Разделять ответственность в коде
> - Писать поддерживаемые системы 