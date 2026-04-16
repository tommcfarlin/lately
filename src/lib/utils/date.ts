export function formatPostDate(utcString: string): string {
	const date = new Date(utcString);
	return date.toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

export function formatPostTime(utcString: string): string {
	const date = new Date(utcString);
	return date.toLocaleTimeString(undefined, {
		hour: 'numeric',
		minute: '2-digit'
	});
}
