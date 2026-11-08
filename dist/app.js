const POSITIONS = {
  D3: { label: 'РЕ', string: 4, fret: 0, finger: 0, frequency: 146.83 },
  E3: { label: 'МИ', string: 4, fret: 2, finger: 2, frequency: 164.81 },
  F3: { label: 'ФА', string: 4, fret: 3, finger: 3, frequency: 174.61 },
  G3: { label: 'СОЛЬ', string: 3, fret: 0, finger: 0, frequency: 196.0 },
  A3: { label: 'ЛЯ', string: 3, fret: 2, finger: 2, frequency: 220.0 },
};

const SONGS = [
  {
    id: 'birch', title: 'Во поле берёза стояла', subtitle: 'Русская народная мелодия · учебная версия', icon: '♬',
    fragments: [
      { title: 'Первый мотив', notes: ['A3', 'A3', 'A3', 'A3', 'G3'] },
      { title: 'Продолжение мотива', notes: ['G3', 'F3', 'F3', 'E3', 'D3'] },
    ],
  },
  {
    id: 'kalinka', title: 'Калинка', subtitle: 'Иван Ларионов · учебная версия мотива', icon: '♪',
    fragments: [
      { title: 'Начало мотива', notes: ['A3', 'G3', 'E3', 'F3', 'G3', 'E3'] },
      { title: 'Продолжение мотива', notes: ['F3', 'G3', 'F3', 'E3', 'D3'] },
    ],
  },
];

const $ = id => document.getElementById(id);
const state = { songIndex: 0, fragmentIndex: 0, noteIndex: 0, completed: loadProgress(), audioContext: null, stream: null, analyser: null, listenTimer: null, frame: null, playing: false, playbackToken: 0, activeSources: [], lastDetected: null };

function loadProgress() {
  try { return JSON.parse(localStorage.getItem('guitarcraft-progress-v1')) || {}; }
  catch { return {}; }
}
function saveProgress() { localStorage.setItem('guitarcraft-progress-v1', JSON.stringify(state.completed)); }
function song() { return SONGS[state.songIndex]; }
function fragment() { return song().fragments[state.fragmentIndex]; }
function noteKey(fragmentIndex = state.fragmentIndex, noteIndex = state.noteIndex) { return `${song().id}:${fragmentIndex}:${noteIndex}`; }
function currentNote() { return POSITIONS[fragment().notes[state.noteIndex]]; }

function renderSongs() {
  $('song-list').innerHTML = SONGS.map((item, i) => `<button class="song-option ${i === state.songIndex ? 'active' : ''}" data-song="${i}" type="button" aria-pressed="${i === state.songIndex}"><span class="song-icon">${item.icon}</span><span><span class="song-name">${item.title}</span><span class="song-meta">${item.fragments.reduce((n, f) => n + f.notes.length, 0)} нот · ${item.fragments.length} фрагмента</span></span><span class="song-arrow">→</span></button>`).join('');
  document.querySelectorAll('[data-song]').forEach(button => button.addEventListener('click', () => {
    const next = Number(button.dataset.song);
    if (next === state.songIndex) return;
    stopListening(); stopPlayback(); state.songIndex = next; state.fragmentIndex = 0; state.noteIndex = 0; setFeedback('ready'); render();
  }));
}

function renderNotes() {
  $('note-list').innerHTML = fragment().notes.map((key, i) => {
    const done = Boolean(state.completed[noteKey(state.fragmentIndex, i)]);
    return `<button class="note-button ${i === state.noteIndex ? 'active' : ''} ${done ? 'complete' : ''}" data-note="${i}" type="button" aria-label="Нота ${i + 1}: ${POSITIONS[key].label}${done ? ', освоена' : ''}" aria-pressed="${i === state.noteIndex}"><span class="note-number">${String(i + 1).padStart(2, '0')}</span><span class="note-symbol">${POSITIONS[key].label}</span>${done ? '<span class="note-check">✓</span>' : ''}</button>`;
  }).join('');
  document.querySelectorAll('[data-note]').forEach(button => button.addEventListener('click', () => {
    stopListening(); stopPlayback(); state.noteIndex = Number(button.dataset.note); setFeedback('ready'); render();
  }));
}

function renderFretboard() {
  const target = currentNote();
  const labels = ['1 · ми', '2 · си', '3 · соль', '4 · ре', '5 · ля', '6 · ми'];
  $('fretboard').innerHTML = labels.map((label, i) => {
    const string = i + 1;
    const cells = Array.from({ length: 6 }, (_, fret) => {
      const active = target.string === string && target.fret === fret;
      const marker = active ? (fret === 0 ? '<span class="open-marker">○</span>' : `<span class="finger-marker">${target.finger}</span>`) : '';
      return `<span class="fret-cell ${fret === 0 ? 'open-cell' : ''}">${marker}</span>`;
    }).join('');
    return `<div class="fret-row" style="--string-thickness:${Math.max(1, i * .42 + 1)}px"><span class="string-label">${label}</span>${cells}</div>`;
  }).join('');
  $('fretboard').setAttribute('aria-label', `${target.string}-я струна, ${target.fret === 0 ? 'открытая' : `${target.fret}-й лад, ${target.finger}-й палец`}`);
  const scroll = document.querySelector('.fret-scroll');
  const cell = $('fretboard').children[target.string - 1]?.children[target.fret + 1];
  if (cell) scroll.scrollLeft = Math.max(0, cell.offsetLeft - scroll.clientWidth / 2 + cell.clientWidth / 2);
}

function render() {
  renderSongs();
  $('song-title').textContent = song().title;
  $('song-subtitle').textContent = song().subtitle;
  $('fragment-number').textContent = state.fragmentIndex + 1;
  $('fragment-total').textContent = song().fragments.length;
  $('fragment-caption').textContent = fragment().title;
  $('prev-fragment').disabled = state.fragmentIndex === 0;
  $('next-fragment').disabled = state.fragmentIndex === song().fragments.length - 1;
  $('note-counter').textContent = `${state.noteIndex + 1} / ${fragment().notes.length}`;
  renderNotes();
  const target = currentNote();
  $('position-title').textContent = `${target.string}-я струна · ${target.fret === 0 ? 'открытая' : `${target.fret}-й лад`}`;
  $('position-hint').textContent = target.fret === 0 ? 'Сыграй струну, не зажимая лад' : `Зажми ${['', 'первым', 'вторым', 'третьим', 'четвёртым'][target.finger]} пальцем`;
  $('pitch-badge').textContent = target.label;
  renderFretboard();
  const total = song().fragments.reduce((n, f) => n + f.notes.length, 0);
  const count = song().fragments.reduce((n, f, fi) => n + f.notes.filter((_, ni) => state.completed[noteKey(fi, ni)]).length, 0);
  $('progress-text').textContent = `Освоено нот: ${count} из ${total}`;
  $('next-note').textContent = state.noteIndex === fragment().notes.length - 1 && state.fragmentIndex === song().fragments.length - 1 ? 'К первой ноте ↺' : 'Следующая нота →';
}

function setFeedback(type, detail = '') {
  const messages = {
    ready: ['✦', 'Готово к игре', 'Послушай ноту, затем сыграй её на гитаре и нажми «Проверить».'],
    listening: ['◉', 'Слушаю гитару…', detail || 'Сыграй текущую ноту один раз. У тебя есть несколько секунд.'],
    success: ['✓', 'Верно! Нота совпала', 'Можно перейти к следующей ноте или повторить эту.'],
    retry: ['↻', 'Пока не совпало', detail || 'Попробуй ещё раз: сыграй одну струну без лишнего шума.'],
    error: ['!', 'Не получилось включить микрофон', detail || 'Проверь разрешение на доступ к микрофону в браузере.'],
  };
  const [icon, title, text] = messages[type];
  $('feedback').className = `feedback ${type === 'retry' ? 'error' : type}`;
  $('feedback-icon').textContent = icon;
  $('feedback-title').textContent = title;
  $('feedback-detail').textContent = text;
}

async function ensureAudioContext() {
  state.audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  if (state.audioContext.state === 'suspended') await state.audioContext.resume();
  return state.audioContext;
}

function pluck(frequency, duration = .55) {
  const ctx = state.audioContext;
  const now = ctx.currentTime;
  const length = Math.floor(ctx.sampleRate * Math.min(duration + .35, 1.2));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const period = Math.max(2, Math.round(ctx.sampleRate / frequency));
  const ring = Float32Array.from({ length: period }, () => Math.random() * 2 - 1);
  for (let i = 0; i < length; i++) {
    const index = i % period;
    const next = (index + 1) % period;
    data[i] = ring[index] * Math.exp(-2.5 * i / length);
    ring[index] = .996 * .5 * (ring[index] + ring[next]);
  }
  const source = ctx.createBufferSource(); source.buffer = buffer;
  const gain = ctx.createGain(); gain.gain.setValueAtTime(.31, now); gain.gain.exponentialRampToValueAtTime(.001, now + length / ctx.sampleRate);
  source.connect(gain); gain.connect(ctx.destination); source.start();
  state.activeSources.push(source);
  source.onended = () => { state.activeSources = state.activeSources.filter(item => item !== source); };
}

function stopPlayback() {
  state.playbackToken++; state.playing = false;
  state.activeSources.forEach(source => { try { source.stop(); } catch {} });
  state.activeSources = [];
  $('play-note').disabled = false; $('play-fragment').disabled = false;
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function playCurrentNote() {
  stopListening(); stopPlayback();
  try { await ensureAudioContext(); pluck(currentNote().frequency, .8); }
  catch { setFeedback('error', 'Браузер не смог воспроизвести звук.'); }
}

async function playFragment() {
  stopListening(); stopPlayback();
  try { await ensureAudioContext(); } catch { setFeedback('error', 'Браузер не смог воспроизвести звук.'); return; }
  const token = state.playbackToken; state.playing = true; $('play-fragment').disabled = true; $('play-note').disabled = true;
  const notes = [...fragment().notes];
  for (let i = 0; i < notes.length; i++) {
    if (token !== state.playbackToken) break;
    state.noteIndex = i; render(); pluck(POSITIONS[notes[i]].frequency, .5);
    await pause(610);
  }
  if (token === state.playbackToken) { state.playing = false; $('play-fragment').disabled = false; $('play-note').disabled = false; }
}

function detectPitch(samples, sampleRate) {
  const windowSize = 1600;
  let energy = 0;
  for (let i = 0; i < windowSize; i++) energy += samples[i] * samples[i];
  if (Math.sqrt(energy / windowSize) < .009) return null;
  const minTau = Math.floor(sampleRate / 350);
  const maxTau = Math.min(Math.floor(sampleRate / 120), samples.length - windowSize - 1);
  const differences = new Float32Array(maxTau + 1);
  for (let tau = 1; tau <= maxTau; tau++) {
    let sum = 0;
    for (let i = 0; i < windowSize; i += 2) {
      const diff = samples[i] - samples[i + tau]; sum += diff * diff;
    }
    differences[tau] = sum;
  }
  let running = 0;
  const normalized = new Float32Array(maxTau + 1);
  for (let tau = 1; tau <= maxTau; tau++) {
    running += differences[tau];
    normalized[tau] = running > 0 ? differences[tau] * tau / running : 1;
  }
  for (let tau = minTau; tau < maxTau; tau++) {
    if (normalized[tau] < .18 && normalized[tau] <= normalized[tau + 1]) return sampleRate / tau;
  }
  return null;
}

function stopListening() {
  if (state.listenTimer) clearTimeout(state.listenTimer);
  if (state.frame) cancelAnimationFrame(state.frame);
  state.listenTimer = null; state.frame = null;
  if (state.stream) state.stream.getTracks().forEach(track => track.stop());
  state.stream = null; state.analyser = null; $('check-note').disabled = false;
}

async function checkNote() {
  stopPlayback(); stopListening();
  state.lastDetected = null;
  if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
    setFeedback('error', 'Для проверки нужен HTTPS и браузер с доступом к микрофону.'); return;
  }
  setFeedback('listening'); $('check-note').disabled = true;
  try {
    const ctx = await ensureAudioContext();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    state.stream = stream;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser(); analyser.fftSize = 4096; analyser.smoothingTimeConstant = 0;
    source.connect(analyser); state.analyser = analyser;
    const samples = new Float32Array(analyser.fftSize);
    let matches = 0; let lastFrame = 0;
    const expected = currentNote().frequency;
    function tick(time) {
      if (!state.stream) return;
      if (time - lastFrame >= 110) {
        lastFrame = time; analyser.getFloatTimeDomainData(samples);
        const frequency = detectPitch(samples, ctx.sampleRate);
        if (frequency) {
          const cents = 1200 * Math.log2(frequency / expected);
          state.lastDetected = frequency;
          if (Math.abs(cents) <= 45) matches++; else matches = 0;
          if (matches >= 2) {
            stopListening(); state.completed[noteKey()] = true; saveProgress(); setFeedback('success'); render(); return;
          }
          const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
          const names = ['ДО', 'ДО♯', 'РЕ', 'РЕ♯', 'МИ', 'ФА', 'ФА♯', 'СОЛЬ', 'СОЛЬ♯', 'ЛЯ', 'ЛЯ♯', 'СИ'];
          setFeedback('listening', `Слышу: ${names[(midi + 120) % 12]}. Нужна нота ${currentNote().label}.`);
        }
      }
      state.frame = requestAnimationFrame(tick);
    }
    state.frame = requestAnimationFrame(tick);
    state.listenTimer = setTimeout(() => { stopListening(); setFeedback('retry', state.lastDetected ? `Нужна нота ${currentNote().label}. Сыграй её ещё раз.` : 'Не услышал устойчивую ноту. Поднеси гитару ближе к микрофону.'); }, 8000);
  } catch (error) {
    stopListening();
    setFeedback('error', error?.name === 'NotAllowedError' ? 'Разреши доступ к микрофону для этого сайта и попробуй снова.' : 'Проверь, что микрофон подключён и доступен браузеру.');
  }
}

function moveFragment(delta) {
  const next = state.fragmentIndex + delta;
  if (next < 0 || next >= song().fragments.length) return;
  stopListening(); stopPlayback(); state.fragmentIndex = next; state.noteIndex = 0; setFeedback('ready'); render();
}

$('prev-fragment').addEventListener('click', () => moveFragment(-1));
$('next-fragment').addEventListener('click', () => moveFragment(1));
$('next-note').addEventListener('click', () => {
  stopListening(); stopPlayback();
  if (state.noteIndex < fragment().notes.length - 1) state.noteIndex++;
  else if (state.fragmentIndex < song().fragments.length - 1) { state.fragmentIndex++; state.noteIndex = 0; }
  else { state.fragmentIndex = 0; state.noteIndex = 0; }
  setFeedback('ready'); render();
});
$('play-note').addEventListener('click', playCurrentNote);
$('play-fragment').addEventListener('click', playFragment);
$('check-note').addEventListener('click', checkNote);
window.addEventListener('pagehide', stopListening);
render();
