"""Melodies, fret positions, navigation, and progress for GuitarCraft."""

import json
import os
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent


def load_catalog(path=ROOT / "songs.json"):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    positions = data["positions"]
    songs = data["songs"]
    if not songs or len({song["id"] for song in songs}) != len(songs):
        raise ValueError("The catalog needs songs with unique IDs")
    for song in songs:
        if not song["fragments"]:
            raise ValueError(f"{song['id']} has no fragments")
        for part in song["fragments"]:
            count = len(part["notes"])
            if not count or len(part["beats"]) != count or len(part["soundBeats"]) != count:
                raise ValueError(f"Invalid fragment in {song['id']}")
            if part["syllables"] and len(part["syllables"]) != count:
                raise ValueError(f"Lyrics do not match notes in {song['id']}")
            for note in part["notes"]:
                if note not in positions:
                    raise ValueError(f"Unknown note {note} in {song['id']}")
    return data


def save_path():
    if sys.platform == "android" or "ANDROID_ARGUMENT" in os.environ:
        from android.storage import app_storage_path
        return Path(app_storage_path()) / "guitarcraft-progress.json"
    return ROOT / "guitarcraft-progress.json"


def read_progress(path=None):
    target = Path(path) if path else save_path()
    try:
        data = json.loads(target.read_text(encoding="utf-8"))
        return {key: True for key, value in data.items() if isinstance(key, str) and value is True}
    except (OSError, ValueError, TypeError):
        return {}


def write_progress(progress, path=None):
    target = Path(path) if path else save_path()
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_suffix(".tmp")
    temporary.write_text(json.dumps(progress, ensure_ascii=False), encoding="utf-8")
    temporary.replace(target)


class Game:
    def __init__(self, catalog=None, progress=None):
        self.catalog = catalog or load_catalog()
        self.completed = read_progress() if progress is None else progress
        self.song_index = 0
        self.fragment_index = 0
        self.note_index = 0

    @property
    def songs(self):
        return self.catalog["songs"]

    @property
    def song(self):
        return self.songs[self.song_index]

    @property
    def fragment(self):
        return self.song["fragments"][self.fragment_index]

    @property
    def note_id(self):
        return self.fragment["notes"][self.note_index]

    @property
    def position(self):
        return self.catalog["positions"][self.note_id]

    @property
    def syllable(self):
        syllables = self.fragment["syllables"]
        return syllables[self.note_index] if syllables else ""

    def key(self, fragment_index=None, note_index=None):
        fragment_index = self.fragment_index if fragment_index is None else fragment_index
        note_index = self.note_index if note_index is None else note_index
        return f"{self.song.get('progressId', self.song['id'])}:{fragment_index}:{note_index}"

    def mark_current(self, path=None):
        self.completed[self.key()] = True
        write_progress(self.completed, path)

    def progress(self):
        total = sum(len(part["notes"]) for part in self.song["fragments"])
        done = sum(
            self.key(fragment_index, note_index) in self.completed
            for fragment_index, part in enumerate(self.song["fragments"])
            for note_index in range(len(part["notes"]))
        )
        return done, total

    def select_song(self, index):
        if not 0 <= index < len(self.songs):
            return False
        self.song_index = index
        self.fragment_index = 0
        self.note_index = 0
        return True

    def move_fragment(self, direction):
        next_index = self.fragment_index + direction
        if not 0 <= next_index < len(self.song["fragments"]):
            return False
        self.fragment_index = next_index
        self.note_index = 0
        return True

    def move_step(self, direction):
        if direction < 0:
            if self.note_index > 0:
                self.note_index -= 1
            elif self.fragment_index > 0:
                self.fragment_index -= 1
                self.note_index = len(self.fragment["notes"]) - 1
            else:
                return False
        elif self.note_index + 1 < len(self.fragment["notes"]):
            self.note_index += 1
        elif self.fragment_index + 1 < len(self.song["fragments"]):
            self.fragment_index += 1
            self.note_index = 0
        else:
            self.fragment_index = 0
            self.note_index = 0
        return True
