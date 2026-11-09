"""Single-note pitch detection and Android microphone access."""

from array import array
import math
import os
import sys
import threading
import time


SAMPLE_RATE = 16000


def detect_pitch(samples, sample_rate=SAMPLE_RATE):
    """Return a stable guitar fundamental in Hz, or None for silence/noise."""
    window = 768
    if len(samples) < window + sample_rate // 120 + 1:
        return None
    signal = samples[-(window + sample_rate // 120 + 1):]
    scale = 32768.0 if max(abs(value) for value in signal) > 2 else 1.0
    energy = sum((value / scale) ** 2 for value in signal[:window]) / window
    if energy < 0.009 ** 2:
        return None

    min_tau = max(2, sample_rate // 500)
    max_tau = min(sample_rate // 120, len(signal) - window - 1)
    differences = [0.0] * (max_tau + 1)
    for tau in range(1, max_tau + 1):
        differences[tau] = sum(
            (signal[index] - signal[index + tau]) ** 2
            for index in range(0, window, 2)
        )

    cumulative = 0.0
    normalized = [1.0] * (max_tau + 1)
    for tau in range(1, max_tau + 1):
        cumulative += differences[tau]
        normalized[tau] = differences[tau] * tau / cumulative if cumulative else 1.0
    for tau in range(min_tau, max_tau):
        if normalized[tau] < 0.18 and normalized[tau] <= normalized[tau + 1]:
            return sample_rate / tau
    return None


def matches_note(frequency, expected, tolerance_cents=45):
    return frequency is not None and abs(1200 * math.log2(frequency / expected)) <= tolerance_cents


def request_microphone(result_queue):
    if sys.platform != "android" and "ANDROID_ARGUMENT" not in os.environ:
        result_queue.put(("error", "Проверка звука доступна в Android-приложении."))
        return
    try:
        from android.permissions import Permission, check_permission, request_permissions

        if check_permission(Permission.RECORD_AUDIO):
            result_queue.put(("permission", True))
        else:
            def permission_result(permissions, grants):
                result_queue.put(("permission", bool(grants) and all(grants)))

            request_permissions([Permission.RECORD_AUDIO], permission_result)
    except Exception as error:
        result_queue.put(("error", f"Микрофон недоступен: {error}"))


class AndroidRecorder:
    def __init__(self, expected, result_queue):
        self.expected = expected
        self.result_queue = result_queue
        self.stop_event = threading.Event()
        self.thread = threading.Thread(target=self._record, daemon=True)

    def start(self):
        self.thread.start()

    def stop(self):
        self.stop_event.set()

    def _record(self):
        recorder = None
        try:
            from jnius import autoclass

            AudioRecord = autoclass("android.media.AudioRecord")
            AudioFormat = autoclass("android.media.AudioFormat")
            AudioSource = autoclass("android.media.MediaRecorder$AudioSource")
            minimum = AudioRecord.getMinBufferSize(
                SAMPLE_RATE, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT
            )
            if minimum <= 0:
                raise RuntimeError("Устройство не поддерживает запись звука")
            recorder = AudioRecord(
                AudioSource.MIC, SAMPLE_RATE, AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT, max(minimum, 4096)
            )
            if recorder.getState() != AudioRecord.STATE_INITIALIZED:
                raise RuntimeError("Не удалось открыть микрофон")
            recorder.startRecording()
            buffer = bytearray(4096)
            deadline = time.monotonic() + 8
            matches = 0
            heard = False
            while not self.stop_event.is_set() and time.monotonic() < deadline:
                size = recorder.read(buffer, 0, len(buffer))
                if size <= 0:
                    raise RuntimeError("Не удалось прочитать звук микрофона")
                pcm = array("h")
                pcm.frombytes(buffer[:size - size % 2])
                if sys.byteorder != "little":
                    pcm.byteswap()
                frequency = detect_pitch(pcm)
                if frequency is None:
                    continue
                heard = True
                if matches_note(frequency, self.expected):
                    matches += 1
                    if matches >= 2:
                        self.result_queue.put(("success", frequency))
                        return
                else:
                    matches = 0
            if not self.stop_event.is_set():
                self.result_queue.put(("retry", heard))
        except Exception as error:
            if not self.stop_event.is_set():
                self.result_queue.put(("error", f"Микрофон недоступен: {error}"))
        finally:
            if recorder is not None:
                try:
                    recorder.stop()
                except Exception:
                    pass
                recorder.release()
