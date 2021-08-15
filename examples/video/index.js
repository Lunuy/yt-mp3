const { YtMp3, createMusicBrainzExtractor } = require('../../dist/index.js');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

// *** You may have to set ffmpeg path ***
ffmpeg.setFfmpegPath('C:\\ffmpeg\\bin\\ffmpeg.exe');


const mp3Path = path.resolve(__dirname, './mp3');

const mbExtractor = createMusicBrainzExtractor();
const ytMp3 = new YtMp3({ songInfoExtractor: mbExtractor });

(async () => {
    const urls = (await fs.promises.readFile(path.resolve(__dirname, './urls.txt'), 'utf8')).split('\n');
    for(const url of urls) {
        await ytMp3.download(url, mp3Path);
        console.log(`Downloaded :: ${url}`);
    }
})();