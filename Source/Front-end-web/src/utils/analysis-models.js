export const ANALYSIS_MODELS = [
  { value: 'false', label: 'Foca Fast' },
  { value: 'true', label: 'Foca Strong' },
];

export function analysisModelName(value) {
  return ANALYSIS_MODELS[value === true || value === 'true' ? 1 : 0].label;
}
