# coub-addons

[English](./README.md) · [Русский](./README.ru.md)

Web Extension, добавляющий дополнительный функционал на [Coub.com]

Минимальные поддерживаемые версии браузеров:

- Firefox 101

> [!WARNING]
> Расширение находится на раннем этапе разработки, поэтому временно:
>
> - работает только на Firefox-based браузерах и может не работать в других\
>   например, фильтрация запросов сейчас построена на [`webRequest.filterResponseData`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/filterResponseData) и не будет работать в Chromium-based браузерах и Safari, в которых используемое API не реализовано
> - не публикуется в сторах и не подписывается, из-за чего для постоянной установки требует отключенной проверки подписи (в Firefox это настройка `xpinstall.signatures.required`)
> - периодически могут вноситься обратно несовместимые изменения, требующие **ручной** миграции настроек (_хотя такого ещё ни разу не было, и, я надеюсь, не будет, но бэкапы делай, бэкапы - это здорово_)
>
> Если всё прочитанное не отпугнуло желание попробовать, качайте [последний релиз][latest-release].

## Features

- скрытие дизлайкнутых коубов
- скрытие коубов, историй и комментариев от заблокированных каналов
- скрытие коубов по названию и тегам, содержащим указанные фразы или соответствующим регулярным выражениям
- скрытие рекоубов и репостов историй
- быстрое копирование/блокировка тега через контекстное меню
- отображение даты публикации коуба в "Популярное" и сообществах
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

Если какой-то функционал не работает (особенно если расширение только что было установлено/обновлено), попробуйте обновить страницу - часть функционала работает через вклинивание в код Coub'а и требует применения патчей при загрузке страницы.

<!-- dprint-ignore -->
> [!TIP]
> Фильтрация коубов (дизлайкнутых, от заблокированных каналов и т.д.) применяется к ответам запросов к API, в связи с чем:
> - изменение фильтров не влияет на уже загруженные коубы
>
>   так, если открыть сообщество `Anime` и поставить дизлайк первому коубу, он будет скрыт не сразу, а только при повторном запросе этой страницы списка (например, после обновления страницы или после перехода на другую страницу и возвращения в сообщество)
>
> - в некоторых ситуациях может порождать состояния, которые логика самого [Coub.com] не учитывает (пример - hikiko4ern/coub-addons#5)

<!-- links -->

[coub.com]: https://coub.com
[latest-release]: https://github.com/hikiko4ern/coub-addons/releases/latest