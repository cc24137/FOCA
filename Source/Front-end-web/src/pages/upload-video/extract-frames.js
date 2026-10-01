export const MAX_FRAMES = 1000;

export function calculateFramePlan(duration, intervalInSeconds) {
  const interval = Number(intervalInSeconds);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Duração do vídeo inválida.');
  if (!Number.isInteger(interval) || interval < 1) throw new Error('Informe um intervalo inteiro de pelo menos 1 segundo.');
  return {
    count: Math.ceil(duration / interval),
    minimumInterval: Math.max(1, Math.ceil(duration / MAX_FRAMES)),
  };
}

function frameLimitError(plan) {
  const error = new Error(
    `O intervalo escolhido geraria ${plan.count.toLocaleString('pt-BR')} frames. ` +
    `O limite é de ${MAX_FRAMES} frames por vídeo. ` +
    `Altere o intervalo para pelo menos ${plan.minimumInterval} segundos e inicie novamente.`
  );
  error.code = 'FRAME_LIMIT';
  return error;
}

// Retorna null quando o navegador não consegue carregar/utilizar o Worker.
async function createEncoder() {
  if (typeof Worker === 'undefined' || typeof createImageBitmap !== 'function') return null;
  let worker;
  try { worker = new Worker(new URL('./jpeg.worker.js', import.meta.url), { type: 'module' }); }
  catch { return null; }
  const supported = await new Promise((resolve) => {
    const timer = setTimeout(() => finish(false), 10000);
    const finish = (value) => { clearTimeout(timer); worker.onmessage = null; worker.onerror = null; resolve(value); };
    worker.onmessage = ({ data }) => { if (data.type === 'ready') finish(data.supported); };
    worker.onerror = (event) => { event.preventDefault(); finish(false); };
    try { worker.postMessage({ type: 'init' }); } catch { finish(false); }
  });
  if (!supported) { worker.terminate(); return null; }
  const jobs = new Map();
  let failure = null;
  const rejectAll = (error) => {
    failure = error;
    for (const job of jobs.values()) { clearTimeout(job.timer); job.reject(error); }
    jobs.clear();
  };
  worker.onmessage = ({ data }) => {
    const job = jobs.get(data.id);
    if (!job) return;
    clearTimeout(job.timer); jobs.delete(data.id);
    if (data.type === 'result') job.resolve(data.blob);
    else job.reject(new Error(data.message || 'Falha ao gerar JPEG.'));
  };
  worker.onerror = (event) => { event.preventDefault(); rejectAll(new Error(event.message || 'Falha no Worker.')); };
  worker.onmessageerror = () => rejectAll(new Error('Resposta inválida do Worker.'));
  return {
    encode(id, bitmap, quality) {
      if (failure) { bitmap.close(); return Promise.reject(failure); }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { jobs.delete(id); reject(new Error('Tempo excedido ao gerar JPEG.')); }, 60000);
        jobs.set(id, { resolve, reject, timer });
        try { worker.postMessage({ type: 'encode', id, bitmap, quality }, [bitmap]); }
        catch (error) { clearTimeout(timer); jobs.delete(id); bitmap.close(); reject(error); }
      });
    },
    close() { worker.terminate(); rejectAll(new Error('Extração finalizada.')); },
  };
}

export async function extractFrames(videoFile, intervalInSeconds, options = {}) {
  const { maxWidth = 1280, quality = 0.8, maxInFlight = 2, onProgress } = options;
  const interval = Number(intervalInSeconds);
  if (!Number.isInteger(interval) || interval < 1) throw new Error('Informe um intervalo inteiro de pelo menos 1 segundo.');
  if (maxWidth !== null && (!Number.isFinite(maxWidth) || maxWidth < 1)) throw new Error('Largura inválida.');
  if (!Number.isFinite(quality) || quality < 0 || quality > 1) throw new Error('Qualidade inválida.');
  if (!Number.isInteger(maxInFlight) || maxInFlight < 1 || maxInFlight > 4) throw new Error('Fila inválida.');
  const video = document.createElement('video');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível.');
  const url = URL.createObjectURL(videoFile);
  let encoder = null;
  let bitmap = null;
  let fatal = null;
  let completed = 0;
  const tasks = new Set();
  const frames = [];
  const waitVideo = (name, action) => new Promise((resolve, reject) => {
    const cleanup = () => { clearTimeout(timer); video.removeEventListener(name, success); video.removeEventListener('error', failure); };
    const success = () => { cleanup(); resolve(); };
    const failure = () => { cleanup(); reject(new Error(`Não foi possível carregar o vídeo (código ${video.error?.code ?? '?'}).`)); };
    const timer = setTimeout(() => { cleanup(); reject(new Error(`Tempo excedido ao carregar o vídeo: ${name}.`)); }, 60000);
    video.addEventListener(name, success); video.addEventListener('error', failure);
    try { action?.(); } catch (error) { cleanup(); reject(error); }
  });
  const toJpeg = () => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Tempo excedido ao gerar JPEG.')), 60000);
    try {
      canvas.toBlob((blob) => {
        clearTimeout(timer);
        if (blob) resolve(blob); else reject(new Error('Não foi possível gerar JPEG.'));
      }, 'image/jpeg', quality);
    } catch (error) { clearTimeout(timer); reject(error); }
  });
  video.muted = true; video.playsInline = true; video.preload = 'auto';
  try {
    // Valida a quantidade ANTES de iniciar o Worker ou gerar qualquer JPEG.
    await waitVideo('loadedmetadata', () => { video.src = url; video.load(); });
    const plan = calculateFramePlan(video.duration, interval);
    if (plan.count > MAX_FRAMES) throw frameLimitError(plan);
    if (!video.videoWidth || !video.videoHeight) throw new Error('Resolução do vídeo inválida.');
    const scale = maxWidth == null ? 1 : Math.min(1, maxWidth / video.videoWidth);
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    if (video.readyState < 2) await waitVideo('loadeddata');
    encoder = await createEncoder();
    const queueLimit = encoder ? maxInFlight : 1;
    for (let index = 0; index < plan.count; index += 1) {
      if (fatal) throw fatal;
      if (tasks.size >= queueLimit) { await Promise.race(tasks); if (fatal) throw fatal; }
      const target = index * interval;
      if (index !== 0 || video.currentTime !== target) await waitVideo('seeked', () => { video.currentTime = target; });
      if (video.readyState < 2) await waitVideo('loadeddata');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      let result;
      if (encoder) {
        bitmap = await createImageBitmap(canvas);
        if (fatal) throw fatal;
        result = encoder.encode(index, bitmap, quality);
        bitmap = null;
      } else result = toJpeg();
      let task;
      task = result.then((blob) => {
        frames[index] = blob;
        completed += 1;
        onProgress?.(completed, plan.count);
      }).catch((error) => { fatal ||= error; }).then(() => tasks.delete(task));
      tasks.add(task);
    }
    await Promise.all(tasks);
    if (fatal) throw fatal;
    if (completed !== plan.count) throw new Error('Extração incompleta.');
    return frames;
  } finally {
    bitmap?.close();
    encoder?.close();
    await Promise.all(tasks);
    video.pause(); video.removeAttribute('src'); video.load();
    URL.revokeObjectURL(url);
    canvas.width = 0; canvas.height = 0;
  }
}
