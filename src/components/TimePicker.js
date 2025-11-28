// Material Design 3 style time picker
// Usage:
// import createTimePicker from './components/TimePicker.js'
// const picker = createTimePicker({ initial: '08:30' })
// container.appendChild(picker.element)

export default function createTimePicker({ initial = '00:00', step = 5 } = {}) {
  const [initH, initM] = (initial || '00:00').split(':').map((v) => Number(v || 0));
  let hour = isNaN(initH) ? 0 : initH % 24;
  let minute = isNaN(initM) ? 0 : Math.floor(initM / step) * step;
  let mode = 'hour'; // 'hour' or 'minute'

  const element = document.createElement('div');
  element.className = 'timepicker w-full max-w-[320px] mx-auto select-none';
  element.innerHTML = `
    <!-- Display Section -->
    <div class="tp-display mb-6 flex justify-center items-end gap-1">
      <div class="tp-hour-display text-[56px] leading-none font-medium cursor-pointer rounded-xl px-4 py-2 transition-colors bg-pink-100 text-pink-600">
        ${pad(hour)}
      </div>
      <div class="text-[56px] leading-none font-medium text-gray-800 pb-2">:</div>
      <div class="tp-minute-display text-[56px] leading-none font-medium cursor-pointer rounded-xl px-4 py-2 transition-colors text-gray-800 hover:bg-gray-100">
        ${pad(minute)}
      </div>
    </div>

    <!-- Clock Face Section -->
    <div class="tp-clock relative mx-auto" style="width:200px;height:200px">
      <div class="absolute inset-0 rounded-full bg-gray-100"></div>
      <svg viewBox="0 0 256 256" width="200" height="200" class="block relative z-10 pointer-events-none">
        <g transform="translate(128,128)">
          <!-- Center Dot -->
          <circle r="4" fill="#E91E63" />
          
          <!-- Hand Group -->
          <g class="tp-hand-group" transition="transform 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)">
            <line x1="0" y1="0" x2="0" y2="-96" stroke="#E91E63" stroke-width="2" />
            <circle cx="0" cy="-96" r="16" fill="#E91E63" />
            <circle cx="0" cy="-96" r="2" fill="#fff" class="tp-hand-dot hidden" />
          </g>
          
          <!-- Numbers Container -->
          <g class="tp-numbers pointer-events-auto"></g>
          <g class="tp-minute-ticks pointer-events-auto" style="display:none"></g>
        </g>
      </svg>
    </div>

    <!-- Actions -->
    <div class="tp-actions mt-6 flex gap-4 justify-between items-center px-4">
      <button type="button" class="tp-btn-now text-sm font-medium text-pink-600 hover:bg-pink-50 px-3 py-2 rounded-lg transition-colors">
        <span class="material-symbols-outlined align-middle text-lg mr-1">schedule</span>Now
      </button>
      <div class="flex gap-2">
        <button type="button" class="tp-btn-cancel text-sm font-medium text-pink-600 hover:bg-pink-50 px-4 py-2 rounded-full transition-colors">Cancel</button>
        <button type="button" class="tp-btn-ok text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 px-6 py-2 rounded-full shadow-sm shadow-pink-200 transition-colors">OK</button>
      </div>
    </div>
  `;

  const hourEl = element.querySelector('.tp-hour-display');
  const minuteEl = element.querySelector('.tp-minute-display');
  const numbersGroup = element.querySelector('.tp-numbers');
  const ticksGroup = element.querySelector('.tp-minute-ticks');
  const handGroup = element.querySelector('.tp-hand-group');

  // Build hour numbers (1-12)
  const radius = 96;
  for (let i = 1; i <= 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const x = Math.round(Math.cos(angle) * radius);
    const y = Math.round(Math.sin(angle) * radius);

    // Hit area for click
    const hit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    hit.setAttribute('cx', String(x));
    hit.setAttribute('cy', String(y));
    hit.setAttribute('r', '20');
    hit.setAttribute('fill', 'transparent');
    hit.setAttribute('data-hour', String(i % 12));
    hit.style.cursor = 'pointer';
    numbersGroup.appendChild(hit);

    // Text
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y + 5)); // optical center
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '16');
    text.setAttribute('font-weight', '500');
    text.setAttribute('fill', '#1f2937');
    text.setAttribute('class', 'tp-number-text pointer-events-none transition-colors duration-200');
    text.setAttribute('data-val', String(i % 12));
    text.textContent = String(i === 12 ? 12 : i);
    numbersGroup.appendChild(text);
  }

  // Build minute ticks (every step minutes)
  for (let m = 0; m < 60; m += step) {
    const angle = (m / 60) * Math.PI * 2 - Math.PI / 2;
    const x = Math.round(Math.cos(angle) * radius);
    const y = Math.round(Math.sin(angle) * radius);

    // Hit area
    const hit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    hit.setAttribute('cx', String(x));
    hit.setAttribute('cy', String(y));
    hit.setAttribute('r', '20');
    hit.setAttribute('fill', 'transparent');
    hit.setAttribute('data-minute', String(m));
    hit.style.cursor = 'pointer';
    ticksGroup.appendChild(hit);

    // Text
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y + 5));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '16');
    text.setAttribute('font-weight', '500');
    text.setAttribute('fill', '#1f2937');
    text.setAttribute('class', 'tp-tick-text pointer-events-none transition-colors duration-200');
    text.setAttribute('data-val', String(m));
    text.textContent = String(m).padStart(2, '0');
    ticksGroup.appendChild(text);
  }

  // initial render
  updateDisplay();
  updateHand();
  showMode(mode);

  // events
  hourEl.addEventListener('click', () => showMode('hour'));
  minuteEl.addEventListener('click', () => showMode('minute'));

  numbersGroup.addEventListener('click', (e) => {
    const target = e.target;
    const hrAttr = target.getAttribute && target.getAttribute('data-hour');
    if (!hrAttr) return;

    let h12 = Number(hrAttr);
    if (h12 === 0) h12 = 12;

    // Smart AM/PM: if current hour is PM, keep it PM unless user explicitly changes (not handled here, simple logic)
    // Actually, standard material picker toggles AM/PM separately. 
    // For 24h simplicity here: we preserve the current AM/PM state.
    const isPM = hour >= 12;
    const newHour = (isPM ? (h12 % 12) + 12 : h12 % 12) % 24;

    hour = newHour;
    updateDisplay();
    updateHand();
    fireChange();

    // Auto-advance to minute
    setTimeout(() => showMode('minute'), 300);
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
    showMode('hour');
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

    // Toggle Groups
    numbersGroup.style.display = m === 'hour' ? 'block' : 'none';
    ticksGroup.style.display = m === 'minute' ? 'block' : 'none';

    // Toggle Display Styles
    if (m === 'hour') {
      hourEl.classList.add('bg-pink-100', 'text-pink-600');
      hourEl.classList.remove('text-gray-800', 'hover:bg-gray-100');

      minuteEl.classList.remove('bg-pink-100', 'text-pink-600');
      minuteEl.classList.add('text-gray-800', 'hover:bg-gray-100');
    } else {
      minuteEl.classList.add('bg-pink-100', 'text-pink-600');
      minuteEl.classList.remove('text-gray-800', 'hover:bg-gray-100');

      hourEl.classList.remove('bg-pink-100', 'text-pink-600');
      hourEl.classList.add('text-gray-800', 'hover:bg-gray-100');
    }
    updateHand(); // refresh hand position for new mode
  }

  function updateDisplay() {
    hourEl.textContent = pad(hour);
    minuteEl.textContent = pad(minute);
  }

  function updateHand() {
    let val, max;
    if (mode === 'hour') {
      val = hour % 12;
      max = 12;
    } else {
      val = minute;
      max = 60;
    }

    const angleDeg = (val / max) * 360;
    handGroup.style.transform = `rotate(${angleDeg}deg)`;

    // Update text colors based on selection
    // Reset all
    element.querySelectorAll('.tp-number-text, .tp-tick-text').forEach(el => el.setAttribute('fill', '#1f2937'));

    // Highlight selected
    const selector = mode === 'hour' ? `.tp-number-text[data-val="${val}"]` : `.tp-tick-text[data-val="${val}"]`;
    const selectedText = element.querySelector(selector);
    if (selectedText) {
      selectedText.setAttribute('fill', '#ffffff');
      // Counter-rotate text so it stays upright? No, standard material rotates the whole hand.
      // But the text inside the bubble needs to be upright relative to the page? 
      // Actually, standard material just highlights the text on the dial.
      // Since our hand covers the text, we need the text ON TOP or the hand BEHIND.
      // In this SVG, hand is drawn BEFORE numbers (z-index wise in SVG order).
      // Wait, line 30-34 in original was hand AFTER numbers.
      // Here I put hand BEFORE numbers (lines 34-38 vs 41).
      // So the hand is BEHIND the text.
      // The circle at the tip is filled #E91E63.
      // So the text will be on top of the pink circle.
      // We set text fill to white.
    }
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
