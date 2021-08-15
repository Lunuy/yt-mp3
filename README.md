# @lunuy/yt-mp3
Youtube mp3 downloader. *Album art SUPPORTED*

## Features
- Mp3 Meta tag
- Album art

## Usage
```js
const { YtMp3, createMusicBrainzExtractor } = require('@lunuy/yt-mp3');
const ffmpeg = require('fluent-ffmpeg');

// *** You may have to set ffmpeg path ***
ffmpeg.setFfmpegPath('C:\\ffmpeg\\bin\\ffmpeg.exe');

// Extractor is used to get title, artist name, album name from videoInfo.
// musicBrainzExtractor uses MusicBrainz API to get informations.
const mbExtractor = createMusicBrainzExtractor();
const ytMp3 = new YtMp3({ songInfoExtractor: mbExtractor });

(async () => {
    await ytMp3.download('https://www.youtube.com/watch?v=_apfQnIsSkg', __dirname);
})();
```