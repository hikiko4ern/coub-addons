# Changelog

## [0.1.18] - 2024-07-12

### Bug Fixes

- **(blocklist)** do not update the blocked channel data if it has not changed
- **(blocklist)** add translation for `ID`
- **(blocklist)** make the `ID` readable on a light background
- fix cleanup in `ctx.onInvalidated` on the channel page

### Miscellaneous Tasks

- **(build)** make a build from zipped sources reproducible

## [0.1.17] - 2024-07-11

### Bug Fixes

- handle more query field separators

### Features

- **(blocklist)** update data of blocked channels from timeline and comments responses
- **(blocklist)** add an action to manually update channel data

### Miscellaneous Tasks

- **(build)** remove unnecessary files from zipped sources
- **(build)** save the checksum of `segmenter-utils` in zipped sources

## [0.1.16] - 2024-07-10

### Features

- **(hotkey)** add a hotkey for copying a coub link
- **(blocklist)** exclude likes and bookmarks timelines from processing

## [0.1.15] - 2024-07-09

### Bug Fixes

- **(hotkey)** do not perform an action if a modifier not specified in the hotkey is pressed

### Features

- **(blocklist)** implement hiding comments from blocked channels

### Refactor

- store hotkey modifiers as a number instead of an array

## [0.1.14] - 2024-05-06

### Bug Fixes

- **(channel-dropdown)** raise the buttons higher so that they don't overlap the description

### Features

- **(settings)** allow changing the theme and language of the settings page

### Miscellaneous Tasks

- add simple icon

## [0.1.13] - 2024-04-27

### Features

- **(hotkey)** add keyboard shortcuts for `dislike`, `bookmark` and `fullscreen`

### Documentation

- add a recommendation to make backups

### Miscellaneous Tasks

- **(dev)** update `pnpm` to `9.0.6`

## [0.1.12] - 2024-04-18

### Features

- **(blocklist)** implement blocking of recoubs

### Documentation

- add link to the latest release

### Miscellaneous Tasks

- **(segmenter-utils)** change `rust-version` to `1.73`
- **(dev)** update `pnpm` to `9.0.2`

## [0.1.11] - 2024-04-17

### Bug Fixes

- **(stats)** count coubs from channel's timeline, unless they are blocked due to that channel being blocked

### Features

- **(blocklist/title)** implement filtering of coubs by title

### Documentation

- **(features)** mention context menu that allows to copy or block a tag

### Miscellaneous Tasks

- lower the minimum supported version of Firefox to 101
- **(changelog)** move breaking changes to a separate section
- **(dev)** use `Node.js` and `pnpm` instead of `Bun`
- **(build)** swap `make` and `just` for `Task`
- **(dev)** replace `husky` with `lefthook`
- **(dev)** run `tsc` on any file change

## [0.1.10] - 2024-04-14

### Bug Fixes

- **(publish)** add `.env` to Firefox sources zip
- change the name of the addon from `coub-addons` to `Coub addons`

### Documentation

- **(dev)** adds development dependency on Node.js

### Miscellaneous Tasks

- **(dev)** use the `Bun` runtime for almost all commands
- **(settings)** change the statistics icon from pie to bars

### Refactor

- import auto-imported modules

## [0.1.9] - 2024-04-06

### Features

- **(settings)** validate regular expressions in the editor

### Documentation

- reorder sections in the changelog and remove the default documentation scope

## [0.1.8] - 2024-04-06

### Features

- open options page on toolbar button click
- **(menu/tag)** add a context menu that allows to copy or block a tag
- **(settings)** save changes in the editor when `Ctrl-s` is pressed
- **(settings)** highlight regular expressions in the editor

### Documentation

- update MSRV to `v1.73.0`

### Miscellaneous Tasks

- **(dev)** add changelog generation

## [0.1.7] - 2024-04-03

### Bug Fixes

- **(backup)** run migrations for imported backup

## [0.1.6] - 2024-04-01

### Bug Fixes

- **(blocklist/ui)** fix styles and UI for guest

## [0.1.5] - 2024-02-24

### Bug Fixes

- downgrade `wxt` to `v0.16.11`

## [0.1.4] - 2024-02-23

### Bug Fixes

- **(blocklist/tags)** fix restoring from backup with tags

### Miscellaneous Tasks

- **(dev)** ignore not found `husky` in `prepare`

## [0.1.3] - 2024-02-08

### Features

- **(blocklist/tags)** add filtering of coubs by tags

## [0.1.2] - 2024-02-05

### Bug Fixes

- fix `FlexSearch` import not working in prod mode

## [0.1.1] - 2024-02-05

### Bug Fixes

- do not broadcast messages to discarded and prohibited tabs
- **(blocklist)** synchronize storages between tabs correctly

### Features

- adds `Block` button to channel page and dropdown
- **(settings)** add backup import/export functionality

### Documentation

- add `README` and change license to The `Unlicense`

### Performance

- replace `fuse.js` with `flexsearch`

## [0.1.0] - 2024-01-29

### Features

- add options UI
