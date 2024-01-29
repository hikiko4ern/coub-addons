import { faker } from '@faker-js/faker';

import type { RawBlockedChannels } from '@/storage/blockedChannels/types';

const size = 1000;

const data: RawBlockedChannels = {
	id: new Array(size),
	title: new Array(size),
	permalink: new Array(size),
};

for (let i = 0; i < size; i++) {
	const sex = Math.random() < 0.5 ? 'male' : 'female',
		firstName = faker.person.firstName(sex),
		lastName = faker.person.lastName(sex);

	data.id[i] = i + 1;
	data.title[i] = `${firstName} ${lastName}`;
	data.permalink[i] = faker.internet.userName({ firstName, lastName });
}

await Bun.write('blockedChannels.json', JSON.stringify(data));
