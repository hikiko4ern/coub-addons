# Changelog

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
