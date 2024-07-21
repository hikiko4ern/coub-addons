# coub-addons

Web Extension, добавляющий дополнительный функционал на [Coub.com]

> [!WARNING]
> Расширение находится на раннем этапе разработки, поэтому временно:
>
> - тестируется только на Firefox-based браузерах (Firefox, Waterfox, LibreWolf и прочие лисьи форки) и может не работать в других\
>   например, фильтрация запросов сейчас построена на [`webRequest.filterResponseData`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/filterResponseData) и не будет работать в Chromium-based браузерах и Safari, в которых используемое API всё ещё не реализовано
> - не публикуется в сторах и не подписывается, из-за чего для постоянной установки требует отключенной проверки подписи (в Firefox это настройка `xpinstall.signatures.required`)
> - периодически могут вноситься обратно несовместимые изменения, требующие **ручной** миграции настроек (_хотя такого ещё ни разу не было, и, я надеюсь, не будет, но бэкапы делай, бэкапы - это здорово_)
> - проект ~~не следует SemVer и~~ плохо сконфигурирован (_да и в целом ведёт себя плохо_)
>
> Если всё прочитанное не отпугнуло желание попробовать, качай [последний релиз][latest-release] (_если я не забыл его создать_) или смотри секцию [Building](#building) с инструкцией по самостоятельной сборке

Минимальные поддерживаемые версии браузеров:

- Firefox 101

## Features

- скрытие дизлайкнутых коубов
- скрытие коубов, историй и комментариев от заблокированных каналов
- скрытие коубов по названию и тегам, содержащим указанные фразы или соответствующим регулярным выражениям
- скрытие рекоубов и репостов историй
- быстрое копирование/блокировка тега через контекстное меню
- интеграция с [Media Session API](https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API):
  - предоставление информации о текущем проигрываемом коубе
  - приостановка и возобновление воспроизведения (play/pause)
- предотвращение изменения скорости воспроизведения при нажатии <kbd>W</kbd>/<kbd>S</kbd>
- дополнительные клавиатурные сокращения:
  <!-- spell-checker: ignore islike ookmark ullscreen -->
  | действие                        | сочетание по умолчанию               |
  | :------------------------------ | :----------------------------------- |
  | поставить/убрать дизлайк        | <kbd>D</kbd> (<ins>D</ins>islike)    |
  | добавить/убрать из закладок     | <kbd>B</kbd> (<ins>B</ins>ookmark)   |
  | переключить полноэкранный режим | <kbd>F</kbd> (<ins>F</ins>ullscreen) |
  | скопировать ссылку на коуб      | —                                    |

  **NOTE:** если сокращения не работают (особенно если расширение только что было установлено/обновлено), попробуйте обновить страницу - данный функционал работает через вклинивание в виджеты Coub'а и требует применения патчей до момента создания виджетов.

<!-- dprint-ignore -->
> [!TIP]
> Фильтрация коубов (дизлайкнутых, от заблокированных каналов и т.д.) применяется к ответам запросов к API, в связи с чем:
> - изменение фильтров не влияет на уже загруженные коубы
>
>   так, если открыть сообщество `Anime` и поставить дизлайк первому коубу, он будет скрыт не сразу, а только при следующем запросе списка (например, после обновления страницы или после перехода на другую страницу и возвращения в сообщество)
>
> - в некоторых ситуациях может порождать состояния, которые логика самого [Coub.com] не учитывает (пример - hikiko4ern/coub-addons#5)

## Building

### Сборка из исходников "с нуля"

Требуются глобально установленные:

- [Node.js][node.js][^1] со включенным [Corepack]
- [Rust] (MSRV: `1.73.0`) с `wasm32-unknown-unknown` и глобально установленным [`cargo-run-bin`][cargo-run-bin]

  **NOTE:** для воспроизводимых сборок необходимо использовать `toolchain`, указанный в файле [rust-toolchain.toml](./rust-toolchain.toml) ([`rustup`](https://www.rust-lang.org/tools/install) при сборке должен будет автоматически его установить)

1. устанавливаем зависимости
   ```sh
   cargo install --locked cargo-run-bin # только если не был установлен ранее
   pnpm i -P
   ```

2. собираем
   ```sh
   pnpm zip:ff
   ```

3. открываем `about:addons`, жмём на шестерню, `Install Add-on From File...`, выбираем `.output/coub-addons-x.x.x-firefox.zip`, соглашаемся с установкой непроверенного расширения

### Сборка из подготовленных исходников версии

С новыми релизами также публикуется архив `coub-addons-x.x.x-sources.zip`, содержащий исходный код для Firefox-based браузеров с скомпилированными и оптимизированными некоторыми пакетами (на данный момент только [`segmenter-utils`][segmenter-utils]), из которых можно собрать код, соответствующий опубликованному в `coub-addons-x.x.x-firefox.zip`.

Требуются глобально установленные:

- [Node.js][node.js][^1] со включенным [Corepack]

1. распаковываем архив `coub-addons-x.x.x-sources.zip`

2. устанавливаем зависимости
   ```sh
   pnpm i -P --frozen-lockfile
   ```

3. собираем
   ```sh
   pnpm zip:ff
   ```

<!-- spell-checker: word временны́х -->

NOTE: контрольные суммы архивов не совпадут из-за хранимых в ZIP-архиве временны́х меток файлов, но контрольные суммы файлов должны совпадать.

## TODO

Ссылки на некоторые интересные лейблы:

- планируемый новый функционал: https://github.com/hikiko4ern/coub-addons/labels/T-feature
- вызываемые этим расширением баги на [Coub.com]: https://github.com/hikiko4ern/coub-addons/labels/T-site%20bug

## Contributing

1. устанавливаем [Node.js][node.js][^1] и [Rust]

   для удобства в [`Taskfile`](./Taskfile.yml) собраны некоторые команды\
   посмотреть их список: `pnpm task -l`, запустить: `pnpm task {task}` (например, `pnpm task su:watch`)

2. устанавливаем зависимости
   ```sh
   pnpm i
   ```

3. если не хочется, чтобы dev-версия расширения конфликтовала с prod-версией, создаём файл `.env.local` с содержимым:
   ```sh
   VITE_GECKO_ID=some@ext.id
   # см. https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings#extension_id_format
   ```

4. выполняем `pnpm dev:ff` для дев-сборки под Firefox-based браузеры

5. [загружаем расширение][firefox-temp-install] из директории `.output/firefox-mv2`

Сгенерировать `N` фейковых каналов для стора `blockedChannels`:

1. выполняем
   ```sh
   node ./utils/fakeBlockedChannels.js N # где N - положительное число
   ```
2. открываем настройки расширения и импортируем бэкап из созданного файла

[^1]: требуемая версия указана в [`.nvmrc`](./.nvmrc). Рекомендуется использовать менеджеры версий [Node.js], поддерживающие [Corepack] - например, [fnm].

<!-- spell-checker: word fnm -->
<!-- links -->

[coub.com]: https://coub.com
[latest-release]: https://github.com/hikiko4ern/coub-addons/releases/latest
[node.js]: https://nodejs.org
[corepack]: https://github.com/nodejs/corepack
[rust]: https://www.rust-lang.org
[cargo-run-bin]: https://crates.io/crates/cargo-run-bin
[segmenter-utils]: ./packages/segmenter-utils/README.md
[just]: https://github.com/casey/just
[firefox-temp-install]: https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/
[fnm]: https://github.com/Schniz/fnm
