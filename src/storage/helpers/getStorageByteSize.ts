const encoder = new TextEncoder();

export const getStorageByteSize = (data: unknown) => encoder.encode(JSON.stringify(data)).length;
