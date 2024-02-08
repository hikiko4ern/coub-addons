# build `segmenter-utils` in watch mode; requires `cargo-watch` (https://lib.rs/crates/cargo-watch)
segmenter-utils-watch:
	cargo watch -w packages/segmenter-utils/src/*.rs -w packages/segmenter-utils/Cargo.toml -w Cargo.lock -w Cargo.toml -s 'wasm-pack build --out-dir lib -s coub-addons -t web --dev packages/segmenter-utils'
