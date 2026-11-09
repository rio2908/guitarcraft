"""Interaction checks for the portrait game screen."""

import os
from queue import Queue
from types import SimpleNamespace
import unittest
from unittest.mock import patch

os.environ.setdefault("SDL_VIDEODRIVER", "dummy")
os.environ.setdefault("SDL_AUDIODRIVER", "dummy")
os.environ.setdefault("PYGAME_HIDE_SUPPORT_PROMPT", "1")

import pygame

from main import GuitarApp, HEIGHT, WIDTH, is_background_event, to_canvas_point


class ScreenTests(unittest.TestCase):
    def test_android_lifecycle_check_supports_packaged_pygame_2_1_0(self):
        old_pygame = SimpleNamespace(QUIT=1, WINDOWFOCUSLOST=2)
        self.assertFalse(is_background_event(old_pygame.QUIT, old_pygame))
        self.assertTrue(is_background_event(old_pygame.WINDOWFOCUSLOST, old_pygame))

    def test_android_display_fills_physical_screen_and_maps_touches(self):
        physical = pygame.Surface((1080, 2340))
        with patch.dict(os.environ, {"ANDROID_ARGUMENT": "/data/app"}), \
                patch("main.Game", return_value=self.app.game), \
                patch("main.pygame.display.set_mode", return_value=physical) as set_mode, \
                patch("main.pygame.display.flip"):
            android_app = GuitarApp()
            self.assertEqual(android_app.screen.get_size(), (WIDTH, HEIGHT))
            set_mode.assert_called_once_with((0, 0), pygame.FULLSCREEN)
            android_app.draw()
            self.assertNotEqual(physical.get_at((1079, 2339))[:3], (0, 0, 0))
            self.assertEqual(to_canvas_point((540, 1170), physical.get_size()), (200, 430))
            android_app.on_touch(to_canvas_point((540, 1575), physical.get_size()))
            self.assertEqual(android_app.game.note_index, 1)

    def setUp(self):
        self.app = GuitarApp()
        self.app.game.completed = {}

    def tearDown(self):
        self.app.stop_playback()
        self.app.stop_listening()
        pygame.quit()

    def test_help_opens_and_blocks_the_lesson_buttons(self):
        self.app.draw()
        self.app.on_touch((218, 32))
        self.assertTrue(self.app.help_open)
        self.app.draw()
        self.app.on_touch((240, 580))
        self.assertEqual(self.app.game.note_index, 0)
        self.assertFalse(self.app.help_open)
        self.app.draw()
        self.app.on_touch((240, 580))
        self.assertEqual(self.app.game.note_index, 1)

    def test_song_playback_contains_every_note(self):
        self.app.game.select_song(2)
        self.app.start_playback("song")
        expected = sum(len(part["notes"]) for part in self.app.game.song["fragments"])
        self.assertEqual(len(self.app.play_events), expected)
        self.assertEqual(self.app.play_events[0][:3], (0, 0, self.app.game.song["fragments"][0]["notes"][0]))
        self.assertEqual(self.app.play_events[-1][0], len(self.app.game.song["fragments"]) - 1)

    def test_old_microphone_result_cannot_complete_a_new_step(self):
        self.app.listen_token = 10
        self.app.listening = True
        self.app.mic_events = Queue()
        self.app.mic_events.put((9, "success", self.app.game.position["frequency"]))
        self.app.update_microphone()
        self.assertEqual(self.app.game.completed, {})
        self.assertTrue(self.app.listening)


if __name__ == "__main__":
    unittest.main()
