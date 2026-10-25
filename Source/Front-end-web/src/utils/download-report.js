import html2pdf from 'html2pdf.js';

export async function downloadReport(element, filename) {
  await document.fonts.ready;
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await Promise.all(Array.from(element.querySelectorAll('img'), image => image.decode()));
  const report = element.cloneNode(true);

  await html2pdf().set({
    margin: 10,
    filename,
    pagebreak: {
      mode: ['css', 'legacy'],
      before: ['.statistics-report__timeline', '.report-page-break'],
      avoid: ['.statistics-report__metrics', '.statistics-report__chart', '.report-summary-grid', '.report-chart', '.report-table tr', '.statistics-report__table tr', '.report-feedback-item', '.report-feedback-section', '.report-interpretation'],
    },
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      onclone: clonedDocument => {
        // As cores precisam acompanhar o SVG quando ele é rasterizado separadamente.
        clonedDocument.querySelectorAll('.report-paper svg, .report-paper svg [fill], .report-paper svg [stroke]').forEach(svgElement => {
          const styles = clonedDocument.defaultView.getComputedStyle(svgElement);
          for (const attribute of ['fill', 'stroke']) {
            const paint = svgElement.getAttribute(attribute);
            if (paint?.includes('var(') || paint === 'currentColor') {
              svgElement.setAttribute(attribute, styles.getPropertyValue(attribute));
            }
          }
        });
      },
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  }).from(report).toPdf().get('pdf').then(pdf => {
    const pages = pdf.internal.getNumberOfPages();
    for (let page = 1; page <= pages; page++) {
      pdf.setPage(page);
      pdf.setFontSize(9);
      pdf.text(`FOCA - ${page}/${pages}`, 105, 292, { align: 'center' });
    }
  }).save();
}
