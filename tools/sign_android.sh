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

certificate=$(mktemp)
trap 'rm -f "$certificate"' EXIT
keytool -exportcert -keystore "$keystore" -alias androiddebugkey \
    -storepass android -file "$certificate" >/dev/null
expected=$(sha256sum "$certificate" | cut -d ' ' -f 1)
for apk in "$@"; do
    signed="${apk%.apk}-signed.apk"
    "$apksigner" sign --ks "$keystore" --ks-key-alias androiddebugkey \
        --ks-pass pass:android --key-pass pass:android --out "$signed" "$apk"
    mv "$signed" "$apk"
    actual=$("$apksigner" verify --print-certs "$apk" |
        awk -F ': ' '/Signer #1 certificate SHA-256 digest:/ { print $2; exit }' | tr -d '\r')
    echo "Cached key: $expected; APK signer: $actual"
    if [[ "$actual" != "$expected" ]]; then
        echo "APK signature differs from cached key" >&2
        exit 1
    fi
    echo "Signed $apk with cached debug key ($actual)"
done
