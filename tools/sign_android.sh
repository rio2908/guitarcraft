#!/usr/bin/env bash
set -euo pipefail

keystore="$HOME/.android/debug.keystore"
if [[ ! -f "$keystore" ]]; then
    echo "Cached Android debug keystore is missing" >&2
    exit 1
fi

apksigner=''
for sdk in "${ANDROID_HOME:-}" "$HOME/.buildozer/android/platform/android-sdk"; do
    if [[ -d "$sdk/build-tools" ]]; then
        candidate=$(find "$sdk/build-tools" -maxdepth 2 -type f -name apksigner | sort -V | tail -n 1)
        [[ -z "$candidate" ]] || apksigner="$candidate"
    fi
done
if [[ -z "$apksigner" ]]; then
    echo "Android apksigner was not found" >&2
    exit 1
fi

for apk in "$@"; do
    signed="${apk%.apk}-signed.apk"
    "$apksigner" sign --ks "$keystore" --ks-key-alias androiddebugkey \
        --ks-pass pass:android --key-pass pass:android --out "$signed" "$apk"
    mv "$signed" "$apk"
    "$apksigner" verify "$apk"
    echo "Signed and verified $apk with cached debug key"
done
