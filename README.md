# dmp3

A terminal-based music player wrapper around mpv that enhances your music listening experience with lyrics, smart shuffling, and intuitive keyboard controls.

## Important Note

**dmp3 is NOT an MP3 player itself** - it's a wrapper around [mpv](https://mpv.io/), a powerful media player. You must install mpv before using dmp3.

### Installing mpv on macOS

```bash
brew install mpv
```

For other operating systems, visit [mpv.io](https://mpv.io/installation/) for installation instructions.

## Installation

```bash
npm install -g dmp3
```

Or install locally:

```bash
git clone <repository-url>
cd dmp3
npm run global-install
```

## Usage

```bash
dmp3 [options] <music-directory-or-file>
```

### Command Line Options

- **`<src>`** - Path to music directory or file (required)
- **`--mode, -m <mode>`** - Playback mode (e.g., "random" for shuffle)
- **`--simulate, -s`** - Simulation mode (shows what would play without actually playing)
- **`--loglevel, -l <level>`** - Log level (number, default: -1)

### Examples

```bash
# Play music from a directory
dmp3 ~/Music

# Play in shuffle mode
dmp3 --mode random ~/Music

# Simulate playback (dry run)
dmp3 --simulate ~/Music

# Set log level
dmp3 --loglevel 2 ~/Music
```

## Keyboard Controls

Once dmp3 is running, use these keyboard shortcuts to control playback:

| Key | Action |
|-----|--------|
| `h` | Show help |
| `c` | Play/Pause toggle |
| `z` | Previous song |
| `v` | Next song |
| `x` | Stop playback |
| `d` | Show song details |
| `l` | Show/hide lyrics |
| `o` | Override lyrics with fresh download |
| `p` | Override lyrics with clipboard content |
| `y` | Confirm override action |
| `n` | Cancel override action |
| `f` | Mark song as favorite |
| `q` | Quit player |
| `Ctrl+C` | Force quit |

## Lyrics Feature

dmp3 automatically downloads and displays lyrics for your music using a sophisticated fallback system:

### How Lyrics Work

1. **Automatic Download**: Lyrics are automatically fetched when a song starts playing
2. **Local Storage**: Downloaded lyrics are saved as `.txt` files next to your music files for offline access
3. **Smart Fallback**: Uses multiple sources to ensure high success rate:
   - Primary: Google search scraping
   - Fallback: Genius.com API
4. **Manual Override**: Replace lyrics with clipboard content or force re-download

### Lyrics Commands

- Press `l` to toggle lyrics display
- Press `o` to download fresh lyrics (overrides existing)
- Press `p` to paste lyrics from clipboard
- Press `y` to confirm override, `n` to cancel

## Shuffle Algorithm

dmp3 uses a sophisticated shuffle system designed for optimal randomness:

### Smart Randomization

- **True Random**: Uses Random.org API for genuine randomness (falls back to Math.random())
- **Directory Navigation**: Randomly traverses subdirectories to discover new music
- **Playback Tracking**: Remembers played songs to avoid immediate repetition
- **Hierarchical Shuffle**: Handles nested directory structures intelligently

### Buffering System

dmp3 pre-buffers the next song for seamless playback, especially useful for:

- **Network Storage**: Google Drive, Dropbox, or other cloud-mounted folders
- **Slow Storage**: External drives or network-attached storage
- **Seamless Experience**: 30-second pre-buffer ensures no gaps between songs

## Scripts

### Available npm Scripts

- **`npm run dev`** - Run dmp3 in development mode
- **`npm run global-install`** - Install dmp3 globally
- **`npm run show-mem`** - Show memory usage of dmp3 and mpv processes

### Memory Monitoring

```bash
npm run show-mem
```

This displays current memory usage of both dmp3 and mpv processes, useful for monitoring resource consumption during long listening sessions.

## Requirements

- **Node.js**: Version 23 or higher
- **mpv**: Media player (must be installed separately)
- **Terminal**: Any terminal that supports keyboard input

## Features

-  Terminal-based interface with keyboard controls
-  Automatic lyrics download and display
-  Smart shuffle with true randomness
-  Pre-buffering for seamless playback
-  Cloud storage support (Google Drive, etc.)
-  Memory monitoring tools
-  Simulation mode for testing
-  Favorite song tracking
-  Hierarchical directory navigation

## License

MIT

---

**Enjoy your music with dmp3!** <µ