import { faker } from '@faker-js/faker';

import type { Backup } from '@/storage/backup';
import type { RawBlockedChannels } from '@/storage/blockedChannels/types';

const DEST = 'blockedChannels.json';
const size = Number.parseInt(process.argv[2], 10) || 1000;

const data: RawBlockedChannels = {
	id: new Array(size),
	title: new Array(size),
	permalink: new Array(size),
};

const backup: Backup = {
	blockedChannels: data,
	blockedChannels$: { v: 1 },
};

for (let i = 0; i < size; i++) {
	const sex = Math.random() < 0.5 ? 'male' : 'female',
		firstName = faker.person.firstName(sex),
		lastName = faker.person.lastName(sex);

	data.id[i] = i + 1;
	data.title[i] = `${firstName} ${lastName}`;
	data.permalink[i] = faker.internet.userName({ firstName, lastName });
}

await Bun.write(DEST, JSON.stringify(backup));

const formattedSize = new Intl.NumberFormat('en').format(size);
console.log(`Wrote ${formattedSize} channels to ${DEST}`);
