# Структуры в Go: организация данных и поведение

В этом уроке мы изучим структуры — один из самых мощных инструментов Go для организации данных и поведения. Структуры позволяют создавать сложные типы данных, которые могут содержать как данные, так и методы для работы с ними.

## Почему важны структуры?

Структуры в Go необходимы для:
- Группировки связанных данных
- Создания пользовательских типов
- Инкапсуляции данных и поведения
- Реализации объектно-ориентированного подхода
- Создания сложных структур данных

> 💡 **Интересный факт**: В Go нет классов, но структуры с методами позволяют реализовать многие концепции объектно-ориентированного программирования.

## Основы структур

### 1. Создание и использование структур

```go
type Person struct {
    Name    string
    Age     int
    Address struct {
        City    string
        Country string
    }
}

func main() {
    // Создание структуры
    person := Person{
        Name: "Иван",
        Age:  30,
        Address: struct {
            City    string
            Country string
        }{
            City:    "Москва",
            Country: "Россия",
        },
    }
    
    // Доступ к полям
    fmt.Printf("%s живёт в %s\n", person.Name, person.Address.City)
}
```

### 2. Методы структур

```go
type Rectangle struct {
    Width  float64
    Height float64
}

// Метод с получателем-значением
func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

// Метод с получателем-указателем
func (r *Rectangle) Scale(factor float64) {
    r.Width *= factor
    r.Height *= factor
}

func main() {
    rect := Rectangle{Width: 10, Height: 5}
    fmt.Println("Площадь:", rect.Area())
    
    rect.Scale(2)
    fmt.Println("Новая площадь:", rect.Area())
}
```

## Продвинутые техники

### 1. Встраивание структур

```go
type Animal struct {
    Name string
    Age  int
}

type Dog struct {
    Animal
    Breed string
}

func (a Animal) Speak() string {
    return "Я животное"
}

func (d Dog) Speak() string {
    return "Гав-гав!"
}

func main() {
    dog := Dog{
        Animal: Animal{Name: "Рекс", Age: 3},
        Breed:  "Овчарка",
    }
    
    fmt.Println(dog.Name)      // Доступ к встроенному полю
    fmt.Println(dog.Speak())   // Вызов переопределённого метода
}
```

### 2. Интерфейсы и структуры

```go
type Speaker interface {
    Speak() string
}

type Cat struct {
    Name string
}

func (c Cat) Speak() string {
    return "Мяу!"
}

func MakeSound(s Speaker) {
    fmt.Println(s.Speak())
}

func main() {
    cat := Cat{Name: "Мурзик"}
    MakeSound(cat)
}
```

### 3. Теги структур

```go
type User struct {
    ID        int    `json:"id"`
    Username  string `json:"username"`
    Password  string `json:"-"` // Поле будет пропущено при сериализации
    CreatedAt time.Time `json:"created_at"`
}

func main() {
    user := User{
        ID:        1,
        Username:  "admin",
        Password:  "secret",
        CreatedAt: time.Now(),
    }
    
    data, _ := json.Marshal(user)
    fmt.Println(string(data))
}
```

## Практические примеры

### 1. Кэш с TTL

```go
type Cache struct {
    mu    sync.RWMutex
    items map[string]struct {
        value      interface{}
        expiration time.Time
    }
}

func (c *Cache) Set(key string, value interface{}, ttl time.Duration) {
    c.mu.Lock()
    defer c.mu.Unlock()
    
    c.items[key] = struct {
        value      interface{}
        expiration time.Time
    }{
        value:      value,
        expiration: time.Now().Add(ttl),
    }
}

func (c *Cache) Get(key string) (interface{}, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()
    
    item, exists := c.items[key]
    if !exists || time.Now().After(item.expiration) {
        return nil, false
    }
    return item.value, true
}
```

### 2. Очередь задач

```go
type Task struct {
    ID        string
    Payload   interface{}
    Priority  int
    CreatedAt time.Time
}

type TaskQueue struct {
    tasks chan Task
    wg    sync.WaitGroup
}

func NewTaskQueue(workers int) *TaskQueue {
    q := &TaskQueue{
        tasks: make(chan Task, 100),
    }
    
    q.wg.Add(workers)
    for i := 0; i < workers; i++ {
        go q.worker()
    }
    
    return q
}

func (q *TaskQueue) worker() {
    defer q.wg.Done()
    for task := range q.tasks {
        // Обработка задачи
        fmt.Printf("Обработка задачи %s\n", task.ID)
    }
}
```

## Практические задания

### Задание 1: Система управления библиотекой
Создайте структуры для:
1. Книги (название, автор, год издания, статус)
2. Читателя (имя, контакты, список взятых книг)
3. Библиотеки (каталог книг, список читателей)
Реализуйте методы для:
- Выдачи и возврата книг
- Поиска книг по различным критериям
- Отслеживания статуса книг

### Задание 2: Система управления задачами
Разработайте систему для:
1. Создания и управления задачами
2. Назначения задач пользователям
3. Отслеживания прогресса
4. Установки приоритетов и сроков
Используйте:
- Вложенные структуры
- Методы с указателями
- Интерфейсы для разных типов задач

### Задание 3: Система мониторинга
Создайте систему для:
1. Сбора метрик с серверов
2. Хранения исторических данных
3. Генерации отчётов
4. Оповещения о проблемах
Реализуйте:
- Потокобезопасные структуры данных
- Эффективное хранение временных рядов
- Гибкую систему оповещений

## Что дальше?

В следующем уроке мы:
- Изучим интерфейсы в Go
- Познакомимся с рефлексией
- Узнаем о тегах структур
- Начнём писать более сложные программы

> 🎯 **Цель урока**: К концу этого урока вы должны уметь:
> - Создавать и использовать структуры
> - Работать с методами и указателями
> - Применять встраивание структур
> - Использовать теги для сериализации
