/* Копия config.json для открытия через file://. Источник правды: config.json */
window.KOLESO_CONFIG = {
  "_note": "Редактируйте тексты, названия секторов, цвета и ссылки здесь. Если открываете index.html как файл (file://), то же самое дублируется в config.js.",
  "title": "Колесо возможностей",
  "subtitle": "Крутите колесо и получайте идею, совет или небольшой сюрприз.",
  "startLabel": "Начать",
  "spinLabel": "Крутить",
  "againLabel": "Крутить ещё",
  "shareLabel": "Поделиться",
  "contactLabel": "Написать",
  "demoNote": "Демо-прототип. Тексты и условия задаются в config.json.",
  "spin": {
    "duration": 2800,
    "minTurns": 3
  },
  "links": {
    "contact": "https://t.me/annawebpro",
    "contactIsPlaceholder": true,
    "_note": "Заглушка: ссылка t.me/annawebpro стоит временно, подставьте нужную.",
    "share": "https://t.me/annawebpro",
    "shareText": "Попробуйте колесо возможностей."
  },
  "sectors": [
    {
      "id": "idea",
      "title": "Идея",
      "icon": "idea",
      "texts": [
        "Запишите три мысли о задаче за пять минут, не редактируя.",
        "Выберите самую неожиданную мысль и разверните её в короткий план."
      ]
    },
    {
      "id": "advice",
      "title": "Совет",
      "icon": "advice",
      "texts": [
        "Начните с самого маленького шага: так проще перейти к большой задаче.",
        "Сделайте паузу и вернитесь к вопросу свежим взглядом."
      ]
    },
    {
      "id": "gift",
      "title": "Подарок",
      "icon": "gift",
      "texts": [
        "Подарок от владельца. Условия уточняйте при обращении."
      ]
    },
    {
      "id": "discount",
      "title": "Скидка",
      "icon": "discount",
      "texts": [
        "Скидка от владельца, условия уточняйте."
      ]
    },
    {
      "id": "challenge",
      "title": "Вызов",
      "icon": "challenge",
      "texts": [
        "Задание на сегодня: сделайте одно дело, которое давно откладывали.",
        "Попробуйте на день отказаться от одной привычной отговорки."
      ]
    },
    {
      "id": "inspire",
      "title": "Вдохновение",
      "icon": "inspire",
      "texts": [
        "Иногда помогает прогулка без цели и без телефона в руках.",
        "Посмотрите на привычную задачу так, будто видите её впервые."
      ]
    },
    {
      "id": "surprise",
      "title": "Сюрприз",
      "icon": "surprise",
      "texts": [
        "Здесь может быть любой сюрприз. В демо это пример карточки, содержимое меняется в config.json."
      ]
    },
    {
      "id": "again",
      "title": "Ещё раз",
      "icon": "again",
      "texts": [
        "Колесо предлагает попробовать ещё раз."
      ]
    }
  ],
  "colors": {
    "bg": "#f5f2fb",
    "bg2": "#ebe5f7",
    "text": "#2e2a45",
    "muted": "#4f4a6a",
    "accent": "#4b3f72",
    "accent2": "#8c7bc4",
    "gold": "#e8c4b0",
    "card": "#ffffff",
    "line": "#4b3f72",
    "label": "#2e2a45",
    "sec-stroke": "#f5f2fb",
    "scrim": "rgba(46,42,69,.38)",
    "ink": "#2e2a45"
  },
  "wheel": {
    "sectorFill": [
      "#b9a9e3",
      "#e3dcf5",
      "#cdbfee",
      "#f0ebfa"
    ],
    "iconColors": [
      "#2e2a45"
    ],
    "glow": false,
    "bulbs": 0,
    "icons": false,
    "labels": false
  },
  "effect": {
    "type": "confetti",
    "colors": [
      "#b9a9e3",
      "#e8c4b0",
      "#8c7bc4",
      "#4b3f72"
    ],
    "shape": "rect"
  },
  "kicker": "Демо"
};
