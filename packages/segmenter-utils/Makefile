.DEFAULT_GOAL := build
FORCE:

lib/segmenter_utils_rs_bg.wasm: FORCE
	rm -rf lib
	bun --bun wasm-pack build --out-dir lib -s coub-addons -t web --release .

build: lib/segmenter_utils_rs_bg.wasm
