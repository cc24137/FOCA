export function unificarLinhasDoTempo(listaDeVideos) {
  const mapaDeTempo = {};


  listaDeVideos.forEach((video) => {
    const videoKey = video.id;

    video.data.forEach((ponto) => {
      const seg = ponto.segundos;

      if (!mapaDeTempo[seg]) {
        mapaDeTempo[seg] = {
          segundos: seg,
          tempoFormatado: new Date(seg * 1000).toISOString().substring(14, 19)
        };
      }

      mapaDeTempo[seg][videoKey] = ponto.temp ?? ponto.value;
    });
  });

  const linhaDoTempoOrdenada = Object.values(mapaDeTempo).sort(
    (a, b) => a.segundos - b.segundos
  );

  return linhaDoTempoOrdenada.map((ponto) => {
    listaDeVideos.forEach((video) => {
      if (ponto[video.id] === undefined) {
        ponto[video.id] = null;
      }
    });
    return ponto;
  });
}