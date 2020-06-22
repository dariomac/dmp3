const fetch = require('node-fetch');
const urlencode = require('urlencode');
const fsx = require('fs-extra');

const startOfLyricsArea = '</div></div></div></div><div class="hwc"><div class="BNeawe tAd8D AP7Wnd"><div><div class="BNeawe tAd8D AP7Wnd">';
const endOfLyricsArea = '</div></div></div></div></div><div><span class="hwc"><div class="BNeawe uEec3 AP7Wnd">';

async function download (song, shouldSave = true) {
  let i;
  
  try {
    i = await fetch(`https://www.google.com/search?q=${urlencode(`${song.tags.artist} ${song.tags.title}`)}+lyrics`);
    i = await i.text();
    [, i] = i.split(startOfLyricsArea);
    [i] = i.split(endOfLyricsArea);
  } catch (m) {
    try {
      i = await fetch(`https://www.google.com/search?q=${urlencode(`${song.tags.artist} ${song.tags.title}`)}+song+lyrics`);
      i = await i.text();
      [, i] = i.split(startOfLyricsArea);
      [i] = i.split(endOfLyricsArea);
    } catch (n) {
      try {
        i = await fetch(`https://www.google.com/search?q=${urlencode(`${song.tags.artist} ${song.tags.title}`)}+song`);
        i = await i.text();
        [, i] = i.split(startOfLyricsArea);
        [i] = i.split(endOfLyricsArea);
      } catch (o) {
        try {
          i = await fetch(`https://www.google.com/search?q=${urlencode(`${song.tags.artist} ${song.tags.title}`)}`);
          i = await i.text();
          [, i] = i.split(startOfLyricsArea);
          [i] = i.split(endOfLyricsArea);
        } catch (p) {
          i = null;
        }
      }
    }
  }
  if (i && shouldSave) {
    // Save
    const lyricsFile = getLyricFilename(song);
    try {
      fsx.writeFileSync(lyricsFile, i);
    }
    catch (err) {
      //console.log(err)
      // Silently fail...
    }
  }
  return i;
}

function getLyricFilename (song) {
  return `${song.path.substr(0, song.path.lastIndexOf("."))}.txt`;
}

function hasLocal (song) {
  const lyricsFile = getLyricFilename(song);

  return fsx.existsSync(lyricsFile);
}

async function read (song) {
  const lyricsFile = getLyricFilename(song);
  
  try {
    return fsx.readFileSync(lyricsFile).toString().trim();
  }
  catch (err) {
    return 'There is no lyric file for this song';
  }
}

async function setLyrics (song){
  song.lyrics.local = hasLocal(song);

  if (song.lyrics.local) {
    song.lyrics.words = read(song);
  }
  else {
    song.lyrics.words = await download(song, false);
  }

  return song;
}

module.exports = {
  download,
  hasLocal,
  read,
  setLyrics
}
  