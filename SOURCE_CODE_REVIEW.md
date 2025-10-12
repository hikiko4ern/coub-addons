# Firefox Source Code Review

The extension requires globally installed [Node.js][node.js] with [Corepack][corepack] enabled. The version of Node.js used is specified in [`.nvmrc`](./.nvmrc).

To build the extension or zip it:

1. ```sh
   pnpm i -P --frozen-lockfile
   ```

2. ```sh
   pnpm zip:ff
   ```

   this will create two files in the `.output` directory:

   - `coub-addons-x.x.x-firefox.zip` - unsigned extension
   - `coub-addons-x.x.x-sources.zip` - source code of the extension

<!-- links -->

[node.js]: https://nodejs.org
[corepack]: https://github.com/nodejs/corepack
