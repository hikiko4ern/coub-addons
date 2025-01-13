const encoder = new TextEncoder();

export const byteSize = (str: string): number => encoder.encode(str).length;
