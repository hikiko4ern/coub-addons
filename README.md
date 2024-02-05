# coub-addons

Web Extension, добавляющий дополнительный функционал на [Coub.com]

> [!WARNING]
> Расширение находится на раннем этапе разработки, поэтому временно:
>
> - тестируется только на Gecko-based браузерах (Firefox, Waterfox, LibreWolf и прочие лисьи форки) и может не работать в других\
  > например, фильтрация запросов сейчас построена на [`webRequest.filterResponseData`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/filterResponseData) и не будет работать в Chromium-based браузерах и Safari, в которых используемое API всё ещё не реализовано
> - не публикуется в сторах и не подписывается, из-за чего для постоянной установки требует отключенной проверки подписи (в Gecko это настройка `xpinstall.signatures.required`)
> - периодически могут вноситься обратно несовместимые изменения, требующие **ручной** миграции настроек
> - проект не следует SemVer и плохо сконфигурирован (_да и в целом ведёт себя плохо_)
>
> Если всё прочитанное не отпугнуло желание попробовать, смотри секцию [`Building`](#building)

## Features

- скрытие дизлайкнутых коубов
- скрытие коубов от заблокированных каналов

<!-- dprint-ignore -->
> [!TIP]
> Фильтрация коубов (дизлайкнутых, от заблокированных каналов и т.д.) применяется к ответам запросов к API, в связи с чем:
> - изменение фильтров не влияет на уже загруженные коубы
>
>   так, если открыть сообщество `Anime` и поставить дизлайк первому коубу, он будет скрыт не сразу, а только при следующем запросе списка (например, после перезагрузки страницы или после перехода на другую страницу и возвращения в сообщество)
>
> - в некоторых ситуациях может порождать состояния, которые логика самого [Coub.com] не учитывает (пример - hikiko4ern/coub-addons#5)

## Building

Для сборки требуется [Bun] (на момент написания была версия `1.0.26`, но и более новые версии должны работать).

1. устанавливаем зависимости
   ```sh
   bun i -p
   ```

2. собираем
   ```sh
   bun zip:ff
   ```

3. открываем `about:addons`, жмём на шестерню, `Install Add-on From File...`, выбираем `.output/coub-addons-x.x.x-firefox.zip`, соглашаемся с установкой непроверенного расширения

## TODO

Ссылки на некоторые интересные лейблы:

- планируемый новый функционал: https://github.com/hikiko4ern/coub-addons/labels/T-feature
- вызываемые этим расширением баги на [Coub.com]: https://github.com/hikiko4ern/coub-addons/labels/T-site%20bug

## Contributing

1. устанавливаем [Bun] (на момент написания была версия `1.0.26`, но и более новые версии должны работать)
2. устанавливаем зависимости: `bun i`
3. создаём файл `.env.local` с содержимым:
   ```sh
   # ext
   VITE_GECKO_ID=some@ext.id # см. https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings#extension_id_format
   ```
4. выполняем `bun dev:ff` для дев-сборки под Gecko-based браузеры
5. [загружаем расширение][firefox-temp-install] из директории `.output/firefox-mv2`

Пропатчить зависимость:

1. устанавливаем [`Node.js`][nodejs] и включаем [`Corepack`][corepack]
2. выполняем `bun i --yarn`
3. вносим изменения в код зависимости в `node_modules/...`
4. выполняем `yarn patch-package <dep_name>` (например, `yarn patch-package wxt`)
5. удаляем сгенерированный `yarn.lock`

Сгенерировать `N` фейковых каналов для стора `blockedChannels`:

1. выполняем
   ```sh
   bun run utils/fakeBlockedChannels.ts N # N - число
   ```
2. открываем настройки расширения и импортируем бэкап из созданного файла

<!-- links -->

[coub.com]: https://coub.com
[bun]: https://github.com/oven-sh/bun
[firefox-temp-install]: https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/
[nodejs]: https://nodejs.org
[corepack]: https://github.com/nodejs/corepack
