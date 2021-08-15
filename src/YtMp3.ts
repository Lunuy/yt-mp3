import { defaultExtractor, SongInfo, SongInfoExtractor } from "./SongInfoExtrator";
import ytdl from 'ytdl-core';
import ytpl from 'ytpl';
import sanitize from 'sanitize-filename';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { Readable } from "stream";
import NodeID3 from 'node-id3';
import fetch from 'node-fetch';
import sharp from 'sharp';

function saveStream(stream: Readable, filePath: string) {
    return new Promise<void>((resolve, reject) => {
        ffmpeg(stream)
            .audioBitrate(128)
            .save(filePath)
            .on('error', err => {
                reject(err);
            })
            .on('end', () => {
                resolve();
            });
    });
}
function setId3(songInfo: SongInfo, thumb: Buffer, filePath: string) {
    const tags: NodeID3.Tags = {
        title: songInfo.title,
        artist: songInfo.artist,
        album: songInfo.album,
        year: songInfo.year,
        image: {
            mime: 'image/jpeg',
            type: { id: 3, name: 'front cover' },
            imageBuffer: thumb,
            description: ''
        }
    };
    NodeID3.write(tags, filePath);
}


export interface Options {
    songInfoExtractor: SongInfoExtractor;
}

class YtMp3 {
    private options: Options = {
        songInfoExtractor: defaultExtractor
    };

    constructor(options: Partial<Options> = {}) {
        Object.assign(this.options, options);
    }

    async download(url: string, directoryPath: string, implicitSongInfo?: SongInfo) {
        const videoInfo = await ytdl.getInfo(url);
        const videoDetails = videoInfo.videoDetails;
        const videoTitle = videoDetails.title;
        const songInfo = implicitSongInfo
            ?? await this.options.songInfoExtractor(videoInfo);

        const filePath = path.resolve(directoryPath, sanitize(songInfo.title, { replacement: '_' }) + '.mp3');

        const stream = ytdl.downloadFromInfo(videoInfo, {
            filter: 'audioonly',
            quality: 'highestaudio'
        });
        await saveStream(stream, filePath);
        
        const videoThumb = await (await fetch(
            videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url
        )).buffer(); 
        const thumb = await sharp(videoThumb)
            .resize({
                width: 256,
                height: 256,
                fit: sharp.fit.cover
            })
            .jpeg()
            .toBuffer();
        await setId3(songInfo, thumb, filePath);
    }

    async downloadPlaylist(playlistId: string, directoryPath: string) {
        const playlist = await ytpl(playlistId);
        for(const { id } of playlist.items)
            await this.download(id, directoryPath);
    }

    async downloadPlaylistParrarel(playlistId: string, directoryPath: string) {
        const playlist = await ytpl(playlistId);
        await Promise.all(playlist.items.map(({ id }) => this.download(id, directoryPath)));
    }
}

export default YtMp3;