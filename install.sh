#!/bin/bash
set -e

REPO="kcterala/work-cli"  # Replace with your GitHub repo
BINARY_NAME="work"    # Replace with your binary name

# Detect platform
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
case $OS in
    darwin*) PLATFORM="macos" ;;
    linux*)  PLATFORM="linux" ;;
    *) echo "Unsupported OS: $OS" && exit 1 ;;
esac

echo "Installing $BINARY_NAME for $PLATFORM..."

# Get latest version
VERSION=$(curl -s "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')
if [[ -z "$VERSION" ]]; then
    echo "Failed to get latest version" && exit 1
fi

# Download and install
URL="https://github.com/${REPO}/releases/download/${VERSION}/${BINARY_NAME}-${PLATFORM}.tar.gz"
TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"

curl -sL "$URL" | tar -xz
chmod +x "${BINARY_NAME}-${PLATFORM}"

# Try different install directories in order of preference
INSTALL_DIRS=("$HOME/.local/bin" "$HOME/bin" "$HOME/.bin" "$HOME/tools")

INSTALL_DIR=""
for dir in "${INSTALL_DIRS[@]}"; do
    if mkdir -p "$dir" 2>/dev/null && [[ -w "$dir" ]]; then
        INSTALL_DIR="$dir"
        break
    fi
done

if [[ -z "$INSTALL_DIR" ]]; then
    echo "Cannot find writable directory. Trying current directory..."
    INSTALL_DIR="$(pwd)"
fi

echo "Installing to: $INSTALL_DIR"
mv "${BINARY_NAME}-${PLATFORM}" "$INSTALL_DIR/$BINARY_NAME"

# Add to PATH if not current directory and not already in PATH
if [[ "$INSTALL_DIR" != "$(pwd)" && ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo "Adding $INSTALL_DIR to PATH..."
    echo "export PATH=\"$INSTALL_DIR:\$PATH\"" >> ~/.zshrc
    echo "⚠️  Restart your terminal or run: source ~/.zshrc"
else
    echo "Run with: $INSTALL_DIR/$BINARY_NAME"
fi

rm -rf "$TMP_DIR"
echo "✓ Installed $BINARY_NAME successfully!"
echo "Run: $BINARY_NAME --help"