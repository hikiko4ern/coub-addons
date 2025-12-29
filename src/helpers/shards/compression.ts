import { decode as decodeBase64, encode as encodeBase64 } from 'base64-arraybuffer';
import type { TypedArray } from 'type-fest';

export const gzipBase64 = async (buf: ArrayBufferLike | TypedArray): Promise<string> => {
	const bufStream = new ReadableStream({
		start(controller) {
			controller.enqueue(buf);
			controller.close();
		},
	});

	const compressedBuf = await new Response(
		bufStream.pipeThrough(new CompressionStream('gzip')),
	).arrayBuffer();

	return encodeBase64(compressedBuf);
};

export const gunzipBase64 = async (base64: string): Promise<ArrayBuffer> => {
	const compressedStream = new ReadableStream({
		start(controller) {
			controller.enqueue(decodeBase64(base64));
			controller.close();
		},
	});

	return await new Response(
		compressedStream.pipeThrough(new DecompressionStream('gzip')),
	).arrayBuffer();
};
