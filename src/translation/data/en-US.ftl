## common
title = Title
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
error-boundary-exception = Well, something's broken. You can <recover>{$attempt ->
  [1] Try to recover again
  [2] Try to recover again.
  [3] Try to recover again..
  [4] Try to recover again...
  [5] ...
  [6] Why do you keep trying?
  [7] Do you really think it's going to work after trying so many times?
  [8] Okay, you can keep pressing that button
  [9] I'll leave you alone with that button
  *[other] Try to recover
}</recover> if you're lucky.

## options / blocked channels
blocked-channels = Blocked channels
blocked-channels-list = Blocked channels list
no-blocked-channels = You seem to like all the channels ¯\_(ツ)_/¯
no-blocked-channels-by-search = No blocked channels found
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

## options / blocked tags
blocked-tags = Blocked tags
revert-changes = Revert changes
revert-blocked-tags-changes-confirmation-title = Reverting tag list changes
revert-blocked-tags-changes-confirmation-description = Are you sure you want to revert all changes back to when you last saved?

## options / stats
stats = Stats
filtered-out-coubs = Filtered out coubs
statistics-of-filtered-out-coubs = Statistics of filtered out coubs
reason = Reason
count = Count
coub-is-disliked = coub is disliked
channel-is-blocked = channel is blocked
tag-is-blocked = tag is blocked

## options / settings
settings = Settings
backups = Backups
import-backup = Import backup
export-backup = Export backup
backup-creation-error = Failed to create backup:<br/>{$error}
backup-restoration-error = Failed to import backup:<br/>{$error}
backup-migrations-failed = Migrations for {$keys} failed: {$error}
backup-imported-successfully = Backup imported successfully
backup-imported-successfully-but-reinitialization-failed = The backup was successfully imported, but the state could not be updated. The extension will be automatically reloaded.
import-backup-confirmation-header = Are you sure?
import-backup-confirmation-message = All your existing data will be overwritten by the backup. Continue?
file-content-is-not-a-valid-backup = The contents of the file are not a valid backup
