# AVPlayer Native

This is a native macOS audio player built using Swift and AVFoundation. It provides:

- Native audio playback using AVAudioPlayer
- macOS keyboard media controls (play/pause via media keys)
- JSON-based communication over stdin/stdout
- No external dependencies (mpv, etc.)

## Building

To build the native executable:

```bash
./build.sh
```

Or from the project root:

```bash
npm run build
```

The build script will compile `main.swift` into an executable named `avplayer`.

## Requirements

- macOS with Swift compiler (comes with Xcode Command Line Tools)
- AVFoundation framework (built into macOS)
- MediaPlayer framework (built into macOS)

## Communication Protocol

The player communicates via JSON messages over stdin/stdout.

### Commands (sent to player via stdin)

```json
{"action": "play", "path": "/path/to/song.mp3"}
{"action": "pause"}
{"action": "resume"}
{"action": "stop"}
{"action": "quit"}
```

### Events (received from player via stdout)

```json
{"event": "ready"}
{"event": "playing"}
{"event": "paused"}
{"event": "stopped"}
{"event": "finished"}
{"event": "error", "error": "error message"}
```

## Media Keys

The player automatically registers for macOS media key events:
- Play/Pause button
- Toggle play/pause
- Supports Now Playing info in Control Center
