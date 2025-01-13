import type { StorageShard } from '@/storage/base';

export class ShardGenerator<T> {
	private shards: StorageShard<never, T>[] = [];

	constructor(private key: string) {}

	push = (value: T) => {
		this.shards.push({ key: `${this.key}#${String(this.shards.length).padStart(3, '0')}`, value });
	};

	finish = (): StorageShard<never, T>[] => {
		// compact key if there is only one shard
		if (this.shards.length === 1) {
			this.shards[0].key = this.key;
		}

		return this.shards;
	};
}
