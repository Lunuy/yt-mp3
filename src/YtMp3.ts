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
    thumbSize: number;
}

class YtMp3 {
    private options: Options = {
        songInfoExtractor: defaultExtractor,
        thumbSize: 4096
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

        const fileName = sanitize(songInfo.title, { replacement: '_' }) + '.mp3';
        const filePath = path.resolve(directoryPath, fileName);

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
                width: this.options.thumbSize,
                height: this.options.thumbSize,
                fit: sharp.fit.cover
            })
            .jpeg()
            .toBuffer();
        await setId3(songInfo, thumb, filePath);

        return fileName;
    }

    async downloadPlaylist(playlistId: string, directoryPath: string) {
        const playlist = await ytpl(playlistId);
        const fileNames = [];
        for(const { id } of playlist.items)
            fileNames.push(await this.download(id, directoryPath));
        return fileNames;
    }

    async downloadPlaylistParrarel(playlistId: string, directoryPath: string) {
        const playlist = await ytpl(playlistId);
        return await Promise.all(playlist.items.map(({ id }) => this.download(id, directoryPath)));
    }
}

export default YtMp3;