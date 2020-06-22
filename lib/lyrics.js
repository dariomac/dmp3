const fetch = require('node-fetch');
const urlencode = require('urlencode');
const fsx = require('fs-extra');

async function download (song) {
  let i;
  
  try {
    i = await fetch(`https://www.google.com/search?q=${urlencode(`${song.tags.artist} ${song.tags.title}`)}+lyrics`);
    i = await i.text();
    [, i] = i.split('</div></div></div></div><div class="hwc"><div class="BNeawe tAd8D AP7Wnd"><div><div class="BNeawe tAd8D AP7Wnd">');
    [i] = i.split('</div></div></div></div></div><div><span class="hwc"><div class="BNeawe uEec3 AP7Wnd">');
  } catch (m) {
    try {
      i = await fetch(`https://www.google.com/search?q=${urlencode(`${song.tags.artist} ${song.tags.title}`)}+song+lyrics`);
      i = await i.text();
      [, i] = i.split('</div></div></div></div><div class="hwc"><div class="BNeawe tAd8D AP7Wnd"><div><div class="BNeawe tAd8D AP7Wnd">');
      [i] = i.split('</div></div></div></div></div><div><span class="hwc"><div class="BNeawe uEec3 AP7Wnd">');
    } catch (n) {
      try {
        i = await fetch(`https://www.google.com/search?q=${urlencode(`${song.tags.artist} ${song.tags.title}`)}+song`);
        i = await i.text();
        [, i] = i.split('</div></div></div></div><div class="hwc"><div class="BNeawe tAd8D AP7Wnd"><div><div class="BNeawe tAd8D AP7Wnd">');
        [i] = i.split('</div></div></div></div></div><div><span class="hwc"><div class="BNeawe uEec3 AP7Wnd">');
      } catch (o) {
        try {
          i = await fetch(`https://www.google.com/search?q=${urlencode(`${song.tags.artist} ${song.tags.title}`)}`);
          i = await i.text();
          [, i] = i.split('</div></div></div></div><div class="hwc"><div class="BNeawe tAd8D AP7Wnd"><div><div class="BNeawe tAd8D AP7Wnd">');
          [i] = i.split('</div></div></div></div></div><div><span class="hwc"><div class="BNeawe uEec3 AP7Wnd">');
        } catch (p) {
          i = null;
        }
      }
    }
  }
  if (i) {
    // Save
    const lyricFile = getLyricFilename(song);
    fsx.writeFileSync(lyricFile, i);
  }
  return i;
}

function getLyricFilename (song) {
  return `${song.path.substr(0, song.path.lastIndexOf("."))}.txt`;
}

function hasLocal (song) {
  const lyricFile = getLyricFilename(song);

  return fsx.existsSync(lyricFile);
}

function read (song) {
  const lyricFile = getLyricFilename(song);

  return fsx.readFileSync(lyricFile).toString().trim();
}

module.exports = {
  download,
  hasLocal,
  read
}
  