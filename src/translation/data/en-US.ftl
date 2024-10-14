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
miscellaneous = Miscellaneous
milliseconds = ms

## follow button

follow = Follow

## block button

block = Block
blocked = Blocked
unblock = Unblock

## context menu / tags
copy-tag = Copy tag
block-tag = Block tag

## options / error
error-boundary-exception = Well, something's broken. You can <recover>Try to recover</recover> if you're lucky enough.

## options / phrases blocklist
revert-changes = Revert changes
revert-changes-confirmation-title = Reverting changes
revert-changes-confirmation-description = Are you sure you want to revert all changes back to when you last saved?

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
block-reposts-of-stories = Block reposts of stories
hide-comments-from-blocked-channels = Hide comments from blocked channels
grant-permissions = Grant permissions
permissions-must-be-granted-for-this-functionality-to-work = Permissions must be granted for this functionality to work

## options / player settings
player = Player
prevent-playback-rate-change = Prevent playback rate changes
prevent-playback-rate-change-tooltip = Prevents changing the playback rate by pressing <kbd>W</kbd>/<kbd>S</kbd>
keyboard-shortcuts = Keyboard shortcuts
keyboard-shortcuts-settings = Keyboard shortcuts settings
shortcut = Shortcut
dislike = dislike
bookmark = bookmark
fullscreen = fullscreen
copy-coub-link = copy coub link
built-in = built-in
press-any-key-combination = Press any key combination
recording-key-combination-label = Recording
conflicts-with-actions = Conflicts with actions: {$with}
hide-controls-after =
  .label = Hide controls after

## options / stats
stats = Stats
filtered-out-coubs = Filtered out coubs
statistics-of-filtered-out-coubs = Statistics of filtered out coubs
filtered-out-stories = Filtered out stories
statistics-of-filtered-out-stories = Statistics of filtered out stories
filtered-out-comments = Filtered out comments
statistics-of-filtered-out-comments = Statistics of filtered out comments
reason = Reason
count = Count
coub-is-disliked = coub is disliked
channel-is-blocked = channel is blocked
tag-is-blocked = tag is blocked
coub-title-is-blocked = coub is blocked by title
recoubs-are-blocked = recoubs are blocked
reposts-are-blocked = reposts are blocked

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
### options / settings / export
export-backup = Export backup
backup-creation-error = Failed to create backup:<br/>{$error}
file-content-is-not-a-valid-backup = The contents of the file are not a valid backup
### options / settings / import
import-backup = Import backup
import-backup-confirmation-header = Are you sure?
import-backup-confirmation-message = All your existing data will be overwritten by the backup. Continue?
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
