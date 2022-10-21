import mp from 'mixpanel';

const mixpanel = mp.init('809e401dcd8a09bafc79b559e911ff29');

const trackSong = (playState) => {
  const { track, title, artist, album, path, duration } = playState.playing.tags;
  mixpanel.track('songListened', {
    track,
    title,
    artist,
    album,
    path,
    duration,
  });
};

const favoriteSong = (playState) => {
  const { track, title, artist, album, path, duration } = playState.playing.tags;
  mixpanel.track('songFavorited', {
    track,
    title,
    artist,
    album,
    path,
    duration,
    favorited: '❤️'
  });
};

export default {
  trackSong,
  favoriteSong,
}
