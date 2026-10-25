export const ANALYSIS_MODELS = [
  {
    value: 'false',
    label: 'Foca Fast',
    description: 'Mais rápido e leve. Prioriza a velocidade de processamento.',
  },
  {
    value: 'true',
    label: 'Foca Strong',
    description: 'Modelo mais robusto, que exige mais processamento e pode levar mais tempo.',
  },
];

export function analysisModelName(value) {
  return ANALYSIS_MODELS[value === true || value === 'true' ? 1 : 0].label;
}

export function analysisModelDescription(value) {
  const model = ANALYSIS_MODELS[value === true || value === 'true' ? 1 : 0];
  return `${model.label}: ${model.description}`;
}
