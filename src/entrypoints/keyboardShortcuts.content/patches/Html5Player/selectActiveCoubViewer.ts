export const selectActiveCoubViewer = ($: typeof window.$) =>
	$('.coub:is(.coub--timeline.active, :not(.coub--timeline)) .viewer').filter(':visible');
