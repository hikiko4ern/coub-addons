# Contributing

- [Conventional Commits](#conventional-commits)
- [Setup](#setup)
- [Development](#development)
  - [Development of an extension](#development-of-an-extension)
  - [Available commands](#available-commands)
  - [How to test auto-updating](#how-to-test-auto-updating)
- [Releasing updates](#releasing-updates)

## Conventional Commits

This project uses [Conventional Commits](https://www.conventionalcommits.org/en) to automate versioning. If you're a new contributor, don't worry about this. When you open a PR, a maintainer will change the PR's title so it's in the style of conventional commits, but that's all.

## Setup

The extension requires globally installed:

- [Node.js][node.js] with [Corepack][corepack] enabled

  The version of Node.js used is specified in [`.nvmrc`](./.nvmrc). It is recommended to use version managers - e.g. [fnm][fnm].

- [Rust][rust]

  If [`rustup`][rustup] is used, it should automatically install everything you need when building. If not, you need to manually install the version and target specified in the [rust-toolchain.toml](./rust-toolchain.toml) file.

- [`cargo-run-bin`][cargo-run-bin]

  To install:
  ```sh
  cargo install --locked cargo-run-bin
  ```

## Development

### Development of an extension

1. install dependencies::

   ```sh
   pnpm i
   ```

   this will also automatically build [`segmenter-utils`][segmenter-utils]

2. if you don't want the dev-version of the extension to conflict with the prod-version, create a `.env.local` file with the contents:

   ```sh
   VITE_GECKO_ID=some@ext.id

   # more about Gecko ID:
   # https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings#extension_id_format
   ```

3. run `pnpm dev:ff` to build an extension for Firefox-based browsers

4. [load the extension][firefox-temp-install] from the `.output/firefox-mv2` directory

### Available commands

Here are some helpful commands:

- `pnpm build:ff` - builds an extension for Firefox
- `pnpm zip:ff` - builds and packages an extension for Firefox
- `pnpm test` - runs the tests once
- `pnpm test:watch` - runs tests in watch mode
- `pnpm su:watch` - starts a dev build of [`segmenter-utils`][segmenter-utils] in watch mode
- `pnpm test-build-reproducibility` - checks if build is reproducible (this is required to pass an <abbr title="addons.mozilla.org">AMO</abbr> review)

#### GraphQL <!-- omit in toc -->

A copy of the `https://coub.com/graphql` GraphQL schema is stored in the repository for type checking. Usually there is no need to touch it, but if the schema becomes outdated, to update it, execute:

```sh
pnpm gql:fetch-schema # executes an Introspection query and saves its response
pnpm gql:gen          # generates types based on the scheme
```

#### Utilities <!-- omit in toc -->

To generate `N` fake channels for the `blockedChannels` storage:

1. run
   ```shell-session
   $ node ./utils/fakeBlockedChannels.js N # N is a positive integer
   Wrote 1,000 channels to blockedChannels.json
   ```
2. open the extension settings and import the backup from the created `blockedChannels.json` file

### How to test auto-updating

1. set up a local server that serves files from the `docs` directory

   This server must work over **HTTPS**, but even self-signed certificates will work. I have a server listening on `localhost:8080`, but if you have a different host - replace it in the following steps.

2. create `.env.local` with the contents:
   ```sh
   VITE_GECKO_UPDATE_URL=https://localhost:8080/updates.json
   ```

3. disable certificate validation in `about:config` by creating a settings:
   ```sh
   extensions.install.requireBuiltInCerts = false
   extensions.update.requireBuiltInCerts = false
   ```

4. build a ZIP with the new version of the extension, change its extension from `.zip` to `.xpi` and copy it to `docs` so that the new version is in `docs/coub-addons-x.x.x-firefox.xpi`

   Here and below `x.x.x` is used instead of the extension version, don't forget to replace it with the real one.

5. add the new version to [`docs/updates.json`](./docs/updates.json) in the `updates` field:
   ```jsonc
   {
   	"updates": [
   		// ... other updates ...
   		{
   			"version": "x.x.x",
   			"update_link": "https://localhost:8080/coub-addons-x.x.x-firefox.xpi"
   		}
   	]
   }
   ```

6. open `about:addons`, click on the gear and select `Check for Updates` to force check for updates

If something doesn't work, see [Testing Automatic Updating](https://extensionworkshop.com/documentation/manage/updating-your-extension/#testing-automatic-updating).

## Releasing updates

At the moment releases are done manually. To create a release, run `pnpm bump`.

This will automatically bump up the version based on new commits added since the previous tag, generate a [`CHANGELOG.md`](./CHANGELOG.md), build and package the extension for Firefox, creating two files in the `.output` directory:

- `coub-addons-x.x.x-firefox.zip` - unsigned extension
- `coub-addons-x.x.x-sources.zip` - source code of the extension for [review in <abbr title="addons.mozilla.org">AMO</abbr>](https://extensionworkshop.com/documentation/publish/source-code-submission/)

where `x.x.x` is the new version of the extension after `bump` (e.g. `0.1.20`).

To publish a release, run:

1. `pnpm release-build`
2. `pnpm tsx ./utils/upload/index.ts`

<!-- links -->

[node.js]: https://nodejs.org
[corepack]: https://github.com/nodejs/corepack
[fnm]: https://github.com/Schniz/fnm
[rust]: https://www.rust-lang.org
[rustup]: https://www.rust-lang.org/tools/install
[cargo-run-bin]: https://crates.io/crates/cargo-run-bin
[segmenter-utils]: ./packages/segmenter-utils/README.md
[firefox-temp-install]: https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/
