#!/bin/bash

# Build script for AVPlayer native executable

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "Building AVPlayer native executable..."

# Compile the Swift code
swiftc -O main.swift -o avplayer \
  -framework Foundation \
  -framework AVFoundation \
  -framework MediaPlayer

if [ $? -eq 0 ]; then
    echo "Build successful! Executable created at: $SCRIPT_DIR/avplayer"
else
    echo "Build failed!"
    exit 1
fi
