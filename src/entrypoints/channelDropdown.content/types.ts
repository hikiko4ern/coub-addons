export type ChannelDropdownAddedNode = [
	channelDropdownContent: WeakRef<Element>,
	node: WeakRef<Element> | undefined,
	unsubscribe: WeakRef<() => void> | undefined,
];
export type ChannelDropdownAddedNodes = ChannelDropdownAddedNode[];
