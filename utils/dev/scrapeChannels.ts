import fs from 'node:fs/promises';
import { setTimeout } from 'node:timers/promises';

import type { TimelineResponseCoubs } from '@/request/timeline';
import type { Backup } from '@/storage/backup';
import type { RawBlockedChannels } from '@/storage/blockedChannels';

const DEST = 'blockedChannels.json';
const size = Number.parseInt(process.argv[2], 10) || 1000;

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

let i = 0,
	page = 1,
	prevRes: TimelineResponseCoubs | undefined,
	runningZeros = 0;

do {
	const res = (prevRes = (await (
		await fetch(
			`https://coub.com/api/v2/timeline/community/anime/daily?page=${page}` +
				(typeof prevRes?.next === 'number' ? `&anchor=${prevRes.next}` : ''),
		)
	).json()) as TimelineResponseCoubs);

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
	console.log(`${i} / ${size} (page: ${page}; +${diff})`);
	page += 1;

	if (diff > 0) {
		runningZeros = 0;
	} else {
		runningZeros += 1;

		if (runningZeros >= 10) {
			break;
		}
	}

	await setTimeout(1000);
} while (i < size);

data.id.length = i;
data.title.length = i;
data.permalink.length = i;

await fs.writeFile(DEST, JSON.stringify(backup));

const formattedSize = new Intl.NumberFormat('en').format(i);
console.log(`Wrote ${formattedSize} channels to ${DEST}`);
