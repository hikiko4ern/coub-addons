## common
title = Title
action = Action
actions = Actions
loading = Loading...
an-error-occurred-while-loading = An error occurred while loading
clear = Clear
clearing = Clearing...
no = No
confirm = Confirm
cancel = Cancel
save = Save
revert = Revert
edit = Edit
extension = Extension
id = ID
index = Index
total = total
size-in-bytes = Size in bytes
format = Format
total-def = Total: {$total}

## follow button

follow = Follow

## block button

block = Block
blocked = Blocked
unblock = Unblock

## comments
hidden-comment-message = This message was hidden

## context menu / tags
copy-tag = Copy tag
block-tag = Block tag

## options / error
error-boundary-exception = Well, something's broken. You can <recover>Try to recover</recover> if you're lucky enough.

## options / phrases blocklist
revert-changes = Revert changes
revert-changes-confirmation-title = Reverting changes
revert-changes-confirmation-description = Are you sure you want to revert all changes back to when you last saved?
phrases-tester =
  .placeholder = Match tester
phrases-tester-description =
  Allows you to test the blocklist. Enter a phrase in this field, and if it matches one of the blocklist patterns,
  that pattern will be highlighted and the field will be colored green. Don't forget to save the blocklist before using it!

## options / blocked channels
blocked-channels = Blocked channels
blocked-channels-list = Blocked channels list
no-blocked-channels = You seem to like all the channels ¯\_(ツ)_/¯
no-blocked-channels-by-search = No blocked channels found
update-channel-data =
  .content = Update channel data
remove-from-blocklist =
  .content = Remove from blocklist
blocked-channels-search =
  .placeholder = Search by title/URL
blocked-channels-total = {$total -> 
  [one] Total {$total} channel
  *[other] Total {$total} channels
}
rows-per-page =
  .label = Rows per page:
clear-blocked-channels-confirmation-title = Clearing the blocklist
clear-blocked-channels-confirmation-description = Are you sure you want to remove all channels from the blocklist?
channel-data-has-been-updated = Channel data has been updated
channel-data-update-error = Failed to update channel data:<br/>{$error}

## options / blocked tags
blocked-tags = Blocked tags

## options / blocked coub titles
blocked-coub-titles = Blocked coub titles

## options / blocklist
blocklist = Blocklist
block-recoubs = Block recoubs
block-reposts-of-coubs = Block reposts of coubs
block-reposts-of-stories = Block reposts of stories
comments-from-blocked-channels =
  .label = Comments from blocked channels:
  .show = show
  .hide-message = hide message
  .remove-with-replies = hide comment and replies to it
grant-permissions = Grant permissions
permissions-must-be-granted-for-this-functionality-to-work = Permissions must be granted for this functionality to work

## options / player settings
player = Player
prevent-playback-rate-change = Prevent playback rate changes
prevent-playback-rate-change-tooltip = Prevents changing the playback rate by pressing <kbd>W</kbd>/<kbd>S</kbd>
prevent-player-built-in-hotkeys-if-mod-pressed = Prevent handling <kbd>W</kbd>/<kbd>S</kbd>/<kbd>R</kbd>/<kbd>P</kbd> if modifier is pressed
prevent-player-built-in-hotkeys-if-mod-pressed-tooltip = Prevents player from handling <kbd>W</kbd>/<kbd>S</kbd>/<kbd>R</kbd>/<kbd>P</kbd> keystrokes if one of the modifier keys is pressed (<kbd>Ctrl</kbd>/<kbd>Alt</kbd>/<kbd>Shift</kbd>/<kbd>Meta</kbd>)
keyboard-shortcuts = Keyboard shortcuts
keyboard-shortcuts-settings = Keyboard shortcuts settings
shortcut = Shortcut
dislike = dislike
bookmark = bookmark
fullscreen = fullscreen
built-in = built-in
press-any-key-combination = Press any key combination
recording-key-combination-label = Recording
conflicts-with-actions = Conflicts with actions: {$with}

## options / stats
stats = Stats
filtered-out-coubs = Filtered out coubs
statistics-of-filtered-out-coubs = Statistics of filtered out coubs
filtered-out-stories = Filtered out stories
statistics-of-filtered-out-stories = Statistics of filtered out stories
changed-comments = Changed comments
statistics-of-changed-comments = Statistics of changed comments
filtered-out-channels = Filtered out channels
statistics-of-filtered-out-channels = Statistics of filtered out channels
count = Count
reason = Reason
  .blocked = blocked
  .coub-is-disliked = coub is disliked
  .channel-is-blocked = channel is blocked
  .tag-is-blocked = tag is blocked
  .coub-title-is-blocked = coub is blocked by title
  .recoubs-are-blocked = recoubs are blocked
  .reposts-are-blocked = reposts are blocked

## options / settings
settings = Settings
backups = Backups
extension-settings-tooltip = These settings only affect the extension itself. Content added to Coub.com will try to match the Coub.com settings
theme-setting =
  .label = Theme
theme-setting-system = System
theme-setting-dark = Dark
theme-setting-light = Light
locale-setting =
  .label = Locale
locale-setting-system = System
locale-setting-ru-RU = Русский
locale-setting-en-US = English
dev-mode = Dev mode
dev-mode-tooltip = Here be dragons. Adds functionality intended for developers only. Such functionality can be changed or removed at any time without notice, and using it could potentially break something or irreversibly erase the extension settings
### options / settings / export
export-backup = Export backup
backup-creation-error = Failed to create backup:<br/>{$error}
### options / settings / import
import-backup = Import backup
import-backup-confirmation-header = Are you sure?
import-backup-confirmation-message = All your existing data will be <danger>overwritten</danger> by the backup. Continue?
file-content-is-not-a-valid-backup = The contents of the file are not a valid backup
### options / settings / import-merge
import-merge-backup = Import backup and merge with current settings
import-merge-backup-confirmation-message = Your existing data will be merged with backup. Continue?
storages-versions-are-different = Some storage versions do not match backup versions.<br/>
  Combining repositories with different versions is not currently supported. You can:<br/>
  - import with overwrite;<br/>
  - update the extension on the device where the backup was made, export a new backup and import the new one.<br/>
  <br/>
  Details:<br/>
  <pre>{$error}</pre>
backup-merges-failed = Failed to merge the current state with the backup:<br/>{$error}
storage-version-is-not-equal-to-backup = the current version of `{$key}` (v{$currentVersion}) does not match the backup version (v{$backupVersion})
storage-current-state-is-older-than-backup = the current version of `{$key}` (v{$currentVersion}) is older than the backup (v{$backupVersion})
storage-is-missing-migrations = no migrations are declared for `{$key}`
storage-is-missing-migration-version = no migration is declared for `{$key}` for version {$version}
storage-merge-failed = failed to merge `{$key}` with the backup: {$error}
### options / settings / import status
backup-restoration-error = Failed to import backup:<br/><pre>{$error}</pre>
backup-migrations-failed = Migrations for {$keys} failed: {$error}
backup-imported-successfully = Backup imported successfully
backup-imported-successfully-but-reinitialization-failed = The backup was successfully imported, but the state could not be updated. The extension will be automatically reloaded.
### options / settings / sync
sync-storage = Sync storage
device-name =
  .label = Device name

## options / sharded backup
backup-have-no-shards = Have no backup data
backup-have-no-shards-for = Have no backup shards for {$keys}
missing-backup-shards = Missing backup shards: {$missing}
mismatched-backup-shards-lengths = The lengths of the backup shards don't match: {$lengths}
unknown-uint32-prefix = Unknown Uint32 prefix: {$prefix}
invalid-uint32-buffer-size = Uint32 buffer size {$size} is invalid
unknown-uint32-value = Unknown for Uint32 value of type {$type}: {$value}
unknown-array-prefix = Unknown array prefix: {$prefix}
unknown-array-value = Unknown for array value of type {$type}: {$value}

## options / sync backup
-sync-state-equals-local = Currently exported data is equal to the local state
last-sync =
  .title = Device, date, and time of last synchronization
sync-backup-export =
  .title = Export to the sync storage
sync-backup-export_equal =
  .title = {sync-backup-export.title}. {-sync-state-equals-local}
sync-backup-import =
  .title = Import from the sync storage
sync-backup-import_equal =
  .title = {sync-backup-import.title}. {-sync-state-equals-local}
sync-backup-import-merge =
  .title = Import from sync storage and merge with current state
sync-backup-import-merge_equal =
  .title = {sync-backup-import-merge.title}. {-sync-state-equals-local}
download-sync-backup =
  .title = Download sync storage data (JSON)
sync-backup-download-error = An error occurred while saving data from the sync storage:<br/>{$error}
sync-backup-exported = Backup exported to sync storage
sync-backup-export-error = Failed to export backup:<br/>{$error}
### options / sync backup / storage details
sync-backup-storage-open-details =
  .title = Open details of the storage
sync-backup-storage-shards-title = Shards of the `{$storage}` storage
