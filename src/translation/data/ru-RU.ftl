## common
title = Название
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
error-boundary-exception = Ну, что-то сломалось. Вы можете <recover>{$attempt ->
  [1] Попробовать восстановить ещё раз
  [2] Попробовать восстановить ещё раз.
  [3] Попробовать восстановить ещё раз..
  [4] Попробовать восстановить ещё раз...
  [5] ...
  [6] Почему ты продолжаешь пытаться?
  [7] Ты правда думаешь, что после стольких попыток всё заработает?
  [8] Хорошо, можешь продолжать жать эту кнопку
  [9] Я оставлю тебя наедине с этой кнопкой
  *[other] Попробовать восстановить
}</recover>, если Вам повезет.

## options / phrases blocklist
revert-changes = Откатить изменения
revert-changes-confirmation-title = Откат изменений
revert-changes-confirmation-description = Вы уверены, что хотите откатить все изменения до момента последнего сохранения?

## options / blocked channels
blocked-channels = Заблокированные каналы
blocked-channels-list = Список заблокированных каналов
no-blocked-channels = Кажется, Вам нравятся все каналы ¯\_(ツ)_/¯
no-blocked-channels-by-search = Ничего не найдено
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

## options / blocked tags
blocked-tags = Заблокированные теги

## options / blocked coub titles
blocked-coub-titles = Заблокированные названия коубов

## options / stats
stats = Статистика
filtered-out-coubs = Скрытые коубы
statistics-of-filtered-out-coubs = Статистика отфильтрованных коубов
reason = Причина
count = Количество
coub-is-disliked = коубу поставлен дизлайк
channel-is-blocked = канал заблокирован
tag-is-blocked = тег заблокирован
coub-title-is-blocked = коуб заблокирован по имени

## options / settings
settings = Настройки
backups = Резервные копии
import-backup = Импортировать резервную копию
export-backup = Экспортировать резервную копию
backup-creation-error = Произошла ошибка при создании резервной копии:<br/>{$error}
backup-restoration-error = Произошла ошибка при импортировании резервной копии:<br/>{$error}
backup-migrations-failed = Не удалось выполнить миграции для {$keys}: {$error}
backup-imported-successfully = Резервная копия успешно импортирована
backup-imported-successfully-but-reinitialization-failed = Резервная копия была успешно импортирована, но обновить состояние не удалось. Расширение будет автоматически перезапущено.
import-backup-confirmation-header = Вы уверены?
import-backup-confirmation-message = Все существующие данные будут перезаписаны резервной копией. Продолжить?
file-content-is-not-a-valid-backup = Содержимое файла не является валидной резервной копией
