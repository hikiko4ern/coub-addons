## common
title = Название
action = Действие
actions = Действия
loading = Загружаем...
an-error-occurred-while-loading = Произошла ошибка при загрузке
clear = Очистить
clearing = Очищаем...
no = Нет
confirm = Подтвердить
cancel = Отменить
save = Сохранить
revert = Откатить
edit = Редактировать
extension = Расширение
id = ID

## Follow button

follow = Подписаться

## Block button

block = Блокировать
blocked = Заблокирован
unblock = Разблокировать

## context menu / tags
copy-tag = Скопировать тег
block-tag = Заблокировать тег

## options / error
error-boundary-exception = Ну, что-то сломалось. Вы можете <recover>Попробовать восстановить</recover>, если Вам повезет.

## options / phrases blocklist
revert-changes = Откатить изменения
revert-changes-confirmation-title = Откат изменений
revert-changes-confirmation-description = Вы уверены, что хотите откатить все изменения до момента последнего сохранения?

## options / blocked channels
blocked-channels = Заблокированные каналы
blocked-channels-list = Список заблокированных каналов
no-blocked-channels = Кажется, Вам нравятся все каналы ¯\_(ツ)_/¯
no-blocked-channels-by-search = Ничего не найдено
update-channel-data =
  .content = Обновить данные канала
remove-from-blocklist =
  .content = Удалить из списка
blocked-channels-search =
  .placeholder = Поиск по названию/ссылке
blocked-channels-total = {$total -> 
  [one] Всего {$total} канал
  [few] Всего {$total} канала
  *[many] Всего {$total} каналов
}
rows-per-page =
  .label = Строк на странице:
clear-blocked-channels-confirmation-title = Очистка блок-листа
clear-blocked-channels-confirmation-description = Вы уверены, что хотите удалить все каналы из блок-листа?
channel-data-has-been-updated = Данные канала обновлены
channel-data-update-error = Не удалось обновить данные канала:<br/>{$error}

## options / blocked tags
blocked-tags = Заблокированные теги

## options / blocked coub titles
blocked-coub-titles = Заблокированные названия коубов

## options / blocklist
blocklist = Блок-лист
block-recoubs = Блокировать рекоубы
block-reposts-of-stories = Блокировать репосты историй
hide-comments-from-blocked-channels = Скрывать комментарии от заблокированных каналов
grant-permissions = Предоставить разрешения
permissions-must-be-granted-for-this-functionality-to-work = Для работы этого функционала необходимо предоставить разрешения

## options / player settings
player = Плеер
prevent-playback-rate-change = Предотвращать изменение скорости воспроизведения
prevent-playback-rate-change-tooltip = Предотвращает изменение скорости воспроизведения нажатием <kbd>W</kbd>/<kbd>S</kbd>
keyboard-shortcuts = Клавиатурные сокращения
keyboard-shortcuts-settings = Настройки клавиатурных сокращений
shortcut = Сочетание
dislike = дизлайк
bookmark = избранное
fullscreen = полноэкранный режим
copy-coub-link = скопировать ссылку на коуб
built-in = встроенное
press-any-key-combination = Нажмите любое сочетание клавиш
recording-key-combination-label = Запись
conflicts-with-actions = Конфликтует с действиями: {$with}

## options / stats
stats = Статистика
filtered-out-coubs = Скрытые коубы
statistics-of-filtered-out-coubs = Статистика отфильтрованных коубов
filtered-out-stories = Скрытые истории
statistics-of-filtered-out-stories = Статистика отфильтрованных историй
filtered-out-comments = Скрытые комментарии
statistics-of-filtered-out-comments = Статистика отфильтрованных комментариев
reason = Причина
count = Количество
coub-is-disliked = коубу поставлен дизлайк
channel-is-blocked = канал заблокирован
tag-is-blocked = тег заблокирован
coub-title-is-blocked = коуб заблокирован по имени
recoubs-are-blocked = рекоубы заблокированы
reposts-are-blocked = репосты заблокированы

## options / settings
settings = Настройки
backups = Резервные копии
extension-settings-tooltip = Эти настройки влияют только на само расширение. Контент, добавляемый на Coub.com, будет стараться соответствовать настройкам Coub.com
theme-setting =
  .label = Тема
theme-setting-system = Системная
theme-setting-dark = Тёмная
theme-setting-light = Светлая
locale-setting =
  .label = Язык
locale-setting-system = Системный
locale-setting-ru-RU = Русский
locale-setting-en-US = English
### options / settings / export
export-backup = Экспортировать резервную копию
backup-creation-error = Произошла ошибка при создании резервной копии:<br/>{$error}
file-content-is-not-a-valid-backup = Содержимое файла не является валидной резервной копией
### options / settings / import
import-backup = Импортировать резервную копию
import-backup-confirmation-header = Вы уверены?
import-backup-confirmation-message = Все существующие данные будут перезаписаны резервной копией. Продолжить?
### options / settings / import-merge
import-merge-backup = Импортировать резервную копию и объединить с текущими настройками
import-merge-backup-confirmation-message = Существующие данные будут объединены с резервной копией. Продолжить?
storages-versions-are-different = Версии некоторых хранилищ не совпадают с версиями резервной копии.
  Объединение хранилищ с разными версиями на данный момент не поддерживается. Вы можете:<br/>
  - импортировать с перезаписью;<br/>
  - обновить расширение на устройстве, на котором была сделана резервная копия, экспортировать новую резервную копию и импортировать уже её.<br/>
  <br/>
  Детали:<br/>
  <pre>{$error}</pre>
backup-merges-failed = Не удалось объединить текущее состояние с резервной копией:<br/>{$error}
storage-version-is-not-equal-to-backup = текущая версия `{$key}` (v{$currentVersion}) не совпадает с версией резервной копии (v{$backupVersion})
storage-current-state-is-older-than-backup = текущая версия `{$key}` (v{$currentVersion}) старше резервной копии (v{$backupVersion})
storage-is-missing-migrations = для `{$key}` не объявлены миграции
storage-is-missing-migration-version = для `{$key}` не объявлена миграция для версии {$version}
storage-merge-failed = не удалось объединить `{$key}` с резервной копией: {$error}
### options / settings / import status
backup-restoration-error = Произошла ошибка при импортировании резервной копии:<br/><pre>{$error}</pre>
backup-migrations-failed = Не удалось выполнить миграции для {$keys}: {$error}
backup-imported-successfully = Резервная копия успешно импортирована
backup-imported-successfully-but-reinitialization-failed = Резервная копия была успешно импортирована, но обновить состояние не удалось. Расширение будет автоматически перезапущено.
