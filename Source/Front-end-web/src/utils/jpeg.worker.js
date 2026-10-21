let queue = Promise.resolve();
let canvas = null;
let context = null;

// Serializar impede alterar o canvas enquanto o JPEG anterior é gerado.
self.onmessage = ({ data }) => {
  if (data.type === 'init') {
    self.postMessage({ type: 'ready', supported: typeof OffscreenCanvas !== 'undefined' && typeof OffscreenCanvas.prototype.convertToBlob === 'function' });
    return;
  }
  if (data.type !== 'encode') return;
  queue = queue.then(async () => {
    const { id, bitmap, quality } = data;
    let closed = false;
    try {
      if (!canvas) { canvas = new OffscreenCanvas(bitmap.width, bitmap.height); context = canvas.getContext('2d'); }
      if (!context) throw new Error('Canvas 2D indisponível no Worker.');
      if (canvas.width !== bitmap.width) canvas.width = bitmap.width;
      if (canvas.height !== bitmap.height) canvas.height = bitmap.height;
      context.drawImage(bitmap, 0, 0);
      bitmap.close(); closed = true;
      const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
      if (blob.type !== 'image/jpeg') throw new Error('O navegador não gerou um JPEG.');
      self.postMessage({ type: 'result', id, blob });
    } catch (error) {
      self.postMessage({ type: 'failure', id, message: error.message || 'Falha ao gerar JPEG.' });
    } finally { if (!closed) bitmap.close(); }
  });
};
