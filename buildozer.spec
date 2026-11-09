[app]
title = ГитарКрафт
package.name = guitarcraft
package.domain = org.game
source.dir = .
source.include_exts = py,json,wav,png,md,ttf,txt
source.exclude_dirs = .git,.github,.openai,android,dist,tests,build,bin,.buildozer
source.exclude_patterns = __pycache__/*,*.pyc,guitarcraft-progress.json,guitarcraft-progress.tmp
version = 0.7
icon.filename = assets/icon.png
icon.adaptive_foreground.filename = assets/icon-foreground.png
icon.adaptive_background.filename = assets/icon-background.png
requirements = python3==3.10.11,hostpython3==3.10.11,pygame,pyjnius
orientation = portrait
fullscreen = 1
android.archs = arm64-v8a, x86_64
android.allow_backup = True
android.api = 34
android.minapi = 24
android.numeric_version = 7
android.permissions = RECORD_AUDIO
android.release_artifact = apk
android.ndk = 25b
android.enable_androidx = True
p4a.bootstrap = sdl2
p4a.branch = v2024.01.21

[buildozer]
log_level = 2
warn_on_root = 1
