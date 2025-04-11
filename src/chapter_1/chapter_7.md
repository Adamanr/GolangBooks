# Методы синхронизации между горутинами

В этом уроке мы изучим различные методы синхронизации между горутинами в Go. Правильная синхронизация — это ключ к созданию надёжных и эффективных параллельных программ.

## Почему важна синхронизация?

Синхронизация горутин необходима для:
- Предотвращения гонок данных (race conditions)
- Координации работы между горутинами
- Безопасного доступа к общим ресурсам
- Эффективного использования системных ресурсов

> 💡 **Интересный факт**: В Go есть поговорка "Не общайтесь, разделяя память. Разделяйте память, общаясь". Это означает, что каналы предпочтительнее мьютексов для синхронизации.

## Основные методы синхронизации

### 1. WaitGroup — ожидание завершения горутин

`sync.WaitGroup` — это простой и эффективный способ дождаться завершения группы горутин.

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func worker(id int, wg *sync.WaitGroup) {
    defer wg.Done() // Уменьшаем счётчик при завершении
    
    fmt.Printf("Работник %d начал\n", id)
    time.Sleep(time.Second)
    fmt.Printf("Работник %d закончил\n", id)
}

func main() {
    var wg sync.WaitGroup
    
    // Запускаем 5 работников
    for i := 1; i <= 5; i++ {
        wg.Add(1) // Увеличиваем счётчик
        go worker(i, &wg)
    }
    
    wg.Wait() // Ждём завершения всех работников
    fmt.Println("Все работники завершили работу")
}
```

### 2. Mutex — защита общих данных

`sync.Mutex` используется для защиты общих данных от одновременного доступа.

```go
package main

import (
    "fmt"
    "sync"
)

type SafeCounter struct {
    mu    sync.Mutex
    count int
}

func (c *SafeCounter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.count++
}

func (c *SafeCounter) Value() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.count
}

func main() {
    counter := SafeCounter{}
    var wg sync.WaitGroup
    
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counter.Increment()
        }()
    }
    
    wg.Wait()
    fmt.Println("Итоговый счётчик:", counter.Value())
}
```

### 3. RWMutex — оптимизированная блокировка

`sync.RWMutex` позволяет нескольким горутинам читать данные одновременно, но блокирует их при записи.

```go
type SafeMap struct {
    mu   sync.RWMutex
    data map[string]string
}

func (m *SafeMap) Get(key string) string {
    m.mu.RLock()
    defer m.mu.RUnlock()
    return m.data[key]
}

func (m *SafeMap) Set(key, value string) {
    m.mu.Lock()
    defer m.mu.Unlock()
    m.data[key] = value
}
```

## Каналы для синхронизации

### 1. Небуферизированные каналы

```go
func worker(done chan bool) {
    fmt.Println("Работа начинается...")
    time.Sleep(time.Second)
    fmt.Println("Работа завершена")
    done <- true
}

func main() {
    done := make(chan bool)
    go worker(done)
    <-done // Ждём завершения
}
```

### 2. Буферизированные каналы

```go
func main() {
    ch := make(chan int, 3)
    
    // Отправляем три значения без блокировки
    ch <- 1
    ch <- 2
    ch <- 3
    
    // Читаем значения
    fmt.Println(<-ch)
    fmt.Println(<-ch)
    fmt.Println(<-ch)
}
```

### 3. Select для работы с несколькими каналами

```go
func main() {
    ch1 := make(chan string)
    ch2 := make(chan string)
    
    go func() {
        time.Sleep(time.Second)
        ch1 <- "сообщение 1"
    }()
    
    go func() {
        time.Sleep(2 * time.Second)
        ch2 <- "сообщение 2"
    }()
    
    select {
    case msg := <-ch1:
        fmt.Println(msg)
    case msg := <-ch2:
        fmt.Println(msg)
    case <-time.After(3 * time.Second):
        fmt.Println("таймаут")
    }
}
```

## Продвинутые техники

### 1. sync.Map для конкурентного доступа

```go
func main() {
    var m sync.Map
    
    // Запись
    m.Store("key", "value")
    
    // Чтение
    if value, ok := m.Load("key"); ok {
        fmt.Println(value)
    }
    
    // Перебор
    m.Range(func(key, value interface{}) bool {
        fmt.Println(key, value)
        return true
    })
}
```

### 2. sync.Cond для сложной синхронизации

```go
type WorkerPool struct {
    cond *sync.Cond
    mu   sync.Mutex
    jobs int
}

func (p *WorkerPool) AddJob() {
    p.mu.Lock()
    p.jobs++
    p.cond.Signal()
    p.mu.Unlock()
}

func (p *WorkerPool) Worker() {
    p.mu.Lock()
    for p.jobs == 0 {
        p.cond.Wait()
    }
    p.jobs--
    p.mu.Unlock()
    
    // Выполнение работы
}
```

## Практические примеры

### 1. Пул воркеров с каналами

```go
type WorkerPool struct {
    tasks chan func()
    wg    sync.WaitGroup
}

func NewWorkerPool(size int) *WorkerPool {
    pool := &WorkerPool{
        tasks: make(chan func()),
    }
    
    pool.wg.Add(size)
    for i := 0; i < size; i++ {
        go func() {
            defer pool.wg.Done()
            for task := range pool.tasks {
                task()
            }
        }()
    }
    
    return pool
}
```

### 2. Ограничение количества горутин

```go
func processTasks(tasks []string, maxWorkers int) {
    semaphore := make(chan struct{}, maxWorkers)
    var wg sync.WaitGroup
    
    for _, task := range tasks {
        wg.Add(1)
        semaphore <- struct{}{}
        
        go func(t string) {
            defer func() {
                <-semaphore
                wg.Done()
            }()
            
            // Обработка задачи
            fmt.Printf("Обработка: %s\n", t)
            time.Sleep(time.Second)
        }(task)
    }
    
    wg.Wait()
}
```

## Практические задания

### Задание 1: Параллельная обработка файлов
Создайте программу, которая:
1. Читает несколько файлов параллельно
2. Обрабатывает их содержимое
3. Объединяет результаты
4. Использует WaitGroup для синхронизации

### Задание 2: Кэш с конкурентным доступом
Напишите потокобезопасный кэш, который:
1. Хранит данные в map
2. Использует RWMutex для оптимизации
3. Поддерживает TTL для записей
4. Обеспечивает атомарные операции

### Задание 3: Система очередей
Создайте систему очередей, которая:
1. Принимает задачи через каналы
2. Обрабатывает их в пуле воркеров
3. Ограничивает количество одновременных задач
4. Предоставляет статус выполнения

## Что дальше?

В следующем уроке мы:
- Изучим паттерны параллельного программирования
- Познакомимся с контекстами в Go
- Узнаем о конкурентных структурах данных
- Начнём писать более сложные параллельные программы

> 🎯 **Цель урока**: К концу этого урока вы должны уметь:
> - Синхронизировать горутины различными способами
> - Защищать общие данные от гонок
> - Использовать каналы для коммуникации
> - Оптимизировать параллельные программы