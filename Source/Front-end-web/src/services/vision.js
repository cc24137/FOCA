export const PUBLIC_FRAMES_URL = 'https://foca-ai-api.onrender.com/processar-frames';
const REALTIME_URL = 'http://127.0.0.1:8000/processar-frame-tempo-real/';

export function createRealtimeRequest({ frame, model, interval, signal, isDemo = false }) {
  if (isDemo) {
    const body = new FormData();
    body.append('usar_modelo_melhor', String(model));
    body.append('intervalo_segundos', String(interval));
    body.append('frames', frame, 'frame.jpg');
    return { url: PUBLIC_FRAMES_URL, options: { method: 'POST', body, signal, cache: 'no-store' } };
  }
  const url = new URL(REALTIME_URL);
  url.searchParams.set('usar_modelo_melhor', String(model));
  return { url, options: { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: frame, signal, cache: 'no-store' } };
}
