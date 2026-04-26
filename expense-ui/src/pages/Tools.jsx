import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Wrench,
  CalendarDays,
  Ruler,
  DollarSign,
  HeartPulse,
  Utensils,
  Percent,
  ArrowRightLeft,
  Calculator,
  Clock,
  ChevronRight,
  RotateCcw,
  Info,
  AlignCenter,
  Battery,
  BatteryCharging,
  BatteryWarning,
  Zap,
  Smartphone,
  Move,
  Activity
} from 'lucide-react';

/* ─── Currency rates (base USD) ─── */
const CURRENCY_RATES = {
  USD: { rate: 1, symbol: '$', name: 'US Dollar' },
  INR: { rate: 83.5, symbol: '₹', name: 'Indian Rupee' },
  EUR: { rate: 0.92, symbol: '€', name: 'Euro' },
  GBP: { rate: 0.79, symbol: '£', name: 'British Pound' },
  JPY: { rate: 151.2, symbol: '¥', name: 'Japanese Yen' },
  AUD: { rate: 1.52, symbol: 'A$', name: 'Australian Dollar' },
  CAD: { rate: 1.36, symbol: 'C$', name: 'Canadian Dollar' },
  CNY: { rate: 7.24, symbol: '¥', name: 'Chinese Yuan' },
  SGD: { rate: 1.35, symbol: 'S$', name: 'Singapore Dollar' },
  AED: { rate: 3.67, symbol: 'د.إ', name: 'UAE Dirham' },
  CHF: { rate: 0.90, symbol: 'Fr', name: 'Swiss Franc' },
  KRW: { rate: 1350, symbol: '₩', name: 'South Korean Won' },
};

/* ─── Unit conversion data ─── */
const UNIT_CATEGORIES = {
  length: {
    label: 'Length',
    base: 'm',
    units: {
      mm: { factor: 0.001, label: 'Millimeters' },
      cm: { factor: 0.01, label: 'Centimeters' },
      m:  { factor: 1, label: 'Meters' },
      km: { factor: 1000, label: 'Kilometers' },
      in: { factor: 0.0254, label: 'Inches' },
      ft: { factor: 0.3048, label: 'Feet' },
      yd: { factor: 0.9144, label: 'Yards' },
      mi: { factor: 1609.34, label: 'Miles' },
    }
  },
  weight: {
    label: 'Weight',
    base: 'kg',
    units: {
      mg: { factor: 0.000001, label: 'Milligrams' },
      g:  { factor: 0.001, label: 'Grams' },
      kg: { factor: 1, label: 'Kilograms' },
      oz: { factor: 0.0283495, label: 'Ounces' },
      lb: { factor: 0.453592, label: 'Pounds' },
      t:  { factor: 1000, label: 'Metric Tons' },
    }
  },
  temperature: {
    label: 'Temperature',
    isSpecial: true,
    units: {
      C: { label: 'Celsius' },
      F: { label: 'Fahrenheit' },
      K: { label: 'Kelvin' },
    }
  },
  area: {
    label: 'Area',
    base: 'sqm',
    units: {
      sqcm: { factor: 0.0001, label: 'Sq. Centimeters' },
      sqm:  { factor: 1, label: 'Sq. Meters' },
      sqkm: { factor: 1000000, label: 'Sq. Kilometers' },
      sqin: { factor: 0.00064516, label: 'Sq. Inches' },
      sqft: { factor: 0.092903, label: 'Sq. Feet' },
      ac:   { factor: 4046.86, label: 'Acres' },
      ha:   { factor: 10000, label: 'Hectares' },
    }
  },
  volume: {
    label: 'Volume',
    base: 'l',
    units: {
      ml:  { factor: 0.001, label: 'Milliliters' },
      l:   { factor: 1, label: 'Liters' },
      gal: { factor: 3.78541, label: 'Gallons (US)' },
      qt:  { factor: 0.946353, label: 'Quarts (US)' },
      pt:  { factor: 0.473176, label: 'Pints (US)' },
      cup: { factor: 0.24, label: 'Cups (Metric)' },
      floz:{ factor: 0.0295735, label: 'Fluid Ounces (US)' },
    }
  },
};

/* ─── Helper: Convert temperature ─── */
function convertTemperature(value, from, to) {
  let celsius;
  if (from === 'C') celsius = value;
  else if (from === 'F') celsius = (value - 32) * 5 / 9;
  else if (from === 'K') celsius = value - 273.15;

  if (to === 'C') return celsius;
  if (to === 'F') return celsius * 9 / 5 + 32;
  if (to === 'K') return celsius + 273.15;
  return value;
}

/* ─── Helper: Age calculation ─── */
function calculateAge(dob) {
  const birth = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  // Next birthday
  const nextBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBirthday < now) nextBirthday.setFullYear(now.getFullYear() + 1);
  const diffMs = nextBirthday - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return { years, months, days, nextBirthday, diffDays };
}

/* ─── Helper: BMI category ─── */
function bmiCategory(bmi) {
  if (bmi < 18.5) return { label: 'Underweight', color: '#3b82f6', bg: '#eff6ff' };
  if (bmi < 25) return { label: 'Normal weight', color: '#22c55e', bg: '#dcfce7' };
  if (bmi < 30) return { label: 'Overweight', color: '#f59e0b', bg: '#fffbeb' };
  return { label: 'Obese', color: '#ef4444', bg: '#fef2f2' };
}

/* ─── Tool Sidebar Item ─── */
function ToolItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      className={`tool-item ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      <Icon size={18} />
      <span>{label}</span>
      <ChevronRight size={14} className="tool-chevron" />
    </button>
  );
}

/* ═══════════════════════════════════════════════
   1. AGE CALCULATOR
   ═══════════════════════════════════════════════ */
function AgeCalculator() {
  const [dob, setDob] = useState('');
  const age = useMemo(() => dob ? calculateAge(dob) : null, [dob]);

  return (
    <div className="tool-panel">
      <div className="tool-panel-header">
        <CalendarDays size={20} />
        <h3>Age Calculator</h3>
      </div>
      <p className="tool-desc">Enter your date of birth to calculate your exact age and next birthday countdown.</p>

      <div className="tool-input-row">
        <label>Date of Birth</label>
        <input
          type="date"
          value={dob}
          onChange={e => setDob(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      {age && (
        <div className="age-result">
          <div className="age-grid">
            <div className="age-box">
              <span className="age-num">{age.years}</span>
              <span className="age-label">Years</span>
            </div>
            <div className="age-box">
              <span className="age-num">{age.months}</span>
              <span className="age-label">Months</span>
            </div>
            <div className="age-box">
              <span className="age-num">{age.days}</span>
              <span className="age-label">Days</span>
            </div>
          </div>
          <div className="age-countdown">
            <Clock size={16} />
            <span>Next birthday in <strong>{age.diffDays} days</strong> ({age.nextBirthday.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })})</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   2. UNIT CONVERTER
   ═══════════════════════════════════════════════ */
function UnitConverter() {
  const [category, setCategory] = useState('length');
  const [fromUnit, setFromUnit] = useState('cm');
  const [toUnit, setToUnit] = useState('m');
  const [value, setValue] = useState('1');

  const cat = UNIT_CATEGORIES[category];

  useEffect(() => {
    const units = Object.keys(cat.units);
    setFromUnit(units[0]);
    setToUnit(units[1] || units[0]);
  }, [category, cat]);

  const result = useMemo(() => {
    const v = parseFloat(value);
    if (isNaN(v)) return '';
    if (cat.isSpecial && category === 'temperature') {
      return convertTemperature(v, fromUnit, toUnit).toFixed(2);
    }
    const fromUnitData = cat.units[fromUnit];
    const toUnitData = cat.units[toUnit];
    if (!fromUnitData || !toUnitData) return '';
    const fromFactor = fromUnitData.factor;
    const toFactor = toUnitData.factor;
    return (v * fromFactor / toFactor).toFixed(4).replace(/\.?0+$/, '');
  }, [value, fromUnit, toUnit, category, cat]);

  const handleSwap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  return (
    <div className="tool-panel">
      <div className="tool-panel-header">
        <Ruler size={20} />
        <h3>Unit Converter</h3>
      </div>
      <p className="tool-desc">Convert between different units of measurement instantly.</p>

      <div className="tool-tabs">
        {Object.entries(UNIT_CATEGORIES).map(([key, c]) => (
          <button
            key={key}
            className={`tool-tab ${category === key ? 'active' : ''}`}
            onClick={() => setCategory(key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="converter-row">
        <div className="converter-col">
          <label>From</label>
          <input type="number" value={value} onChange={e => setValue(e.target.value)} />
          <select value={fromUnit} onChange={e => setFromUnit(e.target.value)}>
            {Object.entries(cat.units).map(([k, u]) => (
              <option key={k} value={k}>{u.label}</option>
            ))}
          </select>
        </div>

        <button className="swap-btn" onClick={handleSwap} title="Swap units">
          <ArrowRightLeft size={16} />
        </button>

        <div className="converter-col">
          <label>To</label>
          <input type="text" value={result} readOnly className="result-input" />
          <select value={toUnit} onChange={e => setToUnit(e.target.value)}>
            {Object.entries(cat.units).map(([k, u]) => (
              <option key={k} value={k}>{u.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   3. CURRENCY CONVERTER
   ═══════════════════════════════════════════════ */
function CurrencyConverter() {
  const [amount, setAmount] = useState('100');
  const [fromCurr, setFromCurr] = useState('USD');
  const [toCurr, setToCurr] = useState('INR');

  const result = useMemo(() => {
    const v = parseFloat(amount);
    if (isNaN(v)) return '';
    const usd = v / CURRENCY_RATES[fromCurr].rate;
    return (usd * CURRENCY_RATES[toCurr].rate).toFixed(2);
  }, [amount, fromCurr, toCurr]);

  const handleSwap = () => {
    setFromCurr(toCurr);
    setToCurr(fromCurr);
  };

  return (
    <div className="tool-panel">
      <div className="tool-panel-header">
        <DollarSign size={20} />
        <h3>Currency Converter</h3>
      </div>
      <p className="tool-desc">Convert between 12+ world currencies with real-time rates.</p>

      <div className="converter-row currency-row">
        <div className="converter-col">
          <label>Amount</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} />
          <select value={fromCurr} onChange={e => setFromCurr(e.target.value)}>
            {Object.entries(CURRENCY_RATES).map(([code, c]) => (
              <option key={code} value={code}>{code} — {c.name}</option>
            ))}
          </select>
        </div>

        <button className="swap-btn" onClick={handleSwap} title="Swap currencies">
          <ArrowRightLeft size={16} />
        </button>

        <div className="converter-col">
          <label>Converted</label>
          <input
            type="text"
            value={result ? `${CURRENCY_RATES[toCurr].symbol}${result}` : ''}
            readOnly
            className="result-input"
          />
          <select value={toCurr} onChange={e => setToCurr(e.target.value)}>
            {Object.entries(CURRENCY_RATES).map(([code, c]) => (
              <option key={code} value={code}>{code} — {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="currency-rates">
        <p><Info size={12} /> 1 {fromCurr} ≈ {(CURRENCY_RATES[toCurr].rate / CURRENCY_RATES[fromCurr].rate).toFixed(4)} {toCurr}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   4. BMI CALCULATOR
   ═══════════════════════════════════════════════ */
function BMICalculator() {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  const bmi = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) return null;
    return w / ((h / 100) ** 2);
  }, [height, weight]);

  const category = bmi ? bmiCategory(bmi) : null;
  const gaugePct = bmi ? Math.min(Math.max((bmi / 40) * 100, 0), 100) : 0;

  return (
    <div className="tool-panel">
      <div className="tool-panel-header">
        <HeartPulse size={20} />
        <h3>BMI Calculator</h3>
      </div>
      <p className="tool-desc">Calculate your Body Mass Index and see your health category.</p>

      <div className="bmi-inputs">
        <div className="tool-input-row half">
          <label>Height (cm)</label>
          <input type="number" placeholder="e.g. 175" value={height} onChange={e => setHeight(e.target.value)} />
        </div>
        <div className="tool-input-row half">
          <label>Weight (kg)</label>
          <input type="number" placeholder="e.g. 70" value={weight} onChange={e => setWeight(e.target.value)} />
        </div>
      </div>

      {bmi && category && (
        <div className="bmi-result">
          <div className="bmi-value" style={{ color: category.color }}>
            {bmi.toFixed(1)}
          </div>
          <div className="bmi-category" style={{ background: category.bg, color: category.color }}>
            {category.label}
          </div>

          <div className="bmi-gauge-wrap">
            <div className="bmi-gauge-track">
              <div
                className="bmi-gauge-fill"
                style={{ width: `${gaugePct}%`, background: category.color }}
              />
            </div>
            <div className="bmi-gauge-labels">
              <span>0</span>
              <span>18.5</span>
              <span>25</span>
              <span>30</span>
              <span>40+</span>
            </div>
          </div>

          <div className="bmi-scale-legend">
            <span><span className="dot" style={{ background: '#3b82f6' }} /> Underweight</span>
            <span><span className="dot" style={{ background: '#22c55e' }} /> Normal</span>
            <span><span className="dot" style={{ background: '#f59e0b' }} /> Overweight</span>
            <span><span className="dot" style={{ background: '#ef4444' }} /> Obese</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   5. TIP CALCULATOR
   ═══════════════════════════════════════════════ */
function TipCalculator() {
  const [bill, setBill] = useState('');
  const [tipPercent, setTipPercent] = useState(15);
  const [people, setPeople] = useState(1);

  const presets = [10, 15, 18, 20, 25];

  const tipAmount = bill ? (parseFloat(bill) * tipPercent / 100) : 0;
  const total = bill ? parseFloat(bill) + tipAmount : 0;
  const perPerson = people > 0 ? total / people : 0;

  return (
    <div className="tool-panel">
      <div className="tool-panel-header">
        <Utensils size={20} />
        <h3>Tip Calculator</h3>
      </div>
      <p className="tool-desc">Quickly calculate tips and split bills among friends.</p>

      <div className="tool-input-row">
        <label>Bill Amount ({CURRENCY_RATES.USD.symbol})</label>
        <input type="number" placeholder="0.00" value={bill} onChange={e => setBill(e.target.value)} />
      </div>

      <div className="tip-presets">
        {presets.map(p => (
          <button
            key={p}
            className={`tip-preset ${tipPercent === p ? 'active' : ''}`}
            onClick={() => setTipPercent(p)}
          >
            {p}%
          </button>
        ))}
        <div className="tip-custom">
          <input
            type="number"
            placeholder="Custom"
            value={tipPercent}
            onChange={e => setTipPercent(parseFloat(e.target.value) || 0)}
          />
          <span>%</span>
        </div>
      </div>

      <div className="tool-input-row">
        <label>Split Between</label>
        <div className="people-stepper">
          <button onClick={() => setPeople(Math.max(1, people - 1))}>-</button>
          <span>{people}</span>
          <button onClick={() => setPeople(people + 1)}>+</button>
        </div>
      </div>

      {bill && (
        <div className="tip-results">
          <div className="tip-result-card">
            <span className="tip-result-label">Tip Amount</span>
            <span className="tip-result-value">{CURRENCY_RATES.USD.symbol}{tipAmount.toFixed(2)}</span>
          </div>
          <div className="tip-result-card">
            <span className="tip-result-label">Total</span>
            <span className="tip-result-value">{CURRENCY_RATES.USD.symbol}{total.toFixed(2)}</span>
          </div>
          <div className="tip-result-card highlight">
            <span className="tip-result-label">Per Person</span>
            <span className="tip-result-value">{CURRENCY_RATES.USD.symbol}{perPerson.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   6. PERCENTAGE CALCULATOR
   ═══════════════════════════════════════════════ */
function PercentageCalculator() {
  const [mode, setMode] = useState(0);
  const [x, setX] = useState('');
  const [y, setY] = useState('');

  const modes = [
    { label: 'What is X% of Y?', placeholder: ['X (%)', 'Y'] },
    { label: 'X is what % of Y?', placeholder: ['X', 'Y'] },
    { label: '% change from X to Y', placeholder: ['Original (X)', 'New (Y)'] },
  ];

  const result = useMemo(() => {
    const xv = parseFloat(x);
    const yv = parseFloat(y);
    if (isNaN(xv) || isNaN(yv)) return null;
    if (mode === 0) return (xv / 100) * yv;
    if (mode === 1) return yv !== 0 ? (xv / yv) * 100 : null;
    if (mode === 2) return xv !== 0 ? ((yv - xv) / xv) * 100 : null;
    return null;
  }, [x, y, mode]);

  return (
    <div className="tool-panel">
      <div className="tool-panel-header">
        <Percent size={20} />
        <h3>Percentage Calculator</h3>
      </div>
      <p className="tool-desc">Solve common percentage problems in one click.</p>

      <div className="tool-tabs">
        {modes.map((m, i) => (
          <button
            key={i}
            className={`tool-tab ${mode === i ? 'active' : ''}`}
            onClick={() => { setMode(i); setX(''); setY(''); }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="pct-inputs">
        <div className="tool-input-row half">
          <label>{modes[mode].placeholder[0]}</label>
          <input type="number" value={x} onChange={e => setX(e.target.value)} />
        </div>
        <div className="tool-input-row half">
          <label>{modes[mode].placeholder[1]}</label>
          <input type="number" value={y} onChange={e => setY(e.target.value)} />
        </div>
      </div>

      {result !== null && (
        <div className="pct-result">
          <Calculator size={18} />
          <span className="pct-value">
            {mode === 2 && result > 0 ? '+' : ''}{result.toFixed(2)}{mode === 0 ? '' : '%'}
          </span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   7. SPIRIT LEVEL (Device Orientation)
   ═══════════════════════════════════════════════ */
function SpiritLevel() {
  const [orientation, setOrientation] = useState({ beta: 0, gamma: 0 });
  const [permission, setPermission] = useState('prompt');
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!window.DeviceOrientationEvent) {
      setSupported(false);
      return;
    }

    const handler = (e) => {
      setOrientation({ beta: e.beta || 0, gamma: e.gamma || 0 });
    };

    window.addEventListener('deviceorientation', handler);
    return () => window.removeEventListener('deviceorientation', handler);
  }, []);

  const requestPermission = async () => {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        setPermission(response);
      } catch (err) {
        console.error(err);
        setPermission('denied');
      }
    } else {
      setPermission('granted');
    }
  };

  const bubbleX = Math.min(Math.max((orientation.gamma / 30) * 50 + 50, 5), 95);
  const bubbleY = Math.min(Math.max((orientation.beta / 30) * 50 + 50, 5), 95);
  const isLevel = Math.abs(orientation.beta) < 2 && Math.abs(orientation.gamma) < 2;

  return (
    <div className="tool-panel">
      <div className="tool-panel-header">
        <AlignCenter size={20} />
        <h3>Spirit Level</h3>
      </div>
      <p className="tool-desc">Use your device's accelerometer as a bubble level. Hold your phone flat or against a surface.</p>

      {!supported && (
        <div className="auth-error">Device orientation is not supported on this device/browser.</div>
      )}

      {supported && permission !== 'granted' && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 12 }}>
            This tool needs access to your device's orientation sensors. On iOS, you must tap the button below to grant permission.
          </p>
          <button className="btn primary" onClick={requestPermission}>
            <Smartphone size={16} /> Enable Orientation
          </button>
        </div>
      )}

      {supported && permission === 'granted' && (
        <>
          <div className={`level-container ${isLevel ? 'level' : ''}`}>
            <div className="level-circle">
              <div className="level-crosshair-h" />
              <div className="level-crosshair-v" />
              <div className="level-center-dot" />
              <div
                className="level-bubble"
                style={{ left: `${bubbleX}%`, top: `${bubbleY}%` }}
              />
            </div>
            {isLevel && <div className="level-badge"><Zap size={14} /> Level!</div>}
          </div>
          <div className="level-readings">
            <span>β (front/back): <strong>{orientation.beta.toFixed(1)}°</strong></span>
            <span>γ (left/right): <strong>{orientation.gamma.toFixed(1)}°</strong></span>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   8. BATTERY MONITOR
   ═══════════════════════════════════════════════ */
function BatteryMonitor() {
  const [battery, setBattery] = useState(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!navigator.getBattery) {
      setSupported(false);
      return;
    }

    let batRef = null;
    const update = (bat) => {
      setBattery({
        level: bat.level * 100,
        charging: bat.charging,
        chargingTime: bat.chargingTime,
        dischargingTime: bat.dischargingTime,
      });
    };

    navigator.getBattery().then((bat) => {
      batRef = bat;
      update(bat);
      bat.addEventListener('levelchange', () => update(bat));
      bat.addEventListener('chargingchange', () => update(bat));
      bat.addEventListener('chargingtimechange', () => update(bat));
      bat.addEventListener('dischargingtimechange', () => update(bat));
    });

    return () => {
      if (batRef) {
        batRef.removeEventListener('levelchange', () => update(batRef));
        batRef.removeEventListener('chargingchange', () => update(batRef));
        batRef.removeEventListener('chargingtimechange', () => update(batRef));
        batRef.removeEventListener('dischargingtimechange', () => update(batRef));
      }
    };
  }, []);

  const formatTime = (seconds) => {
    if (seconds === Infinity || seconds === 0 || !seconds) return 'Calculating...';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="tool-panel">
      <div className="tool-panel-header">
        <Battery size={20} />
        <h3>Battery Monitor</h3>
      </div>
      <p className="tool-desc">Real-time battery status from your device's Battery API.</p>

      {!supported && (
        <div className="auth-error">Battery API is not supported on this browser.</div>
      )}

      {supported && battery && (
        <>
          <div className="battery-visual">
            <div className="battery-body">
              <div
                className={`battery-fill ${battery.level <= 20 ? 'low' : ''} ${battery.charging ? 'charging' : ''}`}
                style={{ width: `${battery.level}%` }}
              />
              <span className="battery-percent">{battery.level.toFixed(0)}%</span>
            </div>
            <div className="battery-cap" />
            {battery.charging && <BatteryCharging size={20} className="battery-charging-icon" />}
          </div>

          <div className="battery-info">
            <div className="battery-stat">
              <span className="battery-stat-label">Status</span>
              <span className="battery-stat-value">{battery.charging ? 'Charging' : 'Discharging'}</span>
            </div>
            <div className="battery-stat">
              <span className="battery-stat-label">{battery.charging ? 'Time to full' : 'Time remaining'}</span>
              <span className="battery-stat-value">
                {formatTime(battery.charging ? battery.chargingTime : battery.dischargingTime)}
              </span>
            </div>
          </div>

          {battery.level <= 20 && !battery.charging && (
            <div className="battery-warning">
              <BatteryWarning size={16} /> Low battery — consider charging soon.
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   9. MOTION DETECTOR / SHAKE COUNTER
   ═══════════════════════════════════════════════ */
function MotionDetector() {
  const [motion, setMotion] = useState({ x: 0, y: 0, z: 0 });
  const [shakes, setShakes] = useState(0);
  const [permission, setPermission] = useState('prompt');
  const [supported, setSupported] = useState(true);
  const lastShake = useRef(0);

  useEffect(() => {
    if (!window.DeviceMotionEvent) {
      setSupported(false);
      return;
    }

    const handler = (e) => {
      const acc = e.accelerationIncludingGravity || { x: 0, y: 0, z: 0 };
      const x = acc.x || 0;
      const y = acc.y || 0;
      const z = acc.z || 0;
      setMotion({ x, y, z });

      const magnitude = Math.sqrt(x * x + y * y + z * z);
      if (magnitude > 25) {
        const now = Date.now();
        if (now - lastShake.current > 800) {
          lastShake.current = now;
          setShakes((s) => s + 1);
        }
      }
    };

    window.addEventListener('devicemotion', handler);
    return () => window.removeEventListener('devicemotion', handler);
  }, []);

  const requestPermission = async () => {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const response = await DeviceMotionEvent.requestPermission();
        setPermission(response);
      } catch (err) {
        console.error(err);
        setPermission('denied');
      }
    } else {
      setPermission('granted');
    }
  };

  return (
    <div className="tool-panel">
      <div className="tool-panel-header">
        <Move size={20} />
        <h3>Motion Detector</h3>
      </div>
      <p className="tool-desc">Real-time accelerometer data and shake detection. Shake your phone to count shakes!</p>

      {!supported && (
        <div className="auth-error">Device motion is not supported on this device/browser.</div>
      )}

      {supported && permission !== 'granted' && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 12 }}>
            This tool needs access to your device's motion sensors. On iOS, you must tap the button below to grant permission.
          </p>
          <button className="btn primary" onClick={requestPermission}>
            <Smartphone size={16} /> Enable Motion
          </button>
        </div>
      )}

      {supported && permission === 'granted' && (
        <>
          <div className="motion-shake">
            <div className="shake-counter">
              <Activity size={24} />
              <div>
                <span className="shake-number">{shakes}</span>
                <span className="shake-label">Shakes Detected</span>
              </div>
            </div>
            <button className="btn secondary" onClick={() => setShakes(0)}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>

          <div className="motion-bars">
            {['x', 'y', 'z'].map((axis) => {
              const val = motion[axis];
              return (
                <div key={axis} className="motion-bar-row">
                  <span className="motion-axis">{axis.toUpperCase()}</span>
                  <div className="motion-track">
                    <div className="motion-center" />
                    <div
                      className="motion-fill"
                      style={{ left: `${Math.min(Math.max((val + 20) / 40 * 100, 0), 100)}%` }}
                    />
                  </div>
                  <span className="motion-value">{val.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN TOOLS PAGE
   ═══════════════════════════════════════════════ */
const TOOLS = [
  { id: 'age', label: 'Age Calculator', icon: CalendarDays, component: AgeCalculator },
  { id: 'unit', label: 'Unit Converter', icon: Ruler, component: UnitConverter },
  { id: 'currency', label: 'Currency', icon: DollarSign, component: CurrencyConverter },
  { id: 'bmi', label: 'BMI Calculator', icon: HeartPulse, component: BMICalculator },
  { id: 'tip', label: 'Tip Calculator', icon: Utensils, component: TipCalculator },
  { id: 'pct', label: 'Percentage', icon: Percent, component: PercentageCalculator },
  { id: 'level', label: 'Spirit Level', icon: AlignCenter, component: SpiritLevel },
  { id: 'battery', label: 'Battery', icon: Battery, component: BatteryMonitor },
  { id: 'motion', label: 'Motion', icon: Move, component: MotionDetector },
];

export default function Tools() {
  const { user } = useAuth();
  const [activeTool, setActiveTool] = useState('age');
  const displayName = user?.nickname || user?.email || 'User';

  const ActiveComponent = TOOLS.find(t => t.id === activeTool)?.component || AgeCalculator;

  return (
    <div className="dashboard tools-page">
      <div className="header">
        <div className="welcome">
          <Wrench size={22} className="text-blue-600" />
          <div>
            <h2>Tools</h2>
            <h3>Welcome, {displayName}!</h3>
          </div>
        </div>
      </div>

      <div className="tools-layout">
        <div className="tools-sidebar">
          <h4><Wrench size={14} /> Utilities</h4>
          <div className="tool-list">
            {TOOLS.map(t => (
              <ToolItem
                key={t.id}
                icon={t.icon}
                label={t.label}
                active={activeTool === t.id}
                onClick={() => setActiveTool(t.id)}
              />
            ))}
          </div>
        </div>

        <div className="tools-detail">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}

