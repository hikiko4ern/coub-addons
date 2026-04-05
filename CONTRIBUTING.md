# Contributing

- [Conventional Commits](#conventional-commits)
- [Setup](#setup)
- [Development](#development)
  - [Development of an extension](#development-of-an-extension)
  - [Available commands](#available-commands)
    - [GraphQL](#graphql)
    - [Utilities](#utilities)
  - [How to test auto-updating](#how-to-test-auto-updating)
- [Releasing updates](#releasing-updates)

## Conventional Commits

This project uses [Conventional Commits](https://www.conventionalcommits.org/en/) to automate versioning.

## Setup

The extension requires globally installed [Node.js][node.js] with [Corepack][corepack] enabled

The version of Node.js used is specified in [`.nvmrc`](./.nvmrc). It is recommended to use version managers - e.g. [fnm][fnm].

## Development

### Development of an extension

1. install dependencies::

   ```sh
   pnpm i
   ```

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
- `pnpm test-build-reproducibility` - checks if build is reproducible (this is required to pass an <abbr title="addons.mozilla.org">AMO</abbr> review)

#### GraphQL

A copy of the `https://coub.com/graphql` GraphQL schema is stored in the repository for type checking. Usually there is no need to touch it, but if the schema becomes outdated, to update it, execute:

```sh
pnpm gql:fetch-schema # executes an Introspection query and saves its response
pnpm gql:gen          # generates types based on the scheme
```

#### Utilities

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
   and comment out `VITE_GECKO_UPDATE_URL` in the [`.env.production`](./.env.production)

3. allow usage of self-issued certificates by creating a settings (in `about:config`):
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
   			"update_link": "https://localhost:8080/coub-addons-x.x.x-firefox.xpi",
   		},
   	],
   }
   ```

6. open `about:addons`, click on the gear and select `Check for Updates` to force check for updates

If something doesn't work, see [Testing Automatic Updating](https://extensionworkshop.com/documentation/manage/updating-your-extension/#testing-automatic-updating).

## Releasing updates

At the moment releases are done manually.

To create a release, run `pnpm bump`. This will automatically bump up the version based on new commits added since the previous tag and generate a [`CHANGELOG.md`](./CHANGELOG.md).

To publish a release:

1. run `pnpm release-build` to build a release version of the extension

   this will create two files in the `.output` directory:

   - `coub-addons-x.x.x-firefox.zip` - unsigned extension
   - `coub-addons-x.x.x-sources.zip` - source code of the extension for [review in <abbr title="addons.mozilla.org">AMO</abbr>](https://extensionworkshop.com/documentation/publish/source-code-submission/)

   where `x.x.x` is the new version of the extension after `bump` (e.g. `0.1.20`).
2. run `pnpm tsx ./utils/upload/index.ts` to publish a new version to <abbr title="addons.mozilla.org">AMO</abbr>
3. wait for the new version to be approved by the AMO
4. download the signed `.xpi` from AMO
5. create new release at [Codeberg](https://codeberg.org/hikiko4ern/coub-addons)

   to generate a release description, run `pnpm -s release-notes`

   attach 2 files to the release:
   - `coub-addons-x.x.x-firefox.xpi` - signed extension downloaded from AMO
   - `coub-addons-x.x.x-sources.zip` - source code of the extension
6. run `pnpm add-update --file /path/to/coub-addons-x.x.x-firefox.xpi` to add a new release to `updates.json`
7. commit the changes with the next message and push them to the `master`:
   ```sh
   chore(release): add `v0.1.20` to `updates.json` # change the version to a newly created one
   ```

<!-- links -->

[node.js]: https://nodejs.org
[corepack]: https://github.com/nodejs/corepack
[fnm]: https://github.com/Schniz/fnm
[firefox-temp-install]: https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/
