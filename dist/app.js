const POSITIONS = {
  C3: { label: 'ДО', string: 5, fret: 3, finger: 3, frequency: 130.81 },
  D3: { label: 'РЕ', string: 4, fret: 0, finger: 0, frequency: 146.83 },
  E3: { label: 'МИ', string: 4, fret: 2, finger: 2, frequency: 164.81 },
  F3: { label: 'ФА', string: 4, fret: 3, finger: 3, frequency: 174.61 },
  'F#3': { label: 'ФА♯', string: 4, fret: 4, finger: 4, frequency: 185.0 },
  G3: { label: 'СОЛЬ', string: 3, fret: 0, finger: 0, frequency: 196.0 },
  'G#3': { label: 'СОЛЬ♯', string: 3, fret: 1, finger: 1, frequency: 207.65 },
  A3: { label: 'ЛЯ', string: 3, fret: 2, finger: 2, frequency: 220.0 },
  'A#3': { label: 'СИ♭', string: 3, fret: 3, finger: 3, frequency: 233.08 },
  B3: { label: 'СИ', string: 3, fret: 4, finger: 4, frequency: 246.94 },
  C4: { label: 'ДО', string: 2, fret: 1, finger: 1, frequency: 261.63 },
  'C#4': { label: 'ДО♯', string: 2, fret: 2, finger: 2, frequency: 277.18 },
  D4: { label: 'РЕ', string: 2, fret: 3, finger: 3, frequency: 293.66 },
  'D#4': { label: 'РЕ♯', string: 2, fret: 4, finger: 4, frequency: 311.13 },
  E4: { label: 'МИ', string: 1, fret: 0, finger: 0, frequency: 329.63 },
  F4: { label: 'ФА', string: 1, fret: 1, finger: 1, frequency: 349.23 },
  'F#4': { label: 'ФА♯', string: 1, fret: 2, finger: 2, frequency: 369.99 },
  G4: { label: 'СОЛЬ', string: 1, fret: 3, finger: 3, frequency: 392.0 },
  A4: { label: 'ЛЯ', string: 1, fret: 5, finger: 4, frequency: 440.0 },
};

function makeFragments(title, score, size = 7) {
  const events = score.trim().split(/\s+/).map(token => {
    const [note, beatText, soundText] = token.split(':');
    if (!POSITIONS[note]) throw new Error(`Unknown pitch ${note}`);
    const beats = Number(beatText || 1);
    const soundBeats = Number(soundText || beats);
    if (!(beats > 0 && soundBeats > 0 && soundBeats <= beats)) throw new Error(`Invalid timing ${token}`);
    return { note, beats, soundBeats };
  });
  const result = [];
  for (let i = 0; i < events.length; i += size) {
    const part = events.slice(i, i + size);
    result.push({ title: `${title} · часть ${result.length + 1}`, notes: part.map(event => event.note), beats: part.map(event => event.beats), soundBeats: part.map(event => event.soundBeats), pauseAfter: i + size >= events.length });
  }
  return result;
}

// Familiar F-major register of the folk melody, played within the first five frets.
// Source: https://urokcifri.ru/uroki-po-pianino-po-ciframi/
const GEESE_OPENING = 'F4 E4 D4 C4 G4:2 G4:2 F4 E4 D4 C4 G4:2 G4:2';
const GEESE_REFRAIN = 'F4 A4 A4 F4 E4 G4 G4 E4 D4 E4 F4 D4 C4:2 C4:2';

// John Williams, first two phrases of Hedwig's Theme, transposed from E minor to A minor.
// The eighth-note durations follow the 3/4 phrasing in this beginner transcription:
// https://easybreezypianotutorials.com/2023/07/03/harry-potter-hedwigs-theme/
// This single-note educational arrangement stays within the first five guitar frets.
const HEDWIG_PHRASES = [
  'E3:2 A3:3 C4 B3:2 A3:4 E4:2 D4:6 B3:6',
  'A3:3 C4 B3:2 G#3:4 A#3:2 E3:10',
  'E3:2 A3:3 C4 B3:2 A3:4 E4:2',
  'G4:4 F#4:2 F4:4 C#4:2 F4:3 E4 D#4:2 D#4:4 C4:2 A3:6',
];
const HEDWIG_OPENING = HEDWIG_PHRASES.join(' ');
const HEDWIG_REPRISE = HEDWIG_PHRASES.slice(0, 2).join(' ');

// First verse and refrain from the children's series Fixiki, transposed from C to G.
// Melody and eighth-note durations follow Pavlo Butorin's beginner piano score,
// starting at bar 5 after the instrumental introduction:
// https://drive.google.com/file/d/14mEi5JnbrUPrP0fzCoi6BwVd8A6DTnVc/view
const FIXIKI_PHRASES = [
  'G3:2 B3:2 D4:2 E4:2 F4:2 E4 D4:5',
  'B3:2 B3:2 B3:2 C4:2 B3:2 A3:6',
  'D3:2 F#3:2 A3:2 B3:2 C4:2 B3 A3:5',
  'D4:2 D4:2 E4:2 D4:2 B3:2 G3:4',
  'D4:2 E4:2 F#4:2 G4:2 E4:2 D4:2 C4:4',
  'C4:2 B3:2 A3:2 B3:2 C4 D4:5',
  'D4:2 G4:2 B3:2 C4:2 D4:2 E4:2 F#4 G4:3',
  'C4:2 B3:2 B3:2 A3:2 A3:2 G3:2',
];

// Leonid Beckman's verse melody in F major, transposed to D major for the
// first five guitar frets. Eighth-note units follow the vocal score:
// https://notarhiv.ru/detskie/3/1%20%28423%29.pdf
const ELOCHKA_VERSE = [
  'A3 F#4 F#4 E4 F#4 D4 A3 A3 A3',
  'F#4 F#4 G4 E4 A4:3 A4',
  'B3 B3 G4 G4 F#4 E4 D4 D4',
  'F#4 F#4 E4 F#4 D4:3',
];

const SONGS = [
  {
    id: 'geese', title: 'Два весёлых гуся', subtitle: 'Украинская народная мелодия · два куплета · учебная версия', icon: '♩',
    beatMs: 280,
    fragments: [
      ...makeFragments('Жили у бабуси', GEESE_OPENING, 6),
      ...makeFragments('Один серый, другой белый', GEESE_REFRAIN, 7),
      ...makeFragments('Повтор', GEESE_REFRAIN, 7),
      ...makeFragments('Второй куплет', GEESE_OPENING, 6),
      ...makeFragments('Второй припев', GEESE_REFRAIN, 7),
      ...makeFragments('Финальный повтор', GEESE_REFRAIN, 7),
    ],
  },
  {
    id: 'hedwig', title: 'Гарри Поттер — тема заставки', subtitle: 'Тема Букли · Джон Уильямс · учебный отрывок', icon: '✦', excerpt: true,
    beatMs: 200, fragments: [
      ...makeFragments('Тема Букли', HEDWIG_OPENING),
      ...makeFragments('Возвращение темы', HEDWIG_REPRISE),
    ],
  },
  {
    id: 'fixiki', progressId: 'fixiki-v2', title: 'Фиксики — Кто такие фиксики?', subtitle: 'Георгий Васильев · куплет и припев · учебная версия', icon: '♫', excerpt: true,
    beatMs: 235, fragments: FIXIKI_PHRASES.flatMap((phrase, index) => makeFragments(index < 6 ? `Куплет · строка ${index + 1}` : `Припев · строка ${index - 5}`, phrase, 8).map(part => ({ ...part, pauseAfter: index === 5 ? 470 : false }))),
  },
  {
    id: 'elochka', title: 'В лесу родилась ёлочка', subtitle: 'Леонид Бекман · три куплета · учебная версия', icon: '♩',
    beatMs: 290, fragments: Array.from({ length: 3 }, (_, verseIndex) => ELOCHKA_VERSE.flatMap((phrase, index) => makeFragments(`Куплет ${verseIndex + 1} · строка ${index + 1}`, phrase, 7).map(part => ({ ...part, pauseAfter: part.pauseAfter ? (index < 3 ? 260 : verseIndex < 2 ? 200 : false) : false })))).flat(),
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
function noteKey(fragmentIndex = state.fragmentIndex, noteIndex = state.noteIndex) { return `${song().progressId || song().id}:${fragmentIndex}:${noteIndex}`; }
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
    const cells = Array.from({ length: 5 }, (_, index) => {
      const fret = index + 1;
      const active = target.string === string && (target.fret === fret || target.fret === 0 && fret === 1);
      const marker = active ? (target.fret === 0 ? '<span class="open-marker">○</span>' : `<span class="finger-marker">${target.fret}</span>`) : '';
      return `<span class="fret-cell ${active ? 'active-fret' : ''}">${marker}</span>`;
    }).join('');
    return `<div class="fret-row ${string === target.string ? 'active-string' : ''}" style="--string-thickness:${Math.max(1, i * .42 + 1)}px"><span class="string-label">${label}</span>${cells}</div>`;
  }).join('');
  $('fretboard').setAttribute('aria-label', `${target.string}-я струна, ${target.fret === 0 ? 'открытая' : `${target.fret}-й лад, ${target.finger}-й палец`}`);
  const scroll = document.querySelector('.fret-scroll');
  const cell = $('fretboard').children[target.string - 1]?.children[Math.max(1, target.fret)];
  if (cell) scroll.scrollLeft = Math.max(0, cell.offsetLeft - scroll.clientWidth / 2 + cell.clientWidth / 2);
}

function render() {
  renderSongs();
  if (!state.playing) $('play-song').innerHTML = `<span class="button-icon">♫</span> ${song().excerpt ? 'Послушать весь отрывок' : 'Послушать всю песню'}`;
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
  $('prev-step').disabled = state.fragmentIndex === 0 && state.noteIndex === 0;
  $('next-step').setAttribute('aria-label', state.fragmentIndex === song().fragments.length - 1 && state.noteIndex === fragment().notes.length - 1 ? 'К первому шагу' : 'Следующий шаг');
  renderNotes();
  const target = currentNote();
  $('position-title').innerHTML = `<span class="position-pill">Струна <strong>${target.string}</strong></span><span class="position-join">→</span><span class="position-pill">${target.fret === 0 ? 'Открытая' : `Лад <strong>${target.fret}</strong>`}</span>`;
  $('position-hint').textContent = target.fret === 0 ? 'Сыграй струну, ничего не зажимая' : `Зажми ${target.fret}-й лад ${['', 'первым', 'вторым', 'третьим', 'четвёртым'][target.finger]} пальцем`;
  renderFretboard();
  const total = song().fragments.reduce((n, f) => n + f.notes.length, 0);
  const count = song().fragments.reduce((n, f, fi) => n + f.notes.filter((_, ni) => state.completed[noteKey(fi, ni)]).length, 0);
  $('progress-text').textContent = `Пройдено шагов: ${count} из ${total}`;
}

function setFeedback(type, detail = '') {
  const messages = {
    ready: ['✦', 'Готово к игре', 'Посмотри на струну и лад, послушай звук и повтори его на гитаре.'],
    loading: ['♫', 'Загружаю звук гитары…', 'Это записи настоящих струн. Обычно загрузка нужна только один раз.'],
    playingSong: ['♫', song().excerpt ? 'Играет весь отрывок' : 'Играет вся песня', detail || 'Шаги и фрагменты подсвечиваются по ходу мелодии.'],
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

function pluck(noteId, duration = .55, melody = false) {
  const ctx = state.audioContext;
  const now = ctx.currentTime;
  const sample = state.sampleBuffers[noteId];
  if (!sample) throw new Error(`Missing guitar sample for ${noteId}`);
  const source = ctx.createBufferSource(); source.buffer = sample;
  const gain = ctx.createGain();
  const ringTime = Math.min(Math.max(duration, .12), sample.duration - .12);
  const releaseAt = now + (melody ? ringTime * .78 : ringTime);
  const endAt = Math.min(releaseAt + (melody ? ringTime * .18 : .35), now + sample.duration);
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
  $('play-song').innerHTML = `<span class="button-icon">♫</span> ${song().excerpt ? 'Послушать весь отрывок' : 'Послушать всю песню'}`;
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
  const pace = kind === 'fragment' ? 1.15 : 1;
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
      const durationMs = selectedSong.beatMs * part.beats[noteIndex] * pace;
      pluck(part.notes[noteIndex], selectedSong.beatMs * part.soundBeats[noteIndex] * pace / 1000, true);
      setFeedback(kind === 'song' ? 'playingSong' : 'playingFragment', `Фрагмент ${fragmentIndex + 1} из ${selectedSong.fragments.length} · шаг ${noteIndex + 1} из ${part.notes.length}`);
      await pause(durationMs);
    }
    if (part.pauseAfter) await pause(part.pauseAfter === true ? 240 : part.pauseAfter);
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
  const minTau = Math.floor(sampleRate / 500);
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
$('prev-step').addEventListener('click', () => moveStep(-1));
$('next-step').addEventListener('click', () => moveStep(1));
$('play-note').addEventListener('click', playCurrentNote);
$('play-fragment').addEventListener('click', () => playSequence('fragment'));
$('play-song').addEventListener('click', () => playSequence('song'));
$('check-note').addEventListener('click', checkNote);
window.addEventListener('pagehide', stopListening);
render();
