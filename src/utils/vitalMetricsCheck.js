/**
 * Threshold-based vital sign risk (mmol/L blood sugar, °C temperature, SpO₂ %, bpm pulse, mmHg BP).
 * Derives aggregate + per-field risks from numeric inputs matching the project's clinical thresholds.
 */

const riskLevels = {
  'low-risk': 0,
  'medium-risk': 1,
  'high-risk': 2,
};

/** Text / UX colors for risk tiers */
export const VITAL_RISK_COLORS = {
  'high-risk': '#dc2626',
  'medium-risk': '#ca8a04',
  'low-risk': '#16a34a',
};

function numOrNull(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** First decimal number found in a string (e.g. "97 %" -> 97, "6.5 mmol/L" -> 6.5) */
export function parseFirstNumericFromString(str) {
  const m = String(str ?? '').replace(/,/g, '.').match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

/** Systolic/diastolic from "130/85", optional units */
export function parseBloodPressureString(str) {
  const match = String(str ?? '').trim().match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return { systolic: null, diastolic: null };
  const systolic = parseInt(match[1], 10);
  const diastolic = parseInt(match[2], 10);
  return {
    systolic: Number.isFinite(systolic) ? systolic : null,
    diastolic: Number.isFinite(diastolic) ? diastolic : null,
  };
}

/**
 * Normalize UI strings / partial API values into numbers for vitalMetricsCheck.
 */
export function coerceVitalsToNumbers({ bp = '', sugar = '', spo2 = '', pulse = '', temp = '' } = {}) {
  const { systolic, diastolic } = parseBloodPressureString(bp);
  return {
    pressureSystolic: systolic,
    pressureDystolic: diastolic,
    bloodSugar: parseFirstNumericFromString(sugar),
    bloodOxygen: parseFirstNumericFromString(spo2),
    pulseRate: parseFirstNumericFromString(pulse),
    temperature: parseFirstNumericFromString(temp),
  };
}

function upgradeFieldRisk(map, field, level) {
  const prev = map[field] || 'low-risk';
  if (riskLevels[level] > riskLevels[prev]) map[field] = level;
}

/**
 * Aggregate check (overall worst vital wins) + severity of each metric.
 * @returns {{ status: string, flaggedVital?: string, fieldRisk: Record<string, string> }}
 */
export function vitalMetricsCheckDetailed(data = {}) {
  const {
    pressureSystolic: psRaw,
    pressureDystolic: pdRaw,
    bloodSugar,
    bloodOxygen,
    temperature,
    pulseRate,
  } = data;

  const pressureSystolic = numOrNull(psRaw);
  const pressureDystolic = numOrNull(pdRaw);

  let status = 'low-risk';
  let flaggedVital;
  const fieldRisk = {};

  const updateStatus = (newStatus, vital) => {
    upgradeFieldRisk(fieldRisk, vital, newStatus);
    if (riskLevels[newStatus] > riskLevels[status]) {
      status = newStatus;
      flaggedVital = vital;
    }
  };

  /* Blood pressure */
  const hasBp = pressureSystolic != null || pressureDystolic != null;
  if (hasBp) {
    const sysHi = pressureSystolic != null && pressureSystolic > 0;
    const diaHi = pressureDystolic != null && pressureDystolic > 0;
    const sys = sysHi ? pressureSystolic : null;
    const dia = diaHi ? pressureDystolic : null;
    const highBp = (sys != null && sys > 180) || (dia != null && dia > 120);
    const medBp = (sys != null && sys > 140) || (dia != null && dia > 90);
    const lowBpCrisis = (sys != null && sys < 90) || (dia != null && dia < 60);
    if (highBp || lowBpCrisis) {
      updateStatus('high-risk', 'blood-pressure');
    } else if (medBp) {
      updateStatus('medium-risk', 'blood-pressure');
    }
  }

  /* Blood sugar (mmol/L) */
  if (bloodSugar != null && Number.isFinite(bloodSugar)) {
    if (bloodSugar > 22.2 || bloodSugar > 13.9) {
      updateStatus('high-risk', 'blood-sugar');
    } else if (bloodSugar > 11.1) {
      updateStatus('medium-risk', 'blood-sugar');
    }
  }

  /* Pulse */
  if (pulseRate != null && Number.isFinite(pulseRate)) {
    if (pulseRate > 100 || pulseRate < 60) {
      updateStatus('high-risk', 'pulse-rate');
    }
  }

  /* Temperature °C — order: fever high, fever medium, hypothermia high, hypothermia medium */
  if (temperature != null && Number.isFinite(temperature)) {
    if (temperature > 40) {
      updateStatus('high-risk', 'temperature');
    } else if (temperature > 38) {
      updateStatus('medium-risk', 'temperature');
    } else if (temperature < 32) {
      updateStatus('high-risk', 'temperature');
    } else if (temperature < 35) {
      updateStatus('medium-risk', 'temperature');
    }
  }

  /* SpO₂ — evaluate serious hypoxemia first */
  if (bloodOxygen != null && Number.isFinite(bloodOxygen)) {
    if (bloodOxygen < 90) {
      updateStatus('high-risk', 'blood-oxygen');
    } else if (bloodOxygen < 95) {
      updateStatus('medium-risk', 'blood-oxygen');
    }
  }

  const out = { status, fieldRisk };
  if (flaggedVital != null) out.flaggedVital = flaggedVital;
  return out;
}

/** API-compatible aggregate result */
export function vitalMetricsCheck(data) {
  const { status, flaggedVital } = vitalMetricsCheckDetailed(data);
  return { status, flaggedVital };
}

/**
 * Risk per UI column key (bp, sugar, spo2, pulse, temp) from raw display strings.
 */
export function getVitalFieldRisksFromRow(row) {
  const metrics = coerceVitalsToNumbers(row || {});
  const { fieldRisk } = vitalMetricsCheckDetailed(metrics);
  return {
    bp: fieldRisk['blood-pressure'] || 'low-risk',
    sugar: fieldRisk['blood-sugar'] || 'low-risk',
    spo2: fieldRisk['blood-oxygen'] || 'low-risk',
    pulse: fieldRisk['pulse-rate'] || 'low-risk',
    temp: fieldRisk['temperature'] || 'low-risk',
  };
}

export function riskColor(level) {
  return VITAL_RISK_COLORS[level] || VITAL_RISK_COLORS['low-risk'];
}
