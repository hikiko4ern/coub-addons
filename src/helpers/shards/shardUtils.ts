export const PER_KEY_BYTES_LIMIT = 8192; // 8 KB

export const getBaseLength = (keyPrefix: string, key: string) => {
	// biome-ignore format: keep this explanation nicely formatted
	return `${keyPrefix}${key}`.length  + 4; // constant common length excluding data, so in `"prefix:key#000":` it would be:
	//     ^ prefix + key                 ^ #000
	//     \                              \
	//      \                              \
	//       \                              \- sequence number prefixed by # (three digits because there can be only 512 keys in the sync storage)
	//        |
	//         \- length of key (key is guaranteed to be ASCII-only)
	//
	// note that quotes around the key ("") and colon (:) are not counted in length
};
