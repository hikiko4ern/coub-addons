export const toJsonDataUri = (value: unknown) =>
	`data:application/json,${encodeURI(JSON.stringify(value))}`;
