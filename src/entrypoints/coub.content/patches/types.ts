interface GetGlobalsValid<T> {
	isValid: true;
	ret: T;
}

interface GetGlobalsInvalid {
	isValid: false;
	ret: unknown[];
}

export type GetGlobalsRes<T> = GetGlobalsValid<T> | GetGlobalsInvalid;
