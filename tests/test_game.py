import math
import tempfile
import unittest
from pathlib import Path

from game_logic import Game, ROOT, load_catalog, read_progress
from microphone import detect_pitch, matches_note


class CatalogTests(unittest.TestCase):
    def test_every_lesson_position_and_syllable_is_valid(self):
        catalog = load_catalog()
        self.assertEqual(len(catalog["songs"]), 4)
        self.assertEqual(sum(len(song["fragments"]) for song in catalog["songs"]), 39)
        self.assertEqual(sum(len(part["notes"]) for song in catalog["songs"]
                             for part in song["fragments"]), 261)
        for position in catalog["positions"].values():
            self.assertIn(position["string"], range(1, 7))
            self.assertIn(position["fret"], range(0, 6))
        used_notes = {note for song in catalog["songs"]
                      for part in song["fragments"] for note in part["notes"]}
        for note in used_notes:
            self.assertTrue((ROOT / "assets" / "samples" / f"{note}.wav").is_file(), note)

    def test_navigation_and_saved_step(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "progress.json"
            game = Game(progress={})
            self.assertFalse(game.move_step(-1))
            game.mark_current(path)
            self.assertIn(game.key(), read_progress(path))
            initial_count = len(game.fragment["notes"])
            for _ in range(initial_count):
                game.move_step(1)
            self.assertEqual((game.fragment_index, game.note_index), (1, 0))
            game.move_step(-1)
            self.assertEqual((game.fragment_index, game.note_index), (0, initial_count - 1))


class PitchTests(unittest.TestCase):
    def test_guitar_like_note_and_neighbouring_note(self):
        for frequency in (146.83, 196.0, 329.63, 440.0):
            samples = [int(10000 * math.sin(2 * math.pi * frequency * i / 16000)
                           + 2500 * math.sin(4 * math.pi * frequency * i / 16000))
                       for i in range(2048)]
            detected = detect_pitch(samples)
            self.assertTrue(matches_note(detected, frequency), (frequency, detected))
            self.assertFalse(matches_note(detected, frequency * 2 ** (2 / 12)))

    def test_silence(self):
        self.assertIsNone(detect_pitch([0] * 2048))


if __name__ == "__main__":
    unittest.main()
