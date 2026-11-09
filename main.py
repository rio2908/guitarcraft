"""Portrait Android guitar lesson, written in Python with pygame."""

import os
from pathlib import Path
from queue import Empty, Queue
import sys

os.environ.setdefault("PYGAME_HIDE_SUPPORT_PROMPT", "1")
import pygame

from game_logic import Game
from instructions import HELP_STEPS
from microphone import AndroidRecorder, request_microphone


ROOT = Path(__file__).resolve().parent
WIDTH, HEIGHT = 400, 860
BACKGROUND = (246, 249, 247)
PANEL = (255, 255, 255)
GREEN = (27, 100, 77)
GREEN_PALE = (222, 241, 230)
GREEN_LIGHT = (84, 145, 115)
TEXT = (33, 53, 45)
MUTED = (92, 111, 102)
LINE = (209, 224, 215)
ORANGE = (225, 113, 61)
WHITE = (255, 255, 255)
FRETBOARD = (244, 248, 245)
FRET = (157, 179, 165)
STRING = (137, 157, 145)


def is_background_event(event_type, pygame_api=pygame):
    """Accept lifecycle events available in the packaged pygame version."""
    return event_type in tuple(
        getattr(pygame_api, name, -1)
        for name in ("APP_WILLENTERBACKGROUND", "APP_DIDENTERBACKGROUND", "WINDOWFOCUSLOST")
    )


def to_canvas_point(point, display_size):
    """Map a physical screen touch back to the 400×860 game canvas."""
    return (int(point[0] * WIDTH / display_size[0]),
            int(point[1] * HEIGHT / display_size[1]))


class GuitarApp:
    def __init__(self):
        pygame.mixer.pre_init(44100, -16, 2, 512)
        pygame.init()
        if sys.platform == "android" or "ANDROID_ARGUMENT" in os.environ:
            self.display = pygame.display.set_mode((0, 0), pygame.FULLSCREEN)
        else:
            self.display = pygame.display.set_mode((WIDTH, HEIGHT))
        self.screen = pygame.Surface((WIDTH, HEIGHT))
        pygame.display.set_caption("ГитарКрафт")
        self.background = self.make_background()
        self.clock = pygame.time.Clock()
        self.fonts = {}
        self.game = Game()
        self.samples = {}
        self.channel = pygame.mixer.Channel(0) if pygame.mixer.get_init() else None
        self.buttons = []
        self.chooser = False
        self.help_open = False
        self.feedback = "Смотри на струну и лад. Сыграй ноту."
        self.feedback_color = GREEN
        self.play_kind = None
        self.play_events = []
        self.play_index = 0
        self.play_next_at = 0
        self.play_origin = None
        self.mic_events = Queue()
        self.recorder = None
        self.listening = False
        self.listen_token = 0
        self.last_touch = None

    def make_background(self):
        surface = pygame.Surface((WIDTH, HEIGHT))
        surface.fill(BACKGROUND)
        pygame.draw.rect(surface, WHITE, (0, 0, WIDTH, 64))
        pygame.draw.line(surface, LINE, (0, 63), (WIDTH, 63), 1)
        return surface

    def font(self, size, bold=False):
        key = (size, bold)
        if key not in self.fonts:
            filename = "NotoSans-Bold.ttf" if bold else "NotoSans-Regular.ttf"
            self.fonts[key] = pygame.font.Font(str(ROOT / "assets" / "fonts" / filename), size)
        return self.fonts[key]

    def label(self, text, x, y, size=20, color=TEXT, bold=False, align="left", limit=None):
        text = str(text)
        font = self.font(size, bold)
        if limit:
            while font.size(text)[0] > limit and size > 15:
                size -= 1
                font = self.font(size, bold)
            while font.size(text)[0] > limit and text:
                text = text[:-2] + "…"
        image = font.render(text, True, color)
        rect = image.get_rect()
        if align == "center":
            rect.center = (x, y)
        elif align == "right":
            rect.topright = (x, y)
        else:
            rect.topleft = (x, y)
        self.screen.blit(image, rect)

    def rounded(self, rect, fill, border=None, radius=14):
        pygame.draw.rect(self.screen, fill, rect, border_radius=radius)
        pygame.draw.rect(self.screen, border or LINE, rect, 2, border_radius=radius)

    def button(self, name, rect, title, fill=WHITE, color=TEXT, size=17, enabled=True):
        self.rounded(rect, fill if enabled else (233, 238, 235), LINE, 12)
        self.label(title, rect.centerx, rect.centery, size,
                   color if enabled else MUTED, bold=True, align="center", limit=rect.width - 10)
        if enabled:
            self.buttons.append((name, rect))

    def draw(self):
        self.buttons = []
        self.screen.blit(self.background, (0, 0))
        self.label("ГитарКрафт", 16, 15, 23, GREEN, True)
        self.button("help", pygame.Rect(201, 10, 42, 43), "?", PANEL, size=23)
        self.button("choose", pygame.Rect(251, 10, 133, 43), "Мелодии", GREEN_PALE, size=17)

        song = self.game.song
        part = self.game.fragment
        position = self.game.position
        self.label(song["title"], 18, 72, 23, TEXT, True, limit=365)
        self.label(part["lyricLine"] or part["title"], 18, 103, 17, MUTED, limit=365)
        self.label(f"Шаг {self.game.note_index + 1} из {len(part['notes'])}", 18, 129, 17, GREEN, True)
        self.draw_steps(part)
        self.draw_fretboard(position)

        self.button("previous", pygame.Rect(14, 566, 112, 54), "Назад", size=18)
        self.button("next", pygame.Rect(134, 566, 252, 54), "Следующий", GREEN_PALE, size=19)
        self.button("note", pygame.Rect(14, 629, 180, 54), "Звук", size=18)
        fragment_label = "Стоп" if self.play_kind == "fragment" else "Фрагмент"
        self.button("fragment", pygame.Rect(206, 629, 180, 54), fragment_label, size=18)
        song_label = "Стоп" if self.play_kind == "song" else "Вся песня"
        self.button("song", pygame.Rect(14, 692, 180, 54), song_label, GREEN_PALE, size=18)
        check_label = "Слушаю..." if self.listening else "Проверить"
        self.button("check", pygame.Rect(206, 692, 180, 54), check_label,
                    ORANGE, WHITE, size=18, enabled=not self.listening)

        self.rounded(pygame.Rect(14, 756, 372, 67), PANEL, LINE)
        self.draw_feedback()
        done, total = self.game.progress()
        self.label(f"Пройдено: {done} из {total}", 18, 833, 16, MUTED)

        if self.help_open:
            self.draw_help()
        elif self.chooser:
            self.draw_chooser()
        display_size = self.display.get_size()
        if display_size == (WIDTH, HEIGHT):
            self.display.blit(self.screen, (0, 0))
        else:
            pygame.transform.smoothscale(self.screen, display_size, self.display)
        pygame.display.flip()

    def draw_feedback(self):
        font = self.font(17)
        lines = []
        current = ""
        for word in self.feedback.split():
            candidate = f"{current} {word}".strip()
            if current and font.size(candidate)[0] > 344:
                lines.append(current)
                current = word
            else:
                current = candidate
        if current:
            lines.append(current)
        for index, line in enumerate(lines[:2]):
            self.label(line, 26, 765 + index * 23, 17,
                       self.feedback_color, limit=344)

    def draw_steps(self, part):
        notes = part["notes"]
        count = len(notes)
        columns = min(count, 5)
        gap = 6
        width = (368 - gap * (columns - 1)) / columns
        two_rows = count > 5
        for index in range(count):
            column = index % columns
            row = index // columns
            x = int(16 + column * (width + gap))
            right = int(16 + (column + 1) * width + column * gap)
            top = 158 + row * 63
            rect = pygame.Rect(x, top, right - x, 56 if two_rows else 118)
            active = index == self.game.note_index
            done = self.game.key(self.game.fragment_index, index) in self.game.completed
            fill = GREEN if active else GREEN_PALE if done else PANEL
            self.rounded(rect, fill, GREEN if active else LINE, 12)
            self.buttons.append((f"step:{index}", rect))
            position = self.game.catalog["positions"][notes[index]]
            fret_string = f"л{position['fret']}/с{position['string']}"
            syllables = part["syllables"]
            if syllables:
                self.label(syllables[index], rect.centerx, top + (16 if two_rows else 36),
                           19 if two_rows else 25, WHITE if active else TEXT,
                           True, "center", limit=rect.width - 8)
                self.label(fret_string, rect.centerx, top + (41 if two_rows else 84),
                           16 if two_rows else 20, WHITE if active else GREEN,
                           True, "center", limit=rect.width - 8)
            else:
                self.label(fret_string, rect.centerx, rect.centery,
                           17 if two_rows else 22, WHITE if active else TEXT,
                           True, "center", limit=rect.width - 8)

    def draw_fretboard(self, position):
        panel = pygame.Rect(12, 284, 376, 270)
        self.rounded(panel, PANEL, LINE, 16)
        self.button("prev_fragment", pygame.Rect(24, 294, 50, 38), "‹", GREEN_PALE,
                    size=26, enabled=self.game.fragment_index > 0)
        self.label(f"Фрагмент {self.game.fragment_index + 1}/{len(self.game.song['fragments'])}",
                   200, 313, 17, GREEN, True, "center")
        self.button("next_fragment", pygame.Rect(326, 294, 50, 38), "›", GREEN_PALE,
                    size=26, enabled=self.game.fragment_index + 1 < len(self.game.song["fragments"]))

        fret_text = "Открытая" if position["fret"] == 0 else f"Лад {position['fret']}"
        self.label(f"Струна {position['string']}   {fret_text}", 200, 342,
                   25, TEXT, True, "center", limit=355)
        self.label("1 — тонкая     6 — толстая", 200, 373, 16, MUTED, align="center")

        x0 = 72
        cell_width = 59
        y0 = 416
        y_gap = 23
        pygame.draw.rect(self.screen, FRETBOARD, (x0 - 5, 405, 305, 138), border_radius=10)
        for fret in range(1, 6):
            x = x0 + (fret - 0.5) * cell_width
            self.label(str(fret), int(x), 394, 16, MUTED, align="center")
        for boundary in range(6):
            x = x0 + boundary * cell_width
            pygame.draw.line(self.screen, GREEN if boundary == 0 else FRET,
                             (x, 406), (x, 540), 4 if boundary == 0 else 2)
        for string in range(1, 7):
            y = y0 + (string - 1) * y_gap
            active = string == position["string"]
            pygame.draw.line(self.screen, ORANGE if active else STRING,
                             (x0, y), (x0 + 5 * cell_width, y), 3 if active else 2)
            self.label(str(string), 38, y, 18, GREEN if active else MUTED,
                       active, "center")
        marker_x = int(x0 + (max(1, position["fret"]) - 0.5) * cell_width)
        marker_y = y0 + (position["string"] - 1) * y_gap
        if position["fret"] == 0:
            pygame.draw.circle(self.screen, ORANGE, (marker_x, marker_y), 15, 3)
        else:
            pygame.draw.circle(self.screen, ORANGE, (marker_x, marker_y), 16)
            self.label(str(position["fret"]), marker_x, marker_y, 18,
                       WHITE, True, "center")

    def draw_chooser(self):
        shade = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        shade.fill((13, 20, 15, 190))
        self.screen.blit(shade, (0, 0))
        self.buttons = []
        self.rounded(pygame.Rect(17, 200, 366, 450), PANEL)
        self.label("Выбери мелодию", 36, 223, 27, TEXT, True)
        self.button("close", pygame.Rect(324, 216, 42, 42), "×", GREEN_PALE, TEXT, size=23)
        for index, song in enumerate(self.game.songs):
            rect = pygame.Rect(32, 281 + index * 84, 336, 70)
            self.rounded(rect, GREEN_PALE if index == self.game.song_index else WHITE, LINE)
            self.label(song["title"], rect.x + 14, rect.y + 13, 19,
                       TEXT, True, limit=rect.width - 27)
            self.label(f"{len(song['fragments'])} фрагментов", rect.x + 14,
                       rect.y + 41, 15, MUTED)
            self.buttons.append((f"song:{index}", rect))

    def draw_help(self):
        shade = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        shade.fill((13, 20, 15, 190))
        self.screen.blit(shade, (0, 0))
        self.buttons = []
        self.rounded(pygame.Rect(17, 118, 366, 628), PANEL)
        self.label("Как играть", 34, 140, 27, TEXT, True)
        self.button("close_help", pygame.Rect(324, 133, 42, 42), "×", GREEN_PALE, TEXT, size=23)
        for index, (title, detail) in enumerate(HELP_STEPS):
            y = 199 + index * 99
            self.rounded(pygame.Rect(31, y, 338, 86), WHITE)
            pygame.draw.circle(self.screen, GREEN, (62, y + 33), 19)
            self.label(index + 1, 62, y + 33, 19, WHITE, True, "center")
            self.label(title, 92, y + 14, 19, TEXT, True, limit=258)
            self.label(detail, 44, y + 57, 16, MUTED, limit=307)
        self.label("Ритм не проверяется", 200, 713, 16, MUTED, align="center")

    def stop_playback(self):
        self.play_kind = None
        self.play_events = []
        self.play_index = 0
        if self.channel:
            self.channel.stop()

    def stop_listening(self):
        self.listen_token += 1
        if self.recorder:
            self.recorder.stop()
            self.recorder = None
        self.listening = False

    def play_note(self, note_id, duration_ms=800):
        if not self.channel:
            self.feedback = "Не удалось включить звук на устройстве."
            self.feedback_color = ORANGE
            return
        try:
            if note_id not in self.samples:
                self.samples[note_id] = pygame.mixer.Sound(
                    str(ROOT / "assets" / "samples" / f"{note_id}.wav")
                )
            self.channel.play(self.samples[note_id], maxtime=max(120, int(duration_ms)), fade_ms=10)
        except (OSError, pygame.error):
            self.feedback = "Не удалось загрузить звук гитары."
            self.feedback_color = ORANGE

    def start_playback(self, kind):
        if self.play_kind == kind:
            self.stop_playback()
            self.feedback = "Воспроизведение остановлено."
            return
        self.stop_listening()
        self.stop_playback()
        self.play_origin = (self.game.fragment_index, self.game.note_index)
        self.play_kind = kind
        song = self.game.song
        indices = range(len(song["fragments"])) if kind == "song" else [self.game.fragment_index]
        pace = 1.15 if kind == "fragment" else 1.0
        for fragment_index in indices:
            part = song["fragments"][fragment_index]
            for note_index, note_id in enumerate(part["notes"]):
                duration = song["beatMs"] * part["beats"][note_index] * pace
                sound_duration = song["beatMs"] * part["soundBeats"][note_index] * pace
                pause_after = part["pauseAfter"] if note_index == len(part["notes"]) - 1 else 0
                if pause_after is True:
                    pause_after = 240
                self.play_events.append((fragment_index, note_index, note_id,
                                         duration, sound_duration, pause_after or 0))
        self.play_index = 0
        self.play_next_at = pygame.time.get_ticks()
        self.feedback = "Играет вся песня…" if kind == "song" else "Играет фрагмент…"
        self.feedback_color = GREEN

    def update_playback(self):
        if not self.play_kind or pygame.time.get_ticks() < self.play_next_at:
            return
        if self.play_index >= len(self.play_events):
            self.stop_playback()
            self.game.fragment_index, self.game.note_index = self.play_origin
            self.feedback = "Готово. Теперь попробуй сыграть сам."
            return
        frag, note, note_id, duration, sound_duration, pause_after = self.play_events[self.play_index]
        self.game.fragment_index, self.game.note_index = frag, note
        self.play_note(note_id, sound_duration)
        self.play_index += 1
        self.play_next_at = pygame.time.get_ticks() + int(duration + pause_after)

    def check_current_note(self):
        self.stop_playback()
        self.stop_listening()
        self.listening = True
        self.feedback = "Слушаю гитару… Сыграй одну ноту."
        self.feedback_color = GREEN
        request_microphone(self.mic_events, self.listen_token)

    def update_microphone(self):
        while True:
            try:
                token, kind, value = self.mic_events.get_nowait()
            except Empty:
                break
            if token != self.listen_token or not self.listening:
                continue
            if kind == "permission":
                if value:
                    self.recorder = AndroidRecorder(self.game.position["frequency"], self.mic_events, token)
                    self.recorder.start()
                else:
                    self.stop_listening()
                    self.feedback = "Разреши доступ к микрофону и попробуй снова."
                    self.feedback_color = ORANGE
            elif kind == "success":
                self.stop_listening()
                self.game.mark_current()
                self.feedback = "Отлично! Звук совпал."
                self.feedback_color = GREEN
            elif kind == "retry":
                self.stop_listening()
                self.feedback = ("Пока не совпало. Попробуй ещё раз." if value
                                 else "Не услышал звук. Поднеси гитару ближе.")
                self.feedback_color = ORANGE
            elif kind == "error":
                self.stop_listening()
                self.feedback = value
                self.feedback_color = ORANGE

    def activate(self, name):
        if name == "help":
            self.stop_playback()
            self.stop_listening()
            self.help_open = True
            return
        if name == "close_help":
            self.help_open = False
            return
        if name == "choose":
            self.stop_playback()
            self.stop_listening()
            self.chooser = True
            return
        if name == "close":
            self.chooser = False
            return
        if name.startswith("song:"):
            self.stop_playback()
            self.stop_listening()
            self.game.select_song(int(name.split(":")[1]))
            self.chooser = False
        elif name in ("previous", "next", "prev_fragment", "next_fragment") or name.startswith("step:"):
            self.stop_playback()
            self.stop_listening()
            if name == "previous":
                self.game.move_step(-1)
            elif name == "next":
                self.game.move_step(1)
            elif name == "prev_fragment":
                self.game.move_fragment(-1)
            elif name == "next_fragment":
                self.game.move_fragment(1)
            else:
                self.game.note_index = int(name.split(":")[1])
        elif name == "note":
            self.stop_playback()
            self.stop_listening()
            self.play_note(self.game.note_id)
        elif name in ("fragment", "song"):
            self.start_playback(name)
            return
        elif name == "check":
            self.check_current_note()
            return
        self.feedback = "Смотри на струну и лад. Сыграй ноту."
        self.feedback_color = GREEN

    def on_touch(self, position):
        for name, rect in reversed(self.buttons):
            if rect.collidepoint(position):
                self.activate(name)
                return
        if self.help_open:
            self.help_open = False
        elif self.chooser:
            self.chooser = False

    def touch_event(self, point):
        now = pygame.time.get_ticks()
        if self.last_touch:
            last_time, last_point = self.last_touch
            if now - last_time < 150 and abs(point[0] - last_point[0]) < 12 and abs(point[1] - last_point[1]) < 12:
                return
        self.last_touch = (now, point)
        self.on_touch(point)

    def run(self):
        running = True
        while running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif is_background_event(event.type):
                    self.stop_playback()
                    if self.recorder:
                        self.stop_listening()
                elif event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                    if self.help_open:
                        self.help_open = False
                    elif self.chooser:
                        self.chooser = False
                    else:
                        running = False
                elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                    self.touch_event(to_canvas_point(event.pos, self.display.get_size()))
                elif event.type == pygame.FINGERDOWN:
                    point = (int(event.x * WIDTH), int(event.y * HEIGHT))
                    self.touch_event(point)
            self.update_playback()
            self.update_microphone()
            self.draw()
            self.clock.tick(30)
        self.stop_playback()
        self.stop_listening()
        pygame.quit()


if __name__ == "__main__":
    GuitarApp().run()
