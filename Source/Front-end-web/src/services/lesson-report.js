import api from './api';
import { analysisPoints } from '../utils/report-data';

export class LessonReportError extends Error {}

export async function getLessonReportData(idAula, { signal } = {}) {
  const id = Number(idAula);
  if (!Number.isSafeInteger(id) || id <= 0) throw new LessonReportError('Aula inválida para gerar o relatório.');

  const [readingsResponse, feedbackResponse] = await Promise.all([
    api.get(`/leituraAtencao/${id}`, { signal }),
    api.get(`/feedback/aula/${id}/completo`, { signal }),
  ]);
  const readings = readingsResponse.data;
  if (!Array.isArray(readings)) throw new LessonReportError('Não foi possível interpretar as leituras salvas desta aula.');
  if (!readings.length) throw new LessonReportError('Esta aula não possui leituras de atenção salvas para gerar o relatório.');
  if (readings.some(reading => Number(reading?.idAula) !== id)) {
    throw new LessonReportError('As leituras recebidas não correspondem à aula selecionada.');
  }
  const pontos = analysisPoints(readings.map(reading => ({
    segundo_video: reading.segundoVideo,
    media_momento: reading.indiceAtencao,
  })));
  if (pontos.length !== readings.length) throw new LessonReportError('As leituras desta aula contêm dados inválidos.');

  const feedback = feedbackResponse.data;
  if (!feedback?.lesson || typeof feedback.lesson !== 'object' || Array.isArray(feedback.lesson)
    || !Array.isArray(feedback.lesson.items) || !Array.isArray(feedback.lesson.recommendations)) {
    throw new LessonReportError('Não foi possível interpretar os feedbacks desta aula. Tente novamente.');
  }
  return { pontos, feedback };
}
