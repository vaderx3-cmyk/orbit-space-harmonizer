

const fib = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377];
const app = document.querySelector                ('#app') ;

app.innerHTML = `
  <main class="shell">
    <header class="topbar">
      <a class="brand" href="#" aria-label="Orbit home"><span class="brand-mark">✳</span> ORBIT</a>
      <span class="top-note"><span class="live-dot"></span> A SPACE FOR SOUND</span>
      <button class="icon-button" id="info" aria-label="About Orbit" title="About Orbit">i</button>
    </header>

    <section class="instrument" aria-labelledby="title">
      <div class="eyebrow">AN INSTRUMENT FOR SLOWER MOMENTS</div>
      <h1 id="title">Find your <span>frequency.</span></h1>
      <p class="intro">Set a tone. Let its harmonics unfold.</p>

      <div class="orbit-wrap">
        <div class="orbit-glow" aria-hidden="true"></div>
        <div class="orbit-ring orbit-ring-outer" aria-hidden="true"></div>
        <div class="orbit-ring orbit-ring-inner" aria-hidden="true"></div>
        <div class="starfield" aria-hidden="true"></div>
        <svg class="orbit-svg" viewBox="0 0 640 320" role="img" aria-label="Frequency selector from zero to 432 hertz">
          <path class="track-base" d="M 42 286 A 278 278 0 0 1 598 286" />
          <path class="track-progress" id="progress" d="M 42 286 A 278 278 0 0 1 598 286" />
          <g id="fib-ticks"></g>
          <g id="handle" class="handle" tabindex="0" role="slider" aria-label="Frequency" aria-valuemin="0" aria-valuemax="432" aria-valuenow="144">
            <circle class="handle-halo" r="19"></circle><circle class="handle-core" r="7"></circle>
          </g>
        </svg>
        <div class="frequency-readout" aria-live="polite">
          <div class="readout-kicker">YOUR TONE</div>
          <div class="frequency"><span id="frequency">144</span><span class="unit">Hz</span></div>
          <div class="fib-note"><span class="fib-glyph">⌁</span> FIBONACCI <span id="fib-value">144</span></div>
        </div>
        <div class="range-label range-start">0 Hz</div><div class="range-label range-end">432 Hz</div>
      </div>
      <p class="gesture-hint"><span class="hint-dot"></span> DRAG OR SCROLL THE ORBIT TO TUNE</p>

      <section class="controls" aria-label="Sound settings">
        <div class="control-head">
          <div><div class="control-title">Natural harmonics</div><div class="control-subtitle">How many overtones join the drone</div></div>
          <div class="multiplier"><span id="multiplier">4</span><span>×</span></div>
        </div>
        <div class="slider-wrap">
          <input id="harmonics" type="range" min="1" max="12" step="1" value="4" aria-label="Number of natural harmonics" />
          <div class="slider-labels"><span>1</span><span>12 harmonics</span></div>
        </div>
        <div class="control-foot"><span>PURE TONE</span><span id="texture-label">SOFTLY LAYERED</span><span>RICH RESONANCE</span></div>
      </section>

      <section class="modulation-control" aria-label="Modulation settings">
        <button id="modulation-toggle" class="modulation-toggle" aria-pressed="false"><span class="mod-icon">∿</span><span id="modulation-label">Modulation off</span></button>
        <div class="modulation-range"><label for="modulation-depth">DEPTH <span id="modulation-value">4</span></label><input id="modulation-depth" type="range" min="0" max="12" step="1" value="4" aria-label="Modulation depth from zero to twelve cents" /><div class="mod-range-labels"><span>0</span><span>12 cents</span></div></div>
      </section>

      <button id="random-toggle" class="random-toggle" aria-pressed="false"><span class="random-icon">✦</span><span id="random-label">Random melody</span></button>

      <button id="sound-toggle" class="sound-toggle" aria-pressed="false"><span class="sound-icon">▶</span><span id="toggle-label">Begin listening</span><span class="toggle-shortcut">SPACE</span></button>
      <p class="volume-note">Use headphones or keep your volume low to begin.</p>
    </section>
    <footer><span>MADE FOR THE IN-BETWEEN</span><span class="footer-center">0 — 432 HZ</span><span>TAKE A BREATH <span class="breath">✦</span></span></footer>
    <dialog id="about-dialog"><button class="dialog-close" aria-label="Close">×</button><div class="eyebrow">A LITTLE ABOUT ORBIT</div><h2>One tone, many worlds.</h2><p>Orbit turns a single frequency into a gentle, layered drone. The arc spans 0 to 432 Hz, with Fibonacci numbers marked along its path. Each harmonic is a quiet whole-number multiple of your chosen tone.</p><p>Drag the glowing point to tune. Press Space to start or pause. Sound begins only when you choose.</p></dialog>
  </main>`;

const svg = document.querySelector               ('.orbit-svg') ;
const handle = document.querySelector             ('#handle') ;
const progress = document.querySelector                ('#progress') ;
const ticks = document.querySelector             ('#fib-ticks') ;
const frequencyEl = document.querySelector             ('#frequency') ;
const fibValueEl = document.querySelector             ('#fib-value') ;
const harmonicsInput = document.querySelector                  ('#harmonics') ;
const multiplierEl = document.querySelector             ('#multiplier') ;
const toggle = document.querySelector                   ('#sound-toggle') ;
const toggleLabel = document.querySelector             ('#toggle-label') ;
const textureLabel = document.querySelector             ('#texture-label') ;
const NS = 'http://www.w3.org/2000/svg';
let frequency = 144;
let harmonicCount = 4;
let modulationDepth = 4;
let modulationEnabled = false;
let dragging = false;
let audio                      = null;
let master                  = null;
let voices                                                   = [];
let playing = false;
let lfo                        = null;
let lfoAmount                  = null;
let randomMelody = false;
let randomTimer                = null;
let lastRandomFrequency = frequency;
const melodyFrequencies = [34, 55, 89, 144, 233, 288, 377];

function pointFor(value        ) {
  const angle = Math.PI - (value / 432) * Math.PI;
  return { x: 320 + 278 * Math.cos(angle), y: 286 - 278 * Math.sin(angle) };
}
function update(value        , commit = false) {
  frequency = Math.round(Math.min(432, Math.max(0, value)));
  const p = pointFor(frequency);
  handle.setAttribute('transform', `translate(${p.x} ${p.y})`);
  handle.setAttribute('aria-valuenow', String(frequency));
  frequencyEl.textContent = String(frequency);
  const nearest = fib.reduce((a, b) => Math.abs(b - frequency) < Math.abs(a - frequency) ? b : a);
  fibValueEl.textContent = String(nearest);
  const dash = 874.4 * frequency / 432;
  progress.style.strokeDasharray = `${dash} 874.4`;
  if ((dragging || commit) && playing) retune();
}
function buildTicks() {
  fib.forEach((value) => {
    const p = pointFor(value);
    const group = document.createElementNS(NS, 'g');
    group.setAttribute('class', `fib-tick${value === 0 || value === 432 ? ' endpoint' : ''}`);
    group.setAttribute('transform', `translate(${p.x} ${p.y})`);
    const circle = document.createElementNS(NS, 'circle'); circle.setAttribute('r', value === 0 || value === 432 ? '2' : '3');
    const text = document.createElementNS(NS, 'text'); text.setAttribute('y', value < 20 || value > 360 ? '20' : '-12'); text.textContent = String(value);
    group.append(circle, text); ticks.append(group);
  });
}
function pointerValue(event              ) {
  const rect = svg.getBoundingClientRect();
  const x = (event.clientX - rect.left) * 640 / rect.width;
  const y = (event.clientY - rect.top) * 320 / rect.height;
  const dx = x - 320, dy = 286 - y;
  let angle = Math.atan2(dy, dx);
  // Along the upper half-circle, map the left endpoint to 0 and right to 432.
  angle = Math.max(0, Math.min(Math.PI, angle));
  return Math.round((Math.PI - angle) / Math.PI * 432);
}
svg.addEventListener('pointerdown', (event) => { stopRandomMelody(); dragging = true; svg.setPointerCapture(event.pointerId); update(pointerValue(event)); });
svg.addEventListener('pointermove', (event) => { if (dragging) update(pointerValue(event)); });
svg.addEventListener('pointerup', (event) => { if (dragging) { dragging = false; update(pointerValue(event), true); } });
svg.addEventListener('pointercancel', () => { dragging = false; });
svg.addEventListener('wheel', (event) => {
  event.preventDefault();
  stopRandomMelody();
  const step = event.shiftKey ? 10 : 2;
  update(frequency + (event.deltaY < 0 ? step : -step), true);
}, { passive: false });
handle.addEventListener('keydown', (event) => {
  const amount = event.shiftKey ? 10 : 1;
  if (event.key === 'ArrowRight' || event.key === 'ArrowUp') { event.preventDefault(); update(frequency + amount, true); }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') { event.preventDefault(); update(frequency - amount, true); }
  if (event.key === 'Home') { event.preventDefault(); update(0, true); }
  if (event.key === 'End') { event.preventDefault(); update(432, true); }
});

function retune() {
  if (!audio || !playing) return;
  const now = audio.currentTime;
  voices.forEach(({ oscillator, gain }, index) => {
    const targetFreq = Math.max(0.01, frequency) * (index + 1);
    oscillator.frequency.cancelScheduledValues(now);
    oscillator.frequency.setTargetAtTime(targetFreq, now, 0.22);
    const targetGain = index < harmonicCount ? 0.13 / Math.pow(index + 1, 1.28) : 0;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setTargetAtTime(targetGain, now, 0.3);
  });
}
function updateModulation() {
  if (!audio || !lfoAmount) return;
  const now = audio.currentTime;
  lfoAmount.gain.cancelScheduledValues(now);
  lfoAmount.gain.setTargetAtTime(modulationEnabled ? modulationDepth : 0, now, 0.25);
}
function nextRandomFrequency() {
  const choices = melodyFrequencies.filter((value) => value !== lastRandomFrequency);
  const next = choices[Math.floor(Math.random() * choices.length)];
  lastRandomFrequency = next;
  update(next, true);
}
function scheduleRandomNote() {
  if (!randomMelody) return;
  nextRandomFrequency();
  randomTimer = window.setTimeout(scheduleRandomNote, 650 + Math.random() * 950);
}
async function startRandomMelody() {
  if (!playing) await startSound();
  randomMelody = true;
  document.body.classList.add('is-randomizing');
  randomToggle.classList.add('is-randomizing');
  randomToggle.setAttribute('aria-pressed', 'true');
  randomLabel.textContent = 'Stop random melody';
  scheduleRandomNote();
}
function stopRandomMelody() {
  if (!randomMelody) return;
  randomMelody = false;
  if (randomTimer !== null) window.clearTimeout(randomTimer);
  randomTimer = null;
  document.body.classList.remove('is-randomizing');
  randomToggle.classList.remove('is-randomizing');
  randomToggle.setAttribute('aria-pressed', 'false');
  randomLabel.textContent = 'Random melody';
}
async function startSound() {
  if (!audio) {
    audio = new AudioContext();
    master = audio.createGain();
    master.gain.value = 0;
    const filter = audio.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 4200; filter.Q.value = 0.45;
    master.connect(filter); filter.connect(audio.destination);
    lfo = audio.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.1;
    lfoAmount = audio.createGain(); lfoAmount.gain.value = 0;
    lfo.connect(lfoAmount); lfo.start();
    voices = Array.from({ length: 12 }, (_, index) => {
      const oscillator = audio .createOscillator(); oscillator.type = index === 0 ? 'sine' : 'sine';
      const gain = audio .createGain(); gain.gain.value = 0;
      lfoAmount .connect(oscillator.detune);
      oscillator.connect(gain); gain.connect(master ); oscillator.start();
      return { oscillator, gain };
    });
  }
  if (audio.state === 'suspended') await audio.resume();
  playing = true; retune(); updateModulation();
  master .gain.cancelScheduledValues(audio.currentTime);
  master .gain.setTargetAtTime(0.72, audio.currentTime, 1.4);
  toggle.classList.add('is-playing'); toggle.setAttribute('aria-pressed', 'true');
  toggleLabel.textContent = 'Pause the drone'; toggle.querySelector('.sound-icon') .textContent = 'Ⅱ';
  document.body.classList.add('is-playing');
}
function stopSound() {
  if (!audio || !master) return;
  playing = false;
  stopRandomMelody();
  master.gain.cancelScheduledValues(audio.currentTime);
  master.gain.setTargetAtTime(0, audio.currentTime, 0.45);
  toggle.classList.remove('is-playing'); toggle.setAttribute('aria-pressed', 'false');
  toggleLabel.textContent = 'Begin listening'; toggle.querySelector('.sound-icon') .textContent = '▶';
  document.body.classList.remove('is-playing');
}
toggle.addEventListener('click', () => playing ? stopSound() : void startSound());
harmonicsInput.addEventListener('input', () => {
  harmonicCount = Number(harmonicsInput.value);
  multiplierEl.textContent = String(harmonicCount);
  textureLabel.textContent = harmonicCount < 4 ? 'PURE & OPEN' : harmonicCount < 9 ? 'SOFTLY LAYERED' : 'RICH RESONANCE';
  retune();
});
const modulationToggle = document.querySelector                   ('#modulation-toggle') ;
const modulationInput = document.querySelector                  ('#modulation-depth') ;
const modulationValue = document.querySelector             ('#modulation-value') ;
const modulationLabel = document.querySelector             ('#modulation-label') ;
modulationToggle.addEventListener('click', () => {
  modulationEnabled = !modulationEnabled;
  modulationToggle.classList.toggle('is-on', modulationEnabled);
  modulationToggle.setAttribute('aria-pressed', String(modulationEnabled));
  modulationLabel.textContent = modulationEnabled ? 'Modulation on' : 'Modulation off';
  updateModulation();
});
modulationInput.addEventListener('input', () => {
  modulationDepth = Number(modulationInput.value);
  modulationValue.textContent = String(modulationDepth);
  updateModulation();
});
const randomToggle = document.querySelector                   ('#random-toggle') ;
const randomLabel = document.querySelector             ('#random-label') ;
randomToggle.addEventListener('click', () => randomMelody ? stopRandomMelody() : void startRandomMelody());
document.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLButtonElement)) {
    event.preventDefault(); playing ? stopSound() : void startSound();
  }
});
const dialog = document.querySelector                   ('#about-dialog') ;
document.querySelector('#info') .addEventListener('click', () => dialog.showModal());
document.querySelector('.dialog-close') .addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
buildTicks(); update(frequency);
