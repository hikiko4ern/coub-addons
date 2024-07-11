import { create } from 'superstruct';

import { Channel } from './types';

export const fetchChannelData = async (id: number) => {
	const data = await fetch(new URL(`/api/v2/channels/${id}`, import.meta.env.VITE_COUB_ORIGIN), {
		method: 'GET',
		mode: 'cors',
		credentials: 'include',
	}).then(res => res.json());

	return create(data, Channel);
};
