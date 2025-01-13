import { name as pkgName } from '../../../../package.json';

const pad = (value: number) => value.toString().padStart(2, '0');

export const downloadBackup = (name: string, date: Date, data: string) => {
	const a = document.createElement('a'),
		url = URL.createObjectURL(new Blob([data]));

	a.href = url;
	a.target = '_blank';
	a.download = `${pkgName}-${name}_${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
		date.getDate(),
	)}_${pad(date.getHours())}-${pad(date.getMinutes())}.json`;

	a.click();
	URL.revokeObjectURL(url);
};
