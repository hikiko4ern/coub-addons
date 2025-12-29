import fs from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';

import type { TimelineResponseCoubs } from '@/request/timeline';
import type { Backup } from '@/storage/backup';
import type { RawBlockedChannels } from '@/storage/blockedChannels';

const DEST = 'blockedChannels.json';
const size = Number.parseInt(process.argv[2], 10) || 1000;
const MAX_RUNNING_ZEROES = 10;

// get communities list:
// 1. open `https://coub.com`
// 2. run `Array.from(document.querySelectorAll('.main-menu__community-item'), node => node.dataset['communityPermalink']).sort()`
// biome-ignore format: keep it flat
const COMMUNITIES = ['animals-pets', 'anime', 'art', 'blogging', 'cars', 'cartoons', 'celebrity', 'dance', 'fashion', 'food-kitchen', 'gaming', 'live-pictures', 'mashup', 'memes', 'movies', 'music', 'nature-travel', 'science-technology', 'sports', 'standup-jokes'] as const;

const data: RawBlockedChannels = {
	id: new Array(size),
	title: new Array(size),
	permalink: new Array(size),
};

const backup: Partial<Backup> = {
	blockedChannels: data,
	blockedChannels$: { v: 1 },
};

const channelIds = new Set<number>();

interface State {
	page: number;
	next: number | undefined;
	runningZeros: number;
}

const states = COMMUNITIES.map((community): [typeof community, State] => [
	community,
	{
		page: 1,
		next: undefined,
		runningZeros: 0,
	},
]);

let i = 0,
	statesIndex = 0;

do {
	const [community, state] = states[statesIndex];

	const page = state.page;
	const res = (await (
		await fetch(
			`https://coub.com/api/v2/timeline/community/${community}/daily?page=${page}` +
				(typeof state.next === 'number' ? `&anchor=${state.next}` : ''),
		)
	).json()) as TimelineResponseCoubs;
	state.next = res.next;

	const start = i;

	for (const coub of res.coubs) {
		if (!channelIds.has(coub.channel.id)) {
			data.id[i] = coub.channel.id;
			data.title[i] = coub.channel.title;
			data.permalink[i] = coub.channel.permalink;
			channelIds.add(coub.channel.id);
			i += 1;

			if (i === size) {
				break;
			}
		}
	}

	const diff = i - start;
	console.log(`${i} / ${size} (page: ${page}; +${diff}; ${community})`);
	state.page += 1;

	let isRotate = true;

	if (diff > 0) {
		state.runningZeros = 0;
	} else {
		state.runningZeros += 1;

		if (state.runningZeros >= MAX_RUNNING_ZEROES) {
			states.splice(statesIndex, 1);
			isRotate = false;

			if (states.length === 0) {
				break;
			}
		}
	}

	if (isRotate) {
		statesIndex = (statesIndex + 1) % states.length;
	}

	await setTimeout(1000);
} while (i < size);

data.id.length = i;
data.title.length = i;
data.permalink.length = i;

await fs.writeFile(DEST, JSON.stringify(backup));

const formattedSize = new Intl.NumberFormat('en').format(i);
console.log(`Wrote ${formattedSize} channels to ${DEST}`);
