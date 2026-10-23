# КОКОФРЕШ — сайт ресторана

Одностраничный сайт ресторана и гастробара «КОКОФРЕШ» (Москва, Староалексеевская, 20).

**Идея:** весь сайт — это процесс приготовления дорогого ресторанного завтрака. На первом экране над пустой тарелкой парят ингредиенты. С каждым следующим блоком один шаг приготовления продолжает предыдущий. Если листать назад, анимация не откатывается: блюдо остаётся в том состоянии, до которого дошло. Фон плавно меняет цвет (беж → бургунди → хаки), а фото и крупные надписи двигаются с лёгким параллаксом.

| Блок | Шаг анимации |
|---|---|
| Первый экран | 00 — тарелка опускается, ингредиенты на «орбите» |
| 01 О нас | бриошь ложится на тарелку |
| 02 Завтрак «Шведский стол» | лосось и авокадо |
| 03 Фермерские продукты | фермерское яйцо раскалывается → два яйца пашот |
| 04 Меню à la carte | сверху льётся соус голландез |
| 05 Винная карта | микрозелень, икра, травяное масло, перец |
| 06 Кофе и чай | кофейные зёрна превращаются в капучино с латте-артом |
| 07 Мероприятия | подача: салфетка, золотые приборы, веточка оливы |

Дальше идут галерея, доставка, контакты с картой и футер. Полное меню, винная и барная карты открываются во всплывающем окне; перед алкогольными картами спрашиваем возраст. Бронирование и запрос на мероприятие собирают сообщение и открывают WhatsApp ресторана (у запроса на мероприятие можно выбрать и почту).

## Структура

```
index.html          разметка + SVG-сцена завтрака
css/style.css       стили, палитра, адаптив
js/scene.js         шаги анимации (GSAP)
js/app.js           скролл (Lenis), параллакс, темы, модальные окна, формы
js/menu-data.js     меню, бар и винная карта
assets/photos/      фото ресторана с cocofresh.ru
assets/anim/        сюда кладутся сгенерированные PNG для сцены
assets/brand/       логотипы партнёров доставки, favicon
```

## Запуск локально

```bash
python3 -m http.server 5173
```

Затем откройте http://localhost:5173

## Как заменить иллюстрации на сгенерированные картинки

Сейчас сцена нарисована векторными иллюстрациями, поэтому всё работает и без картинок. Чтобы сделать её фотореалистичной:

1. Сгенерируйте PNG **с прозрачным фоном** по промптам ниже.
2. Положите файлы в `assets/anim/` с точными именами из таблицы.
3. Добавьте имена файлов (без `.png`) в список `ANIM_IMAGES` в начале `js/scene.js`, например:
   `const ANIM_IMAGES = ['plate', 'brioche-half', 'egg-poached'];`

Каждая картинка встанет на место своей иллюстрации и будет анимироваться так же. Можно заменять по одной.

### Общий стиль (добавляйте в конец КАЖДОГО промпта)

> Photorealistic high-end food photography for a Michelin-star restaurant. Strict top-down overhead flat-lay view, camera exactly 90° above the object. Soft diffused natural daylight from the upper left, gentle highlights. Single isolated object, centered, on a fully transparent background (PNG with alpha channel). No table, no surface, no cast shadow, no text, no watermark. Crisp detail, appetizing, warm natural colors.

### Промпты

| Файл | Формат | Промпт |
|---|---|---|
| `plate.png` | квадрат 1:1 | An empty round matte cream-white porcelain dinner plate with a wide flat rim and one thin burgundy (#7A1E2C) line along the rim edge, spotless, the plate fills 95% of the frame. |
| `brioche-half.png` | 1:1 | One round brioche bun half, cut side facing up, toasted in butter to a golden-brown crumb with darker caramelized edges and a thin brown crust ring, fills 90% of the frame. |
| `salmon-rosette.png` | 1:1 | A rosette of thinly sliced lightly salted salmon folded into a flower shape, glossy coral-orange flesh with delicate white fat lines, fills 90% of the frame. |
| `avocado-fan.png` | 1:1 | Six thin slices of ripe avocado fanned out, the narrow ends meet at the middle of the left edge and the slices spread to the right, pale yellow-green flesh with a thin dark green skin edge, fills 80% of the frame. |
| `egg-poached.png` | 1:1 | One perfect poached egg, smooth soft white with a slightly irregular organic edge and a warm yolk glow showing through the center, fills 90% of the frame. |
| `egg-hollandaise.png` | 1:1 | The same poached egg generously coated with glossy, silky hollandaise sauce dripping down the sides, a pinch of red paprika on top, fills 90% of the frame. |
| `microgreens.png` | 1:1 | A single small sprig of fresh pea microgreens: thin pale stem with two bright green leaves, fills 80% of the frame. |
| `caviar.png` | 1:1 | A small neat cluster of about ten glossy red salmon caviar pearls with tiny highlights, fills 80% of the frame. |
| `egg-whole.png` | вертикальный 2:3 | One whole raw farm chicken egg lying on its side, oriented vertically (narrow end at the top), warm cream-beige shell with a few tiny freckles, fills 75% of the frame height. |
| `coffee-bean.png` | 1:1 | A single roasted coffee bean, vertical, the center crease visible, rich dark-brown with a soft sheen, fills 75% of the frame. |
| `cappuccino.png` | 1:1 | A cappuccino in a round white porcelain cup on a matching saucer, a heart-shaped latte art on velvety microfoam, the cup handle pointing to the lower right, a small brass-gold spoon resting on the saucer, the saucer fills 95% of the frame. |
| `napkin.png` | вертикальный 2:3 | A neatly folded rectangular burgundy (#5B1423) linen napkin with fine woven texture and a subtle stitched hem, fills 90% of the frame height. |
| `cutlery.png` | вертикальный 2:3 | A brushed brass-gold fork and knife lying vertically side by side, fork on the left with tines at the top, knife on the right with the blade at the top, fills 95% of the frame height. |
| `olive-branch.png` | горизонтальный 3:2 | A small fresh olive branch with eight narrow sage-green leaves and two dark purple-black olives, the stem starts at the left edge and rises gently to the right, fills 90% of the frame width. |

**Советы:**
- Если фон получился непрозрачным, уберите его в remove.bg или Photoshop: нужен PNG с альфа-каналом.
- Сохраняйте одинаковый вид сверху и одинаковый свет у всех картинок, тогда сцена будет выглядеть как одна фотография.
- Тень добавляется кодом, поэтому на картинках её быть не должно.
- 1024–2048 px по большей стороне достаточно; перед загрузкой лучше сжать PNG (например, через TinyPNG).

## Технологии

HTML/CSS/JS без сборки · [GSAP 3](https://gsap.com) — анимация сцены · [Lenis](https://lenis.darkroom.engineering) — плавный скролл · Google Fonts: Cormorant Garamond, Manrope, IBM Plex Mono.

Контент (тексты, меню, винная карта, часы работы, контакты) взят с https://cocofresh.ru/.
