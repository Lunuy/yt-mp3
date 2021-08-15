const { YtMp3, createMusicBrainzExtractor } = require('../../dist/index.js');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

// *** You may have to set ffmpeg path ***
ffmpeg.setFfmpegPath('C:\\ffmpeg\\bin\\ffmpeg.exe');

const mp3Path = path.resolve(__dirname, './mp3');


const mbExtractor = createMusicBrainzExtractor();
const ytMp3 = new YtMp3({ songInfoExtractor: mbExtractor });

(async () => {
    await ytMp3.downloadPlaylist('PL3oc7KIxAPE73xi-F-OmHcUi3PUL9mU-V', mp3Path);
})();