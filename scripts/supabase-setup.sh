#!/usr/bin/env bash
set -euo pipefail

# Simple supabase CLI check/install helper for macOS/Linux
# Usage: bash scripts/supabase-setup.sh

echo "Checking for supabase CLI..."
if command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI already installed: $(supabase --version)"
  exit 0
fi

# Try Homebrew (macOS / Linuxbrew)
if command -v brew >/dev/null 2>&1; then
  echo "Homebrew found. Installing supabase CLI via Homebrew..."
  brew tap supabase/tap || true
  brew install supabase/tap/supabase || {
    echo "Homebrew install failed. You can try npm installation:";
    echo "  npm install -g supabase";
    exit 1
  }
  echo "Installed supabase via Homebrew.";
  exit 0
fi

# Fallback to npm
if command -v npm >/dev/null 2>&1; then
  echo "Installing supabase CLI via npm (requires write access to global packages)..."
  npm install -g supabase || {
    echo "npm global install failed. Try with sudo or use Homebrew:";
    echo "  sudo npm install -g supabase";
    exit 1
  }
  echo "Installed supabase via npm.";
  exit 0
fi

# If neither found
echo "No package manager found (homebrew or npm). Follow manual install instructions:";
echo "https://supabase.com/docs/guides/cli"
exit 1
