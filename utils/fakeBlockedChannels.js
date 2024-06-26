import fs from 'node:fs/promises';
import { faker } from '@faker-js/faker';

const DEST = 'blockedChannels.json';
const size = Number.parseInt(process.argv[2], 10) || 1000;

/** @type {import('@/storage/blockedChannels/types').RawBlockedChannels} */
const data = {
	id: new Array(size),
	title: new Array(size),
	permalink: new Array(size),
};

/** @type {Partial<import('@/storage/backup').Backup>} */
const backup = {
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

await fs.writeFile(DEST, JSON.stringify(backup));

const formattedSize = new Intl.NumberFormat('en').format(size);
console.log(`Wrote ${formattedSize} channels to ${DEST}`);
