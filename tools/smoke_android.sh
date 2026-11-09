#!/usr/bin/env bash
set -euo pipefail

apk="${1:?APK path is required}"
package='org.game.guitarcraft'
adb install -r "$apk"
adb logcat -c
adb shell am start -W -n "$package/org.kivy.android.PythonActivity"
sleep 20

if ! adb shell pidof "$package" >/dev/null; then
    adb logcat -d -v brief | grep -E -A 25 'AndroidRuntime|Traceback|python|SDL|pygame' | tail -n 160 || true
    echo 'GuitarCraft process stopped after launch' >&2
    exit 1
fi

echo 'GuitarCraft stayed open for 20 seconds'
adb exec-out screencap -p > "$RUNNER_TEMP/guitarcraft-screen.png"
