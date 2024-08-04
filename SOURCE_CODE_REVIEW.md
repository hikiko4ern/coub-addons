# Firefox Source Code Review

The extension requires globally installed [Node.js][node.js] with [Corepack][corepack] enabled. The version of Node.js used is specified in [`.nvmrc`](./.nvmrc).

To build the extension or zip it:

1. ```sh
   pnpm i -P --frozen-lockfile
   ```

2. the source code archive contains an already built WASM of the [`segmenter-utils`][segmenter-utils] package, which will not be automatically built from the source code. If there is no need to rebuild it, skip this step and go to the next one, otherwise:

   1. also install:

      - [Rust][rust]

        If [`rustup`][rustup] is used, it should automatically install everything you need when building. If not, you need to manually install the version and target specified in the [rust-toolchain.toml](./rust-toolchain.toml) file.

      - [`cargo-run-bin`][cargo-run-bin]

        To install:
        ```sh
        cargo install --locked cargo-run-bin
        ```

   2. remove artifacts from the previous build:

      ```sh
      pnpm su clean
      ```

3. ```sh
   pnpm zip:ff
   ```

   this will create two files in the `.output` directory:

   - `coub-addons-x.x.x-firefox.zip` - unsigned extension
   - `coub-addons-x.x.x-sources.zip` - source code of the extension

<!-- links -->

[node.js]: https://nodejs.org
[corepack]: https://github.com/nodejs/corepack
[segmenter-utils]: ./packages/segmenter-utils/README.md
[rust]: https://www.rust-lang.org
[rustup]: https://www.rust-lang.org/tools/install
[cargo-run-bin]: https://crates.io/crates/cargo-run-bin
