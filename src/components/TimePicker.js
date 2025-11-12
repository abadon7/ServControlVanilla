// Minimal clock-style time picker (no dependencies)
// Usage:
// import createTimePicker from './components/TimePicker.js'
// const picker = createTimePicker({ initial: '08:30' })
// container.appendChild(picker.element)
// picker.onChange = (value) => console.log(value) // value = '08:30'
// picker.setValue('14:45')

export default function createTimePicker({ initial = '00:00', step = 5 } = {}) {
  const [initH, initM] = (initial || '00:00').split(':').map((v) => Number(v || 0));
  let hour = isNaN(initH) ? 0 : initH % 24;
  let minute = isNaN(initM) ? 0 : Math.floor(initM / step) * step;
  let mode = 'hour'; // 'hour' or 'minute'

  const element = document.createElement('div');
  element.className = 'timepicker w-full max-w-sm mx-auto';
  element.innerHTML = `
    <div class="tp-display mb-3 text-center">
      <div class="tp-value text-2xl font-semibold">${formatHHMM(hour, minute)}</div>
      <div class="tp-mode text-sm text-gray-500">Select hour</div>
    </div>
    <div class="tp-clock relative mx-auto" style="width:220px;height:220px">
      <svg viewBox="0 0 220 220" width="220" height="220" class="block">
        <defs>
          <filter id="tp-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.12" />
          </filter>
        </defs>
        <g transform="translate(110,110)">
          <circle r="100" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
          <g class="tp-numbers"></g>
          <g class="tp-minute-ticks"></g>
          <line class="tp-hand" x1="0" y1="0" x2="0" y2="-60" stroke="#0ea5e9" stroke-width="3" stroke-linecap="round" />
          <circle r="4" fill="#0ea5e9" />
        </g>
      </svg>
    </div>
    <div class="tp-actions mt-3 flex gap-2 justify-center">
      <button type="button" class="tp-btn-cancel px-3 py-1 rounded bg-gray-100">Cancel</button>
      <button type="button" class="tp-btn-now px-3 py-1 rounded bg-gray-100">Now</button>
      <button type="button" class="tp-btn-ok px-3 py-1 rounded bg-blue-600 text-white">OK</button>
    </div>
  `;

  const displayEl = element.querySelector('.tp-value');
  const modeEl = element.querySelector('.tp-mode');
  const numbersGroup = element.querySelector('.tp-numbers');
  const ticksGroup = element.querySelector('.tp-minute-ticks');
  const hand = element.querySelector('.tp-hand');

  // Build hour numbers (1-12) around dial. We'll use AM/PM logic to produce 24h value.
  const radius = 80;
  for (let i = 1; i <= 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const x = Math.round(Math.cos(angle) * radius);
    const y = Math.round(Math.sin(angle) * radius);
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y + 6));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '14');
    text.setAttribute('fill', '#0f172a');
    text.setAttribute('data-hour', String(i % 12));
    text.style.cursor = 'pointer';
    text.textContent = String(i === 12 ? 12 : i);
    numbersGroup.appendChild(text);
  }

  // Build minute ticks (every step minutes)
  for (let m = 0; m < 60; m += step) {
    const angle = (m / 60) * Math.PI * 2 - Math.PI / 2;
    const x = Math.round(Math.cos(angle) * (radius - 18));
    const y = Math.round(Math.sin(angle) * (radius - 18));
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '12');
    text.setAttribute('fill', '#0f172a');
    text.setAttribute('data-minute', String(m));
    text.style.cursor = 'pointer';
    text.textContent = String(m).padStart(2, '0');
    ticksGroup.appendChild(text);
  }

  // initial render
  updateDisplay();
  updateHand();
  showMode(mode);

  // events
  numbersGroup.addEventListener('click', (e) => {
    const target = e.target;
    const hrAttr = target.getAttribute && target.getAttribute('data-hour');
    if (!hrAttr) return;
    let h12 = Number(hrAttr);
    if (h12 === 0) h12 = 12;
    // detect AM/PM by current hour
    const isPM = hour >= 12;
    const newHour = (isPM ? (h12 % 12) + 12 : h12 % 12) % 24;
    hour = newHour;
    mode = 'minute';
    showMode(mode);
    updateDisplay();
    updateHand();
    fireChange();
  });

  ticksGroup.addEventListener('click', (e) => {
    const target = e.target;
    const mAttr = target.getAttribute && target.getAttribute('data-minute');
    if (!mAttr) return;
    minute = Number(mAttr) % 60;
    updateDisplay();
    updateHand();
    fireChange();
  });

  element.querySelector('.tp-btn-now').addEventListener('click', () => {
    const now = new Date();
    hour = now.getHours();
    minute = Math.floor(now.getMinutes() / step) * step;
    mode = 'hour';
    showMode(mode);
    updateDisplay();
    updateHand();
    fireChange();
  });

  element.querySelector('.tp-btn-ok').addEventListener('click', () => {
    if (picker.onOk) picker.onOk(getValue());
  });

  element.querySelector('.tp-btn-cancel').addEventListener('click', () => {
    if (picker.onCancel) picker.onCancel();
  });

  function showMode(m) {
    mode = m;
    modeEl.textContent = m === 'hour' ? 'Select hour' : 'Select minute';
    // show/hide groups
    numbersGroup.style.display = m === 'hour' ? 'block' : 'none';
    ticksGroup.style.display = m === 'minute' ? 'block' : 'none';
  }

  function updateDisplay() {
    displayEl.textContent = formatHHMM(hour, minute);
  }

  function updateHand() {
    // angle depends on mode
    let angle;
    if (mode === 'hour') {
      const h12 = hour % 12;
      angle = ((h12) / 12) * Math.PI * 2 - Math.PI / 2;
    } else {
      angle = (minute / 60) * Math.PI * 2 - Math.PI / 2;
    }
    const x = Math.cos(angle) * -60; // negative because SVG y is inverted in our earlier transform
    const y = Math.sin(angle) * -60;
    hand.setAttribute('x2', String(-Math.cos(angle) * 60));
    hand.setAttribute('y2', String(-Math.sin(angle) * 60));
  }

  function getValue() {
    return formatHHMM(hour, minute);
  }

  function setValue(val) {
    const [hStr, mStr] = String(val || '00:00').split(':');
    const h = Number(hStr) || 0;
    const m = Number(mStr) || 0;
    hour = ((h % 24) + 24) % 24;
    minute = Math.max(0, Math.min(59, Math.floor(m / step) * step));
    updateDisplay();
    updateHand();
  }

  function fireChange() {
    if (picker.onChange) picker.onChange(getValue());
  }

  const picker = {
    element,
    getValue,
    setValue,
    onChange: null,
    onOk: null,
    onCancel: null,
  };

  // helpers
  function pad(n) { return String(n).padStart(2, '0'); }
  function formatHHMM(h, m) { return `${pad(h)}:${pad(m)}`; }

  return picker;
}
