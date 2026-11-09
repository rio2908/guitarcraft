"""Portrait Android guitar lesson, written in Python with pygame."""

import os
from pathlib import Path
from queue import Empty, Queue
import sys

os.environ.setdefault("PYGAME_HIDE_SUPPORT_PROMPT", "1")
import pygame

from game_logic import Game
from microphone import AndroidRecorder, request_microphone


ROOT = Path(__file__).resolve().parent
WIDTH, HEIGHT = 400, 860
BACKGROUND = (247, 246, 240)
PANEL = (252, 252, 249)
GREEN = (28, 80, 61)
GREEN_PALE = (227, 238, 225)
GREEN_LIGHT = (118, 158, 129)
TEXT = (29, 62, 49)
MUTED = (121, 145, 130)
LINE = (207, 218, 207)
ORANGE = (237, 121, 75)
WHITE = (255, 255, 255)


class GuitarApp:
    def __init__(self):
        pygame.mixer.pre_init(44100, -16, 2, 512)
        pygame.init()
        flags = pygame.FULLSCREEN | pygame.SCALED if sys.platform == "android" else 0
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT), flags)
        pygame.display.set_caption("ГитарКрафт")
        self.clock = pygame.time.Clock()
        self.fonts = {}
        self.game = Game()
        self.samples = {}
        self.channel = pygame.mixer.Channel(0) if pygame.mixer.get_init() else None
        self.buttons = []
        self.chooser = False
        self.feedback = "Посмотри на струну и лад, затем сыграй звук."
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

    def font(self, size, bold=False):
        key = (size, bold)
        if key not in self.fonts:
            result = pygame.font.Font(None, size)
            result.set_bold(bold)
            self.fonts[key] = result
        return self.fonts[key]

    def label(self, text, x, y, size=20, color=TEXT, bold=False, align="left", limit=None):
        text = str(text)
        font = self.font(size, bold)
        if limit:
            while font.size(text)[0] > limit and size > 13:
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
        if border:
            pygame.draw.rect(self.screen, border, rect, 1, border_radius=radius)

    def button(self, name, rect, title, fill=WHITE, color=GREEN, size=17, enabled=True):
        border = LINE if fill == WHITE else None
        self.rounded(rect, fill if enabled else (238, 240, 235), border, 12)
        self.label(title, rect.centerx, rect.centery, size,
                   color if enabled else MUTED, bold=True, align="center", limit=rect.width - 10)
        if enabled:
            self.buttons.append((name, rect))

    def draw(self):
        self.buttons = []
        self.screen.fill(BACKGROUND)
        self.label("ГитарКрафт", 17, 20, 29, GREEN, True)
        self.button("choose", pygame.Rect(247, 15, 137, 43), "Мелодии", GREEN_PALE)

        song = self.game.song
        part = self.game.fragment
        position = self.game.position
        self.label(song["title"], 18, 78, 25, TEXT, True, limit=365)
        self.label(part["lyricLine"] or part["title"], 18, 112, 18, MUTED, limit=365)
        self.label(f"Шаг {self.game.note_index + 1} из {len(part['notes'])}", 18, 139, 17, GREEN)
        self.draw_steps(part)
        self.draw_fretboard(position)

        self.button("previous", pygame.Rect(14, 552, 112, 54), "Назад")
        self.button("next", pygame.Rect(134, 552, 252, 54), "Следующий", GREEN_PALE, size=19)
        self.button("note", pygame.Rect(14, 617, 180, 54), "Звук", size=18)
        fragment_label = "Стоп" if self.play_kind == "fragment" else "Фрагмент"
        self.button("fragment", pygame.Rect(206, 617, 180, 54), fragment_label, size=18)
        song_label = "Стоп" if self.play_kind == "song" else "Вся песня"
        self.button("song", pygame.Rect(14, 681, 180, 54), song_label, GREEN_PALE, size=18)
        check_label = "Слушаю..." if self.listening else "Проверить"
        self.button("check", pygame.Rect(206, 681, 180, 54), check_label,
                    ORANGE, WHITE, size=18, enabled=not self.listening)

        self.rounded(pygame.Rect(14, 748, 372, 74), PANEL, LINE)
        self.label(self.feedback, 26, 763, 17, self.feedback_color, limit=344)
        done, total = self.game.progress()
        self.label(f"Пройдено: {done} из {total}", 18, 833, 15, MUTED)

        if self.chooser:
            self.draw_chooser()
        pygame.display.flip()

    def draw_steps(self, part):
        notes = part["notes"]
        count = len(notes)
        gap = 5
        width = (368 - gap * (count - 1)) / count
        for index in range(count):
            x = int(16 + index * (width + gap))
            right = int(16 + (index + 1) * width + index * gap)
            rect = pygame.Rect(x, 169, right - x, 36)
            active = index == self.game.note_index
            done = self.game.key(self.game.fragment_index, index) in self.game.completed
            fill = ORANGE if active else GREEN_PALE if done else WHITE
            self.rounded(rect, fill, LINE if not active else None, 10)
            self.label(str(index + 1), rect.centerx,
                       rect.centery, 18, WHITE if active else GREEN, True, "center")
            self.buttons.append((f"step:{index}", rect))
            syllables = part["syllables"]
            if syllables:
                self.label(syllables[index], rect.centerx, 209, 14,
                           ORANGE if active else MUTED, align="center", limit=max(rect.width, 30))

    def draw_fretboard(self, position):
        panel = pygame.Rect(12, 227, 376, 314)
        self.rounded(panel, PANEL, LINE, 18)
        self.button("prev_fragment", pygame.Rect(24, 237, 50, 35), "‹", GREEN_PALE,
                    size=26, enabled=self.game.fragment_index > 0)
        self.label(f"Фрагмент {self.game.fragment_index + 1}/{len(self.game.song['fragments'])}",
                   200, 254, 18, GREEN, True, "center")
        self.button("next_fragment", pygame.Rect(326, 237, 50, 35), "›", GREEN_PALE,
                    size=26, enabled=self.game.fragment_index + 1 < len(self.game.song["fragments"]))

        fret_text = "Открытая" if position["fret"] == 0 else f"Лад {position['fret']}"
        self.label(f"Струна {position['string']}   {fret_text}", 200, 291,
                   25, GREEN, True, "center", limit=355)
        if self.game.syllable:
            self.label(self.game.syllable, 200, 321, 19, ORANGE, True, "center", limit=340)
        self.label("1 — тонкая     6 — толстая", 200, 344, 15, MUTED, align="center")

        x0 = 72
        cell_width = 59
        y0 = 386
        y_gap = 26
        for fret in range(1, 6):
            x = x0 + (fret - 0.5) * cell_width
            self.label(str(fret), int(x), 360, 15, MUTED, align="center")
        for boundary in range(6):
            x = x0 + boundary * cell_width
            pygame.draw.line(self.screen, MUTED if boundary == 0 else LINE,
                             (x, 377), (x, y0 + 5 * y_gap + 8), 4 if boundary == 0 else 2)
        for string in range(1, 7):
            y = y0 + (string - 1) * y_gap
            active = string == position["string"]
            pygame.draw.line(self.screen, GREEN_LIGHT if active else LINE,
                             (x0, y), (x0 + 5 * cell_width, y), 2 if active else max(1, string // 3))
            self.label(str(string), 38, y, 16, GREEN if active else MUTED,
                       active, "center")
        marker_x = int(x0 + (max(1, position["fret"]) - 0.5) * cell_width)
        marker_y = y0 + (position["string"] - 1) * y_gap
        if position["fret"] == 0:
            pygame.draw.circle(self.screen, ORANGE, (marker_x, marker_y), 13, 3)
        else:
            pygame.draw.circle(self.screen, ORANGE, (marker_x, marker_y), 16)
            self.label(str(position["fret"]), marker_x, marker_y, 18,
                       WHITE, True, "center")

    def draw_chooser(self):
        shade = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        shade.fill((13, 35, 27, 170))
        self.screen.blit(shade, (0, 0))
        self.buttons = []
        self.rounded(pygame.Rect(17, 200, 366, 450), BACKGROUND, radius=20)
        self.label("Выбери мелодию", 36, 223, 27, GREEN, True)
        self.button("close", pygame.Rect(324, 216, 42, 42), "X", GREEN_PALE, size=23)
        for index, song in enumerate(self.game.songs):
            rect = pygame.Rect(32, 281 + index * 84, 336, 70)
            self.rounded(rect, GREEN_PALE if index == self.game.song_index else WHITE, LINE)
            self.label(song["title"], rect.x + 14, rect.y + 13, 19,
                       GREEN, True, limit=rect.width - 27)
            self.label(f"{len(song['fragments'])} фрагментов", rect.x + 14,
                       rect.y + 41, 15, MUTED)
            self.buttons.append((f"song:{index}", rect))

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
        self.feedback = "Посмотри на струну и лад, затем сыграй звук."
        self.feedback_color = GREEN

    def on_touch(self, position):
        for name, rect in reversed(self.buttons):
            if rect.collidepoint(position):
                self.activate(name)
                return
        if self.chooser:
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
                elif event.type == pygame.APP_WILLENTERBACKGROUND:
                    self.stop_playback()
                    if self.recorder:
                        self.stop_listening()
                elif event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                    if self.chooser:
                        self.chooser = False
                    else:
                        running = False
                elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                    self.touch_event(event.pos)
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
