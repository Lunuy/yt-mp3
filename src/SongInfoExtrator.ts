import { IMusicBrainzConfig, MusicBrainzApi, IRecording, IRelease } from 'musicbrainz-api';
import ytdl from 'ytdl-core';


export interface SongInfo {
    title: string;
    artist: string;
    album: string;
    year: string;
}
export type SongInfoExtractor = (videoTitle: ytdl.videoInfo) => Promise<SongInfo> | SongInfo;



export function defaultExtractor(videoInfo: ytdl.videoInfo): SongInfo {
    return {
        title: videoInfo.videoDetails.title,
        artist: '',
        album: '',
        year: ''
    };
}

export function normalExtractor(videoInfo: ytdl.videoInfo): SongInfo {
    const videoTitle = videoInfo.videoDetails.title;
    const [artist, title] = videoTitle
        .replace(/\([^()]+\)/g, '')
        .replace(/\[[^[]]+\]/g, '')
        .trim()
        .split(' - ');
    if(title) {
        return {
            title,
            artist,
            album: '',
            year: ''
        };
    } else {
        return {
            title: videoTitle,
            artist: '',
            album: '',
            year: ''
        };
    }
}

export function createMusicBrainzExtractor(config?: IMusicBrainzConfig) {
    const mbApi = new MusicBrainzApi(config);
    async function musicbrainzExtractor(videoInfo: ytdl.videoInfo): Promise<SongInfo> {
        const _songInfo = normalExtractor(videoInfo);
    
        if(!_songInfo.title || !_songInfo.artist)
            return _songInfo;
        
        const { recordings: [recording] }: {
            recordings: IRecording[]
        } = await mbApi.search('recording', {
            artist: _songInfo.artist,
            recording: _songInfo.title
        }) as any;

        if(!recording)
            return _songInfo;
        
        const release = (recording.releases as unknown as IRelease[])[0];
        const title = recording.title;
        const artist = recording['artist-credit'][0].name;
        const album = release.title;
        const year = release.date.slice(0, 4);

        return {
            title,
            artist,
            album,
            year
        };
    }

    return musicbrainzExtractor;
}

