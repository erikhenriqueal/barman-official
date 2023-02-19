import fs from 'fs';
import path from 'path';

const eventsList = fs.readdirSync(__dirname, { encoding: 'utf-8' });
for (const filename of eventsList) {
	if (filename === path.basename(__filename)) continue;
	require(path.join(__dirname, filename));
}
