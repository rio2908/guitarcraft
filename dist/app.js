const POSITIONS = {
  C3: { label: 'ДО', string: 5, fret: 3, finger: 3, frequency: 130.81 },
  D3: { label: 'РЕ', string: 4, fret: 0, finger: 0, frequency: 146.83 },
  E3: { label: 'МИ', string: 4, fret: 2, finger: 2, frequency: 164.81 },
  F3: { label: 'ФА', string: 4, fret: 3, finger: 3, frequency: 174.61 },
  G3: { label: 'СОЛЬ', string: 3, fret: 0, finger: 0, frequency: 196.0 },
  A3: { label: 'ЛЯ', string: 3, fret: 2, finger: 2, frequency: 220.0 },
  'A#3': { label: 'СИ♭', string: 3, fret: 3, finger: 3, frequency: 233.08 },
  B3: { label: 'СИ', string: 3, fret: 4, finger: 4, frequency: 246.94 },
  C4: { label: 'ДО', string: 2, fret: 1, finger: 1, frequency: 261.63 },
  D4: { label: 'РЕ', string: 2, fret: 3, finger: 3, frequency: 293.66 },
  E4: { label: 'МИ', string: 1, fret: 0, finger: 0, frequency: 329.63 },
  F4: { label: 'ФА', string: 1, fret: 1, finger: 1, frequency: 349.23 },
};

function makeFragments(title, score, size = 7) {
  const events = score.trim().split(/\s+/).map(token => {
    const [note, beatText] = token.split(':');
    if (!POSITIONS[note]) throw new Error(`Unknown pitch ${note}`);
    return { note, beats: Number(beatText || 1) };
  });
  const result = [];
  for (let i = 0; i < events.length; i += size) {
    const part = events.slice(i, i + size);
    result.push({ title: `${title} · часть ${result.length + 1}`, notes: part.map(event => event.note), beats: part.map(event => event.beats), pauseAfter: i + size >= events.length });
  }
  return result;
}

// One complete stanza melody, transposed down an octave for beginner guitar positions.
const BIRCH_FRAGMENTS = [
  ...makeFragments('Во поле берёза', 'A3 A3 A3 A3 G3 F3 F3 E3 D3:2', 5),
  ...makeFragments('Во поле кудрявая', 'A3 A3 C4 A3 G3 G3 F3 F3 E3 D3:2', 5),
  ...makeFragments('Люли, люли', 'E3 F3 G3 F3 F3 E3 D3:2'),
  ...makeFragments('Повтор напева', 'E3 F3 G3 F3 F3 E3 D3:2'),
];

// Melody follows a public-domain ABC transcription; accompaniment is original synthesis.
// https://abcnotation.com/tunePage?a=trillian.mit.edu%2F~jc%2Fmusic%2Fabc%2Fsong%2FKalinka_Dm%2F0000
const KALINKA_CHORUS = 'A3:2 G3:2 E3 F3 G3:2 E3 F3 G3:2 F3 E3 D3:2 A3 A3 G3:1.5 F3:0.5 E3 F3 G3:2 E3 F3 G3:2 F3 E3 D3:2';
const KALINKA_VERSE = 'A3 C4 B3 A3:0.5 G3:0.5 F3:2 C3:2 A3 C4 B3 A3:0.5 G3:0.5 F3:2 C3:2 D3:2 D3 E3 G3 F3 E3 D3 C3:2 C3:2 C3:2 C4:2 A3 C4 G3 A3 F3:2 C3:2 A3 C4 G3 A3 F3:2 C3:2 D3:2 D3 E3 G3 F3 E3 D3 C4:2 B3:2 A3:4';

// Ukrainian folk melody, transposed from G major to C major for beginner guitar.
// Source: https://notarhiv.ru/detskie/1/1%20%28129%29.pdf
const GEESE_OPENING = 'B3 A3 G3 F3 C4:2 C4:2 B3 A3 G3 F3 C4:2 C4:2';
const GEESE_REFRAIN = 'B3 D4:2 D4:2 B3 A3 C4:2 C4:2 A3 F3 A3 B3 F3 G3:2 G3:2';

// Traditional Russian song, simplified to its single-note melody.
// Source: https://kalimbaplay.ru/tabulaturi/vo-sadu-li
const GARDEN_MELODY = 'F4 F4 E4 E4 D4 D4 D4 E4 F4 F4 E4 E4 D4:2 D4:2 C4 C4 B3 B3 A3 A3 A3 B3 C4 C4 B3 B3 A3:2 A3:2';

// Traditional melody as transcribed by Jack Campin, in D minor.
// Source: https://abcnotation.com/tunePage?a=trillian.mit.edu%2F~jc%2Fmusic%2Fabc%2Fmirror%2Fcampin.me.uk%2FChalumeau_55%2F0417
const KOROBEINIKI_MELODY = 'A3:2 E3 F3 G3:2 F3 E3 D3:2 D3 F3 A3:2 G3 F3 E3:3 F3 G3:2 A3:2 F3:2 D3:2 D3:2 G3:3 A#3 D4:2 C4 A#3 A3:3 F3 A3:2 G3 F3 E3:2 E3 F3 G3:2 A3:2 F3:2 D3:2 D3:2';

const SONGS = [
  {
    id: 'birch', title: 'Во поле берёза стояла', subtitle: 'Русская народная мелодия · учебная версия', icon: '♬',
    beatMs: 360, fragments: BIRCH_FRAGMENTS,
  },
  {
    id: 'kalinka', title: 'Калинка', subtitle: 'Иван Ларионов · учебная версия мелодии', icon: '♪',
    beatMs: 270,
    fragments: [
      ...makeFragments('Припев', KALINKA_CHORUS),
      ...makeFragments('Куплет', KALINKA_VERSE),
      ...makeFragments('Припев снова', KALINKA_CHORUS),
    ],
  },
  {
    id: 'geese', title: 'Два весёлых гуся', subtitle: 'Украинская народная мелодия · учебная версия', icon: '♩',
    beatMs: 320,
    fragments: [
      ...makeFragments('Жили у бабуси', GEESE_OPENING, 6),
      ...makeFragments('Один серый, другой белый', GEESE_REFRAIN, 7),
      ...makeFragments('Повтор', GEESE_REFRAIN, 7),
    ],
  },
  {
    id: 'garden', title: 'Во саду ли, в огороде', subtitle: 'Русская народная мелодия · учебная версия', icon: '♫',
    beatMs: 285, fragments: makeFragments('Напев', GARDEN_MELODY),
  },
  {
    id: 'korobeiniki', title: 'Коробейники', subtitle: 'Русская народная мелодия · учебная версия', icon: '♬',
    beatMs: 235, fragments: makeFragments('Основной напев', KOROBEINIKI_MELODY),
  },
];

const $ = id => document.getElementById(id);
const state = { songIndex: 0, fragmentIndex: 0, noteIndex: 0, completed: loadProgress(), audioContext: null, sampleBuffers: {}, samplePromise: null, stream: null, analyser: null, listenTimer: null, frame: null, playing: false, playbackKind: null, playbackToken: 0, activeSources: [], lastDetected: null };

function loadProgress() {
  try { return JSON.parse(localStorage.getItem('guitarcraft-progress-v1')) || {}; }
  catch { return {}; }
}
function saveProgress() { localStorage.setItem('guitarcraft-progress-v1', JSON.stringify(state.completed)); }
function song() { return SONGS[state.songIndex]; }
function fragment() { return song().fragments[state.fragmentIndex]; }
function noteKey(fragmentIndex = state.fragmentIndex, noteIndex = state.noteIndex) { return `${song().id}:${fragmentIndex}:${noteIndex}`; }
function currentNote() { return POSITIONS[fragment().notes[state.noteIndex]]; }
function stepNoun(count) {
  const lastTwo = count % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return 'шагов';
  if (count % 10 === 1) return 'шаг';
  if (count % 10 >= 2 && count % 10 <= 4) return 'шага';
  return 'шагов';
}
function positionText(target) { return `струна ${target.string}, ${target.fret === 0 ? 'открытая' : `лад ${target.fret}`}`; }

function selectSong(next) {
  if (next === state.songIndex) return;
  stopListening(); stopPlayback(); state.songIndex = next; state.fragmentIndex = 0; state.noteIndex = 0; setFeedback('ready'); render();
}

function renderSongs() {
  document.querySelector('.catalog-count').textContent = String(SONGS.length).padStart(2, '0');
  $('song-list').innerHTML = SONGS.map((item, i) => { const count = item.fragments.reduce((n, f) => n + f.notes.length, 0); return `<button class="song-option ${i === state.songIndex ? 'active' : ''}" data-song="${i}" type="button" aria-pressed="${i === state.songIndex}"><span class="song-icon">${item.icon}</span><span><span class="song-name">${item.title}</span><span class="song-meta">${count} ${stepNoun(count)} · ${item.fragments.length} фрагм.</span></span><span class="song-arrow">→</span></button>`; }).join('');
  document.querySelectorAll('[data-song]').forEach(button => button.addEventListener('click', () => {
    selectSong(Number(button.dataset.song));
  }));
}

function renderNotes() {
  $('note-list').innerHTML = fragment().notes.map((key, i) => {
    const done = Boolean(state.completed[noteKey(state.fragmentIndex, i)]);
    const target = POSITIONS[key];
    return `<button class="note-button ${i === state.noteIndex ? 'active' : ''} ${done ? 'complete' : ''}" data-note="${i}" type="button" aria-label="Шаг ${i + 1}: ${positionText(target)}${done ? ', пройден' : ''}" aria-pressed="${i === state.noteIndex}"><span class="note-number">ШАГ ${i + 1}</span><span class="step-string">Струна <strong>${target.string}</strong></span><span class="step-fret">${target.fret === 0 ? 'Открытая' : `Лад <strong>${target.fret}</strong>`}</span>${done ? '<span class="note-check">✓</span>' : ''}</button>`;
  }).join('');
  document.querySelectorAll('[data-note]').forEach(button => button.addEventListener('click', () => {
    stopListening(); stopPlayback(); state.noteIndex = Number(button.dataset.note); setFeedback('ready'); render();
  }));
}

function renderFretboard() {
  const target = currentNote();
  const labels = ['1-я', '2-я', '3-я', '4-я', '5-я', '6-я'];
  $('fretboard').innerHTML = labels.map((label, i) => {
    const string = i + 1;
    const cells = Array.from({ length: 6 }, (_, fret) => {
      const active = target.string === string && target.fret === fret;
      const marker = active ? (fret === 0 ? '<span class="open-marker">○</span>' : `<span class="finger-marker">${target.fret}</span>`) : '';
      return `<span class="fret-cell ${fret === 0 ? 'open-cell' : ''} ${active ? 'active-fret' : ''}">${marker}</span>`;
    }).join('');
    return `<div class="fret-row ${string === target.string ? 'active-string' : ''}" style="--string-thickness:${Math.max(1, i * .42 + 1)}px"><span class="string-label">${label}</span>${cells}</div>`;
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
  $('mobile-song-select').value = String(state.songIndex);
  $('mobile-step-counter').textContent = `Шаг ${state.noteIndex + 1} из ${fragment().notes.length}`;
  $('mobile-prev-fragment').disabled = state.fragmentIndex === 0;
  $('mobile-next-fragment').disabled = state.fragmentIndex === song().fragments.length - 1;
  $('mobile-prev-step').disabled = state.fragmentIndex === 0 && state.noteIndex === 0;
  $('mobile-next-step').textContent = state.fragmentIndex === song().fragments.length - 1 && state.noteIndex === fragment().notes.length - 1 ? 'Сначала ↺' : 'Шаг →';
  renderNotes();
  const target = currentNote();
  $('position-title').innerHTML = `<span class="position-pill">Струна <strong>${target.string}</strong></span><span class="position-join">→</span><span class="position-pill">${target.fret === 0 ? 'Открытая' : `Лад <strong>${target.fret}</strong>`}</span>`;
  $('position-hint').textContent = target.fret === 0 ? 'Сыграй струну, ничего не зажимая' : `Зажми ${target.fret}-й лад ${['', 'первым', 'вторым', 'третьим', 'четвёртым'][target.finger]} пальцем`;
  renderFretboard();
  const total = song().fragments.reduce((n, f) => n + f.notes.length, 0);
  const count = song().fragments.reduce((n, f, fi) => n + f.notes.filter((_, ni) => state.completed[noteKey(fi, ni)]).length, 0);
  $('progress-text').textContent = `Пройдено шагов: ${count} из ${total}`;
  $('next-note').textContent = state.noteIndex === fragment().notes.length - 1 && state.fragmentIndex === song().fragments.length - 1 ? 'К первому шагу ↺' : 'Следующий шаг →';
}

function setFeedback(type, detail = '') {
  const messages = {
    ready: ['✦', 'Готово к игре', 'Посмотри на струну и лад, послушай звук и повтори его на гитаре.'],
    loading: ['♫', 'Загружаю звук гитары…', 'Это записи настоящих струн. Обычно загрузка нужна только один раз.'],
    playingSong: ['♫', 'Играет вся песня', detail || 'Шаги и фрагменты подсвечиваются по ходу мелодии.'],
    playingFragment: ['♫', 'Играет фрагмент', detail || 'Шаги подсвечиваются по ходу мелодии.'],
    listening: ['◉', 'Слушаю гитару…', detail || `Сыграй сейчас: ${positionText(currentNote())}.`],
    success: ['✓', 'Отлично, звук совпал!', 'Можно перейти к следующему шагу или повторить этот.'],
    retry: ['↻', 'Пока не совпало', detail || 'Попробуй ещё раз: сыграй одну струну без лишнего шума.'],
    error: ['!', 'Не получилось включить микрофон', detail || 'Проверь разрешение на доступ к микрофону в браузере.'],
    audioError: ['!', 'Не удалось воспроизвести звук', detail || 'Проверь подключение и попробуй снова.'],
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

async function loadSamples() {
  if (!state.samplePromise) {
    state.samplePromise = Promise.all(Object.keys(POSITIONS).map(async key => {
      const response = await fetch(`./samples/${encodeURIComponent(key)}.wav`);
      if (!response.ok) throw new Error(`Sample ${key} could not be loaded`);
      state.sampleBuffers[key] = await state.audioContext.decodeAudioData(await response.arrayBuffer());
    })).catch(error => { state.samplePromise = null; throw error; });
  }
  await state.samplePromise;
}

function pluck(noteId, duration = .55) {
  const ctx = state.audioContext;
  const now = ctx.currentTime;
  const sample = state.sampleBuffers[noteId];
  if (!sample) throw new Error(`Missing guitar sample for ${noteId}`);
  const source = ctx.createBufferSource(); source.buffer = sample;
  const gain = ctx.createGain();
  const releaseAt = now + Math.min(Math.max(duration, .28), sample.duration - .5);
  const endAt = Math.min(releaseAt + .45, now + sample.duration);
  gain.gain.setValueAtTime(.0001, now);
  gain.gain.linearRampToValueAtTime(.42, now + .012);
  gain.gain.setValueAtTime(.42, releaseAt);
  gain.gain.exponentialRampToValueAtTime(.0001, endAt);
  source.connect(gain); gain.connect(ctx.destination); source.start();
  source.stop(endAt + .01);
  state.activeSources.push(source);
  source.onended = () => { state.activeSources = state.activeSources.filter(item => item !== source); };
}

function stopPlayback() {
  state.playbackToken++; state.playing = false; state.playbackKind = null;
  state.activeSources.forEach(source => { try { source.stop(); } catch {} });
  state.activeSources = [];
  $('play-note').disabled = false; $('play-fragment').disabled = false; $('play-song').disabled = false;
  $('play-fragment').innerHTML = '<span class="button-icon">♫</span> Весь фрагмент';
  $('play-song').innerHTML = '<span class="button-icon">♫</span> Послушать всю песню';
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function playCurrentNote() {
  stopListening(); stopPlayback();
  const token = state.playbackToken;
  const noteId = fragment().notes[state.noteIndex];
  try {
    setFeedback('loading');
    await ensureAudioContext(); await loadSamples();
    if (token !== state.playbackToken) return;
    pluck(noteId, .8); setFeedback('ready');
  } catch { setFeedback('audioError', 'Не удалось загрузить записи гитары. Проверь подключение и попробуй снова.'); }
}

async function playSequence(kind) {
  if (state.playing && state.playbackKind === kind) { stopPlayback(); setFeedback('ready'); return; }
  stopListening(); stopPlayback();
  const token = state.playbackToken;
  try { setFeedback('loading'); await ensureAudioContext(); await loadSamples(); }
  catch { setFeedback('audioError', 'Не удалось загрузить записи гитары. Проверь подключение и попробуй снова.'); return; }
  if (token !== state.playbackToken) return;
  const initial = { fragmentIndex: state.fragmentIndex, noteIndex: state.noteIndex };
  const selectedSong = song();
  const indices = kind === 'song' ? selectedSong.fragments.map((_, index) => index) : [state.fragmentIndex];
  state.playing = true; state.playbackKind = kind;
  $('play-note').disabled = true;
  $('play-fragment').disabled = kind === 'song';
  $('play-song').disabled = kind === 'fragment';
  $(kind === 'song' ? 'play-song' : 'play-fragment').innerHTML = '<span class="button-icon">■</span> Остановить';
  for (const fragmentIndex of indices) {
    const part = selectedSong.fragments[fragmentIndex];
    for (let noteIndex = 0; noteIndex < part.notes.length; noteIndex++) {
      if (token !== state.playbackToken) return;
      state.fragmentIndex = fragmentIndex; state.noteIndex = noteIndex; render();
      const durationMs = selectedSong.beatMs * part.beats[noteIndex];
      pluck(part.notes[noteIndex], Math.min(1.1, durationMs / 1000 * .9));
      setFeedback(kind === 'song' ? 'playingSong' : 'playingFragment', `Фрагмент ${fragmentIndex + 1} из ${selectedSong.fragments.length} · шаг ${noteIndex + 1} из ${part.notes.length}`);
      await pause(durationMs);
    }
    if (part.pauseAfter) await pause(240);
  }
  if (token === state.playbackToken) {
    stopPlayback(); state.fragmentIndex = initial.fragmentIndex; state.noteIndex = initial.noteIndex;
    render(); setFeedback('ready');
  }
}

function detectPitch(samples, sampleRate) {
  const windowSize = 1600;
  let energy = 0;
  for (let i = 0; i < windowSize; i++) energy += samples[i] * samples[i];
  if (Math.sqrt(energy / windowSize) < .009) return null;
  const minTau = Math.floor(sampleRate / 400);
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
          setFeedback('listening', `Пока звук не совпал. Сыграй: ${positionText(currentNote())}.`);
        }
      }
      state.frame = requestAnimationFrame(tick);
    }
    state.frame = requestAnimationFrame(tick);
    state.listenTimer = setTimeout(() => { stopListening(); setFeedback('retry', state.lastDetected ? `Сыграй ещё раз: ${positionText(currentNote())}.` : 'Не услышал устойчивый звук. Поднеси гитару ближе к микрофону.'); }, 8000);
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

function moveStep(delta) {
  stopListening(); stopPlayback();
  if (delta < 0) {
    if (state.noteIndex > 0) state.noteIndex--;
    else if (state.fragmentIndex > 0) { state.fragmentIndex--; state.noteIndex = fragment().notes.length - 1; }
  } else if (state.noteIndex < fragment().notes.length - 1) state.noteIndex++;
  else if (state.fragmentIndex < song().fragments.length - 1) { state.fragmentIndex++; state.noteIndex = 0; }
  else { state.fragmentIndex = 0; state.noteIndex = 0; }
  setFeedback('ready'); render();
}

$('prev-fragment').addEventListener('click', () => moveFragment(-1));
$('next-fragment').addEventListener('click', () => moveFragment(1));
$('mobile-song-select').innerHTML = SONGS.map((item, i) => `<option value="${i}">${item.title}</option>`).join('');
$('mobile-song-select').addEventListener('change', event => selectSong(Number(event.target.value)));
$('mobile-prev-fragment').addEventListener('click', () => moveFragment(-1));
$('mobile-next-fragment').addEventListener('click', () => moveFragment(1));
$('mobile-prev-step').addEventListener('click', () => moveStep(-1));
$('mobile-next-step').addEventListener('click', () => moveStep(1));
$('next-note').addEventListener('click', () => moveStep(1));
$('play-note').addEventListener('click', playCurrentNote);
$('play-fragment').addEventListener('click', () => playSequence('fragment'));
$('play-song').addEventListener('click', () => playSequence('song'));
$('check-note').addEventListener('click', checkNote);
window.addEventListener('pagehide', stopListening);
render();
