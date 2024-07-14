export const parseSearchPage = (param: string | null) => {
	if (typeof param !== 'string' || !param) {
		return;
	}

	const value = Number.parseInt(param, 10);
	return Number.isNaN(value) ? undefined : value;
};
