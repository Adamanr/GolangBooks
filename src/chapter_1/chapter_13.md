# Работа с ошибками

В языке Go обработка ошибок — это важная часть программирования. Go не использует механизмы исключений, как в Java или Python, и вместо этого предлагает более прямолинейный подход — через возвращение ошибок в виде значений. Это делает код прозрачным и предсказуемым, поскольку ошибки проверяются и обрабатываются в критических местах программы.

### Как устроены ошибки в Go?

Ошибки в Go представлены через тип `error`. Этот тип является интерфейсом:

```go
type error interface {
    Error() string
}
```

Он определяет единственный метод `Error()`, который возвращает строку с описанием ошибки. Стандартная библиотека Go предоставляет множество ошибок, но вы также можете создавать свои собственные.

### Основной способ работы с ошибками

При вызове функций, которые могут вернуть ошибку, принято проверять возвращаемое значение и обрабатывать возможные ошибки.

```go
package main

import (
    "fmt"
    "os"
)

func main() {
    file, err := os.Open("nonexistent_file.txt")
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    defer file.Close()

    fmt.Println("Файл открыт успешно")
}
```

Здесь функция `os.Open` возвращает указатель на файл и ошибку. Если файл не удаётся открыть, возвращается ошибка, которую нужно проверить и обработать.

### Создание собственных ошибок через `errors.New` и `fmt.Errorf`

Для создания своих ошибок в Go можно использовать стандартные методы `errors.New` и `fmt.Errorf`:

```go
package main

import (
    "errors"
    "fmt"
)

func doSomething(val int) error {
    if val < 0 {
        return errors.New("недопустимое значение")
    }
    return nil
}

func main() {
    err := doSomething(-1)
    if err != nil {
        fmt.Println("Ошибка:", err)
    }
}
```

В примере выше мы используем `errors.New` для создания базовой ошибки. 

#### Форматирование ошибок с помощью `fmt.Errorf`

Иногда полезно создавать ошибки с форматированными строками:

```go
package main

import (
    "fmt"
)

func doSomething(val int) error {
    if val < 0 {
        return fmt.Errorf("недопустимое значение: %d", val)
    }
    return nil
}

func main() {
    err := doSomething(-1)
    if err != nil {
        fmt.Println("Ошибка:", err)
    }
}
```

Здесь `fmt.Errorf` позволяет динамически добавить значение переменной в сообщение об ошибке.

### Создание собственных ошибок через структуры

Более продвинутый способ создания ошибок — это создание собственных типов ошибок с помощью структур. Это полезно, когда вам нужно передать дополнительную информацию через ошибки.

Пример создания ошибки через структуру:

```go
package main

import (
    "fmt"
)

type MyError struct {
    Code    int
    Message string
}

func (e *MyError) Error() string {
    return fmt.Sprintf("код ошибки: %d, сообщение: %s", e.Code, e.Message)
}

func doSomething() error {
    return &MyError{Code: 404, Message: "страница не найдена"}
}

func main() {
    err := doSomething()
    if err != nil {
        fmt.Println("Ошибка:", err)
    }
}
```

Здесь мы определяем структуру `MyError`, которая реализует метод `Error()`. Это позволяет нам использовать собственный тип ошибки с дополнительной информацией, такой как код ошибки.

### Заворачивание ошибок (`Wrap error`)

Go предоставляет возможность заворачивать ошибки, добавляя дополнительный контекст. Для этого используется механизм, появившийся с Go 1.13, где через функцию `fmt.Errorf` можно "оборачивать" ошибку с помощью специального формата `%w`.

Пример:

```go
package main

import (
    "errors"
    "fmt"
)

var ErrNotFound = errors.New("объект не найден")

func doSomething() error {
    return fmt.Errorf("ошибка при выполнении функции: %w", ErrNotFound)
}

func main() {
    err := doSomething()
    if errors.Is(err, ErrNotFound) {
        fmt.Println("Произошла ошибка: объект не найден")
    } else {
        fmt.Println("Произошла другая ошибка:", err)
    }
}
```

Здесь мы "оборачиваем" исходную ошибку `ErrNotFound`, добавляя к ней дополнительный контекст. Позже с помощью `errors.Is` можно проверить, является ли ошибка завернутой внутри основной ошибки.

### `errors.Is` и `errors.As`

Начиная с Go 1.13, появились функции `errors.Is` и `errors.As`, которые помогают работать с ошибками, завёрнутыми друг в друга:

- **`errors.Is`** проверяет, соответствует ли ошибка ожидаемой.
- **`errors.As`** позволяет преобразовать ошибку в конкретный тип.

Пример использования `errors.As`:

```go
package main

import (
    "errors"
    "fmt"
)

type MyError struct {
    Code    int
    Message string
}

func (e *MyError) Error() string {
    return fmt.Sprintf("код ошибки: %d, сообщение: %s", e.Code, e.Message)
}

func doSomething() error {
    return &MyError{Code: 500, Message: "внутренняя ошибка сервера"}
}

func main() {
    err := doSomething()
    var myErr *MyError
    if errors.As(err, &myErr) {
        fmt.Printf("Ошибка с кодом %d: %s\n", myErr.Code, myErr.Message)
    } else {
        fmt.Println("Произошла другая ошибка:", err)
    }
}
```

Здесь `errors.As` позволяет преобразовать ошибку к типу `MyError`, чтобы получить доступ к её полям.

### Полезные задания для практики:

1. **Создание пользовательских ошибок:**
   Напишите структуру для кастомной ошибки, которая содержит код ошибки и текст. Реализуйте метод `Error()` для этой структуры. Создайте функцию, которая будет возвращать такую ошибку в зависимости от входных данных.

2. **Работа с обёрнутыми ошибками:**
   Напишите функцию, которая вызывает другую функцию и оборачивает её ошибку, добавляя контекст с помощью `%w`. Проверьте тип и исходную ошибку с помощью `errors.Is`.

3. **Использование `errors.As`:**
   Реализуйте программу, в которой генерируются ошибки разных типов. Используйте `errors.As` для проверки и обработки конкретных типов ошибок.

4. **Паника и восстановление:**
   Напишите функцию, которая вызывает панику при делении на ноль. Используйте `recover`, чтобы восстановить программу и вернуть осмысленную ошибку.

5. **Цепочка ошибок:**
   Реализуйте цепочку вызовов функций, где каждая функция может возвращать ошибку. Оборачивайте ошибки с дополнительным контекстом и проверяйте их тип с помощью `errors.Is`.