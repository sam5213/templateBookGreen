document.addEventListener("DOMContentLoaded", () => {
  // Элементы интерфейса
  const welcomePage = document.getElementById("welcome-page")
  const surveyPage = document.getElementById("survey-page")
  const calendarPage = document.getElementById("calendar-page")
  const successPage = document.getElementById("success-page")
  const startSurveyBtn = document.getElementById("start-survey")
  const questionContainer = document.getElementById("question-container")
  const progressBar = document.getElementById("progress")
  const calendarDays = document.getElementById("calendar-days")
  const monthYearElement = document.getElementById("month-year")
  const prevMonthBtn = document.getElementById("prev-month")
  const nextMonthBtn = document.getElementById("next-month")
  const timeSlots = document.getElementById("time-slots")
  const slotsContainer = document.getElementById("slots-container")
  const selectedDateElement = document.getElementById("selected-date")
  const bookButton = document.getElementById("book-button")
  const bookedDateElement = document.getElementById("booked-date")
  const bookedTimeElement = document.getElementById("booked-time")
  const backToHomeBtn = document.getElementById("back-to-home")

  // Вопросы опроса
  const questions = [
    {
      id: 1,
      question: "Какой запрос для консультирования для вас наиболее актуален?",
      options: [
        "Тревожность",
        "Сложности в отношениях",
        "Самооценка и неуверенность",
        "Семейные/детско-родительские конфликты",
        "Преодоление кризисных состояний",
      ],
    },
    {
      id: 2,
      question: "Какой метод работы вызывает у вас наибольший интерес?",
      options: [
        "Гештальт-терапия",
        "Метафорические ассоциативные карты (МАК)",
        "Психоанализ",
        "НЛП или ЭОТ",
        "Психологические игры",
      ],
    },
    {
      id: 3,
      question: "Какой формат консультации вы бы предпочли?",
      options: [
        "Онлайн (видео/аудио)",
        "Консультация по переписке",
        "МАК-расклад",
        "Участие в трансформационных играх",
      ],
    },
    {
      id: 4,
      question: "Как часто вы готовы заниматься?",
      options: [
        "Единичная консультация",
        "Раз в неделю",
        "Раз в две недели",
        "По необходимости",
        "Участвовать в онлайн-марафоне или трансформационной игре",
      ],
    },
    {
      id: 5,
      question: "Есть ли у вас опыт работы с психологом?",
      options: [
        "Да, я уже работал(а) с психологом",
        "Нет, это мой первый опыт",
        "Я пробовал(а), но не довел(а) до конца",
      ],
    },
    {
      id: 6,
      question: "Какой тип услуги вас интересует?",
      options: [
        "Онлайн консультация - 3000 рублей",
        "Консультация по переписке - 2000 рублей",
        "МАК расклад (метафорические ассоциативные карты ) - 2000 рублей",
      ],
    },
  ]

  // Состояние приложения
  let currentQuestionIndex = 0
  let answers = []
  const currentDate = new Date()
  let selectedDate = null
  let selectedTimeSlot = null
  let bookedSlots = {}

  // Объявление Telegram WebApp
  const Telegram = window.Telegram ? window.Telegram : { WebApp: { sendData: () => {} } }

  function isBase64(str) {
    try {
      return Buffer.from(str, "base64").toString("base64") === str
    } catch (error) {
      return false
    }
  }

  // Загрузка данных о слотах из GitHub Gist
  async function fetchSlotsFromGist() {
    try {
      const gistId = "1c39c85fe0366fd7e147e3efbe6a492b" // ID вашего Gist
      const fileName = "your_slots.csv"

      // Запрос к GitHub API для получения содержимого Gist
      const response = await fetch(`https://api.github.com/gists/${gistId}`)
      const data = await response.json()

      // Извлекаем содержимое файла
      const fileContent = data.files[fileName].content

      // Проверяем, является ли содержимое Base64
      let decodedContent
      if (isBase64(fileContent)) {
        decodedContent = Buffer.from(fileContent, "base64").toString("utf-8")
      } else {
        decodedContent = fileContent // Используем содержимое как есть
      }

      // Парсим CSV-данные
      const rows = decodedContent.split("\n")
      const headers = rows[0].split(",")

      // Формируем объект bookedSlots
      for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(",")
        const date = values[0]
        if (!date) continue

        bookedSlots[date] = []
        for (let j = 1; j < headers.length; j++) {
          bookedSlots[date].push({
            time: headers[j],
            available: values[j] === "TRUE",
          })
        }
      }
    } catch (error) {
      console.error("Ошибка загрузки слотов:", error)
    }
  }

  // Рендеринг календаря
  function renderCalendar() {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const monthNames = [
      "Январь",
      "Февраль",
      "Март",
      "Апрель",
      "Май",
      "Июнь",
      "Июль",
      "Август",
      "Сентябрь",
      "Октябрь",
      "Ноябрь",
      "Декабрь",
    ]
    monthYearElement.textContent = `${monthNames[month]} ${year}`
    calendarDays.innerHTML = ""
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayAdjusted = firstDay === 0 ? 6 : firstDay - 1

    for (let i = 0; i < firstDayAdjusted; i++) {
      calendarDays.appendChild(createDayElement(""))
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = createDayElement(day)
      const dateKey = formatDate(new Date(year, month, day))

      // Проверяем, есть ли доступные слоты для этой даты
      if (bookedSlots[dateKey]?.some((slot) => slot.available)) {
        dayElement.classList.add("available")
      } else {
        dayElement.classList.add("unavailable")
      }

      calendarDays.appendChild(dayElement)
    }
  }

  function createDayElement(day) {
    const element = document.createElement("div")
    element.className = "day" + (day === "" ? " empty" : "")
    element.textContent = day
    if (day !== "") {
      element.addEventListener("click", handleDayClick)
    }
    return element
  }

  // Обработчик выбора даты
  async function handleDayClick(event) {
    const selectedDay = Number.parseInt(event.target.textContent)
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    selectedDate = new Date(year, month, selectedDay)
    selectedDateElement.textContent = formatDate(selectedDate)
    timeSlots.classList.remove("hidden")
    await renderTimeSlots(selectedDate)

    console.log("Выбрана дата:", selectedDate) // Отладочный вывод
  }

  // Рендеринг временных слотов
  function renderTimeSlots(date) {
    const dateKey = formatDate(date)
    slotsContainer.innerHTML = ""
    const slotsForDate = bookedSlots[dateKey] || []
    ;["10:00", "12:00", "14:00", "16:00", "18:00", "20:00"].forEach((time) => {
      const slot = document.createElement("div")
      slot.className = "time-slot"
      slot.textContent = time

      const slotData = slotsForDate.find((s) => s.time === time)
      if (slotData && !slotData.available) {
        slot.classList.add("booked")
      } else {
        slot.addEventListener("click", () => handleTimeSelect(time))
      }

      slotsContainer.appendChild(slot)
    })
  }

  // Обработчик выбора времени
  function handleTimeSelect(time, e) {
    document.querySelectorAll(".time-slot").forEach((s) => s.classList.remove("selected"))
    if (e && e.target) {
      e.target.classList.add("selected")
    }
    selectedTimeSlot = time
    bookButton.disabled = false // Активируем кнопку "Записаться"
    bookButton.classList.remove("disabled")
    bookButton.classList.add("book-button")

    console.log("Выбранное время:", selectedTimeSlot) // Отладочный вывод
  }

  // Бронирование слота
  async function bookSlot() {
    if (!selectedDate || !selectedTimeSlot) return
    try {
      sendDataToTelegram()
    } catch (error) {
      alert("Ошибка бронирования: " + error.message)
    }
  }

  function sendDataToTelegram() {
    const user = Telegram.WebApp?.initDataUnsafe?.user;
  
    if (!user) {
      console.error("Пользователь не авторизован через Telegram WebApp");
      return;
    }
  
    const data = {
      user: {
        id: user.id, // ID пользователя Telegram
        username: user.username || "Не указан",
      },
      answers: answers.map((answer) => ({
        question: answer.questionId,
        answer: answer.answer,
      })),
      date: selectedDate ? formatDate(selectedDate) : null,
      time: selectedTimeSlot,
    };
  
    // Преобразуем данные в строку JSON
    const jsonData = JSON.stringify(data);
  
    // Отправляем данные через Telegram WebApp
    Telegram.WebApp.sendData(jsonData);
  }

  // Форматирование даты
  function formatDate(date) {
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}.${month}.${year}`
  }

  // Показ вопроса
  function showQuestion(index) {
    progressBar.style.width = `${(index / questions.length) * 100}%`
    const question = questions[index]
    questionContainer.innerHTML = `
            <div class="question-tile">
                <h3 class="question-title">${question.question}</h3>
                <div class="options">
                    ${question.options
                      .map(
                        (option, i) => `
                        <div class="option" data-index="${i}">${option}</div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        `
    questionContainer.querySelectorAll(".option").forEach((option) => {
      option.addEventListener("click", function () {
        this.classList.add("selected")
        answers[index] = {
          questionId: question.id,
          answer: question.options[Number.parseInt(this.dataset.index)],
        }
        setTimeout(() => {
          if (index < questions.length - 1) {
            showQuestion(index + 1)
          } else {
            surveyPage.classList.add("hidden")
            calendarPage.classList.remove("hidden")
            renderCalendar()
          }
        }, 500)
      })
    })
  }

  // Сброс состояния
  function resetState() {
    currentQuestionIndex = 0
    answers = []
    selectedDate = null
    selectedTimeSlot = null
    bookedSlots = {}
    progressBar.style.width = "0%"
  }

  // Навигация по месяцам
  function updateMonth(offset) {
    currentDate.setMonth(currentDate.getMonth() + offset)
    renderCalendar()
    timeSlots.classList.add("hidden")
  }

  // Инициализация событий
  startSurveyBtn.addEventListener("click", () => {
    welcomePage.classList.add("hidden")
    surveyPage.classList.remove("hidden")
    showQuestion(0)
  })

  backToHomeBtn.addEventListener("click", () => {
    successPage.classList.add("hidden")
    welcomePage.classList.remove("hidden")
    resetState()
  })

  bookButton.addEventListener("click", bookSlot)
  prevMonthBtn.addEventListener("click", () => updateMonth(-1))
  nextMonthBtn.addEventListener("click", () => updateMonth(1))

  // Первоначальная загрузка
  fetchSlotsFromGist().then(renderCalendar)
})
