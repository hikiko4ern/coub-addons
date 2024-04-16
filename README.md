# coub-addons

Web Extension, добавляющий дополнительный функционал на [Coub.com]

> [!WARNING]
> Расширение находится на раннем этапе разработки, поэтому временно:
>
> - тестируется только на Firefox-based браузерах (Firefox, Waterfox, LibreWolf и прочие лисьи форки) и может не работать в других\
  > например, фильтрация запросов сейчас построена на [`webRequest.filterResponseData`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/filterResponseData) и не будет работать в Chromium-based браузерах и Safari, в которых используемое API всё ещё не реализовано
> - не публикуется в сторах и не подписывается, из-за чего для постоянной установки требует отключенной проверки подписи (в Firefox это настройка `xpinstall.signatures.required`)
> - периодически могут вноситься обратно несовместимые изменения, требующие **ручной** миграции настроек
> - проект ~~не следует SemVer и~~ плохо сконфигурирован (_да и в целом ведёт себя плохо_)
>
> Расширение может завестись и на более старых версиях, а может и не может ¯\\\_(ツ)\_/¯
>
> Если всё прочитанное не отпугнуло желание попробовать, смотри секцию [`Building`](#building)

Минимальные поддерживаемые версии браузеров:

- Firefox 101

## Features

- скрытие дизлайкнутых коубов
- скрытие коубов от заблокированных каналов
- скрытие коубов по тегам, содержащим указанные фразы или соответствующим регулярным выражениям
- быстрое копирование/блокировка тега через контекстное меню

<!-- dprint-ignore -->
> [!TIP]
> Фильтрация коубов (дизлайкнутых, от заблокированных каналов и т.д.) применяется к ответам запросов к API, в связи с чем:
> - изменение фильтров не влияет на уже загруженные коубы
>
>   так, если открыть сообщество `Anime` и поставить дизлайк первому коубу, он будет скрыт не сразу, а только при следующем запросе списка (например, после перезагрузки страницы или после перехода на другую страницу и возвращения в сообщество)
>
> - в некоторых ситуациях может порождать состояния, которые логика самого [Coub.com] не учитывает (пример - hikiko4ern/coub-addons#5)

## Building

Для сборки требуются глобально установленные:

- [Node.js][node.js][^1] со включенным [Corepack]
- [Rust] (MSRV: `1.73.0`)
- `wasm-opt` из [Binaryen] (опционально, используется для оптимизации WASM из [`segmenter-utils`](./packages/segmenter-utils/README.md))

1. устанавливаем зависимости
   ```sh
   pnpm i -P
   ```

2. собираем
   ```sh
   pnpm zip:ff
   ```

3. открываем `about:addons`, жмём на шестерню, `Install Add-on From File...`, выбираем `.output/coub-addons-x.x.x-firefox.zip`, соглашаемся с установкой непроверенного расширения

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
   # ext
   VITE_GECKO_ID=some@ext.id # см. https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings#extension_id_format
   ```

4. выполняем `pnpm dev:ff` для дев-сборки под Firefox-based браузеры

5. [загружаем расширение][firefox-temp-install] из директории `.output/firefox-mv2`

Сгенерировать `N` фейковых каналов для стора `blockedChannels`:

1. выполняем
   ```sh
   node ./utils/fakeBlockedChannels.js N # N - число
   ```
2. открываем настройки расширения и импортируем бэкап из созданного файла

[^1]: требуемая версия указана в [`.nvmrc`](./.nvmrc). Рекомендуется использовать менеджеры версий [Node.js], поддерживающие [Corepack] - например, [fnm].

<!-- spell-checker: word fnm -->
<!-- links -->

[coub.com]: https://coub.com
[node.js]: https://nodejs.org
[corepack]: https://github.com/nodejs/corepack
[rust]: https://www.rust-lang.org
[binaryen]: https://github.com/WebAssembly/binaryen
[just]: https://github.com/casey/just
[firefox-temp-install]: https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/
[fnm]: https://github.com/Schniz/fnm
