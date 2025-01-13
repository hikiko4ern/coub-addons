import type { StorageShard } from '@/storage/base';

export class ShardGenerator<T> {
	readonly baseLength: number;

	readonly #shards: StorageShard<never, T | undefined>[] = [];
	readonly #key: string;

	constructor(keyPrefix: string, key: string | undefined) {
		this.#key = key ? `${keyPrefix}:${key}` : keyPrefix;
		this.baseLength = this.#key.length + 4; // constant common length excluding data, so in `"prefix:key#000":` it would be:
		//                ^ prefix + key   ^ #000
		//                \                \
		//                 \                \
		//                  \                \- sequence number prefixed by # (three digits because there can be only 512 keys in the sync storage)
		//                   |
		//                    \- length of key (key is guaranteed to be ASCII-only)
		//
		// note that quotes around the key ("") and colon (:) are not counted in length
	}

	push = (value: T) => {
		this.#shards.push({
			key: this.#key + '#' + String(this.#shards.length).padStart(3, '0'),
			value,
		});
	};

	finish = (): StorageShard<never, T | undefined>[] => {
		// compact key if there is only one shard
		if (this.#shards.length === 1) {
			this.#shards[0].key = this.#key;
		}
		// otherwise
		else {
			this.#shards.push({ key: this.#key, value: undefined });
		}

		return this.#shards;
	};
}
