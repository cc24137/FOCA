export function attentionValue(value) {
  if (typeof value !== 'number' && (typeof value !== 'string' || value.trim() === '')) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 && numeric <= 100 ? numeric : null;
}

export const hasAnalysisResult = lesson => attentionValue(lesson.media_atencao_total) != null;

export function analysisPoints(points) {
  return (Array.isArray(points) ? points : []).flatMap(point => {
    const time = point?.segundo_video;
    const attention = attentionValue(point?.media_momento);
    if ((typeof time !== 'number' && (typeof time !== 'string' || time.trim() === ''))
      || !Number.isFinite(Number(time)) || Number(time) < 0 || attention == null) return [];
    return [{ ...point, segundo_video: Number(time), media_momento: attention }];
  }).sort((first, second) => first.segundo_video - second.segundo_video);
}

export const formatReportPercent = value => `${Number(value).toLocaleString('pt-BR', {
  minimumFractionDigits: 1, maximumFractionDigits: 1,
})}%`;

export function formatReportTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  return `${String(minutes).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function formatReportDate(value) {
  const date = /^\d{4}-\d{2}-\d{2}/.exec(String(value ?? ''))?.[0];
  return date ? date.split('-').reverse().join('/') : 'Não informada';
}

export function lessonReportInformation({ idAula, dadosAula = {}, professor, origem, arquivo, modelo, intervalo }) {
  return [
    { label: 'Origem', valor: origem },
    { label: 'Aula', valor: idAula != null ? `#${idAula}` : null },
    { label: 'Turma', valor: dadosAula.nomeTurma },
    { label: 'Disciplina', valor: dadosAula.nomeDisciplina },
    { label: 'Professor', valor: professor },
    { label: 'Data da aula', valor: dadosAula.dataAula ? formatReportDate(dadosAula.dataAula) : null },
    { label: 'Conteúdo', valor: dadosAula.conteudo },
    { label: 'Arquivo', valor: arquivo },
    { label: 'Modelo', valor: modelo },
    { label: 'Intervalo configurado', valor: intervalo != null ? `${intervalo} s` : null },
  ].filter(item => item.valor != null && item.valor !== '');
}
