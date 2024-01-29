declare global {
	interface NumberConstructor {
		/**
		 * Returns true if the value passed is an integer, false otherwise.
		 * @param number A numeric value.
		 */
		isInteger(number: unknown): number is number;
	}
}

export type {};
