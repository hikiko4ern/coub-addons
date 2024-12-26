import { initSync, segmentWords } from '../lib/segmenter_utils_rs';
import wasm from '../lib/segmenter_utils_rs_bg.wasm?arraybuffer';

initSync({ module: wasm });

export { segmentWords };
