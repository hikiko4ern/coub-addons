import { BlockedChannelsStorage } from '@/storage/blockedChannels';
import { StatsStorage } from '@/storage/stats';
import type { Logger } from '@/utils/logger';

import { CoubHelpers } from './coub';
import { WebRequestExt } from './webRequestExt';

export class Context implements Disposable {
	readonly origin: string;
	readonly webRequest: WebRequestExt;
	readonly coubHelpers: CoubHelpers;
	readonly blockedChannels: BlockedChannelsStorage;
	readonly stats: StatsStorage;

	constructor(logger: Logger) {
		this.origin = import.meta.env.VITE_COUB_ORIGIN;
		this.webRequest = new WebRequestExt(this);
		this.coubHelpers = new CoubHelpers(this);
		this.blockedChannels = new BlockedChannelsStorage('bg', logger);
		this.stats = new StatsStorage('bg', logger);
	}

	[Symbol.dispose]() {
		this.blockedChannels[Symbol.dispose]();
		this.webRequest[Symbol.dispose]();
	}
}
