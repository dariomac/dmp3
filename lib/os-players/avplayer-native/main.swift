import Foundation
import AVFoundation
import MediaPlayer

class AudioPlayer: NSObject, AVAudioPlayerDelegate {
    private var audioPlayer: AVAudioPlayer?
    private var isRunning = true
    private var currentPath: String?

    override init() {
        super.init()
        setupRemoteControls()
        sendEvent(event: "ready")
    }

    func setupRemoteControls() {
        let commandCenter = MPRemoteCommandCenter.shared()

        // Play command
        commandCenter.playCommand.isEnabled = true
        commandCenter.playCommand.addTarget { [weak self] _ in
            self?.handleRemotePlay()
            return .success
        }

        // Pause command
        commandCenter.pauseCommand.isEnabled = true
        commandCenter.pauseCommand.addTarget { [weak self] _ in
            self?.handleRemotePause()
            return .success
        }

        // Toggle play/pause
        commandCenter.togglePlayPauseCommand.isEnabled = true
        commandCenter.togglePlayPauseCommand.addTarget { [weak self] _ in
            self?.handleRemoteToggle()
            return .success
        }

        // Next track
        commandCenter.nextTrackCommand.isEnabled = false

        // Previous track
        commandCenter.previousTrackCommand.isEnabled = false
    }

    func handleRemotePlay() {
        resume()
    }

    func handleRemotePause() {
        pause()
    }

    func handleRemoteToggle() {
        guard let player = audioPlayer else { return }
        if player.isPlaying {
            pause()
        } else {
            resume()
        }
    }

    func play(path: String) {
        stop()

        currentPath = path
        let url = URL(fileURLWithPath: path)

        do {
            audioPlayer = try AVAudioPlayer(contentsOf: url)
            audioPlayer?.delegate = self
            audioPlayer?.prepareToPlay()
            audioPlayer?.play()

            updateNowPlayingInfo(path: path)
            sendEvent(event: "playing")
        } catch {
            sendError(error: "Failed to play: \(error)")
        }
    }

    func pause() {
        guard let player = audioPlayer, player.isPlaying else { return }
        player.pause()
        updatePlaybackState(isPlaying: false)
        sendEvent(event: "paused")
    }

    func resume() {
        guard let player = audioPlayer else { return }

        // Prepare the player before resuming to reduce latency
        player.prepareToPlay()
        player.play()
        updatePlaybackState(isPlaying: true)
        sendEvent(event: "playing")
    }

    func stop() {
        guard let player = audioPlayer else { return }
        player.stop()
        audioPlayer = nil
        clearNowPlayingInfo()
        sendEvent(event: "stopped")
    }

    func quit() {
        stop()
        isRunning = false
    }

    func updatePlaybackState(isPlaying: Bool) {
        guard var nowPlayingInfo = MPNowPlayingInfoCenter.default().nowPlayingInfo else { return }

        nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = isPlaying ? 1.0 : 0.0

        if let player = audioPlayer {
            nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = player.currentTime
        }

        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
    }

    func updateNowPlayingInfo(path: String) {
        let fileName = URL(fileURLWithPath: path).lastPathComponent

        var nowPlayingInfo: [String: Any] = [
            MPMediaItemPropertyTitle: fileName,
            MPNowPlayingInfoPropertyPlaybackRate: 1.0
        ]

        if let player = audioPlayer {
            nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = player.duration
            nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = player.currentTime
        }

        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
    }

    func clearNowPlayingInfo() {
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
    }

    // AVAudioPlayerDelegate
    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        if flag {
            sendEvent(event: "finished")
            audioPlayer = nil
        } else {
            sendError(error: "Playback finished unsuccessfully")
        }
    }

    func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        sendError(error: "Decode error: \(error?.localizedDescription ?? "unknown")")
    }

    func sendEvent(event: String, data: [String: Any]? = nil) {
        var message: [String: Any] = ["event": event]
        if let data = data {
            message.merge(data) { _, new in new }
        }
        sendMessage(message)
    }

    func sendError(error: String) {
        sendMessage(["event": "error", "error": error])
    }

    func sendMessage(_ message: [String: Any]) {
        if let jsonData = try? JSONSerialization.data(withJSONObject: message),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            print(jsonString)
            fflush(stdout)
        }
    }

    func processCommand(_ command: [String: Any]) {
        guard let action = command["action"] as? String else {
            sendError(error: "No action specified")
            return
        }

        switch action {
        case "play":
            if let path = command["path"] as? String {
                play(path: path)
            } else {
                sendError(error: "No path specified for play command")
            }
        case "pause":
            pause()
        case "resume":
            resume()
        case "stop":
            stop()
        case "quit":
            quit()
        default:
            sendError(error: "Unknown action: \(action)")
        }
    }

    func run() {
        let inputQueue = DispatchQueue(label: "input-queue")

        inputQueue.async {
            while self.isRunning {
                if let line = readLine() {
                    if let data = line.data(using: .utf8),
                       let command = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                        DispatchQueue.main.async {
                            self.processCommand(command)
                        }
                    }
                }
            }
            exit(0)
        }

        RunLoop.main.run()
    }
}

// Main execution
let player = AudioPlayer()
player.run()
