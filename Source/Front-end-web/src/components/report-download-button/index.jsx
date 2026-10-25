import { useRef, useState } from 'react';
import { useToast } from '../toast';
import { downloadReport } from '../../utils/download-report';
import './report-download-button.css';

export default function ReportDownloadButton({ reportRef, filename, disabled = false, className = '', title }) {
  const { showToast } = useToast();
  const [exporting, setExporting] = useState(false);
  const exportingRef = useRef(false);

  const handleDownload = async () => {
    if (disabled || exportingRef.current || !reportRef.current) return;
    exportingRef.current = true;
    setExporting(true);
    try {
      await downloadReport(reportRef.current, filename);
      showToast('Relatório PDF gerado com sucesso!', { type: 'success' });
    } catch (error) {
      console.error('Erro ao exportar o relatório PDF:', error);
      showToast('Não foi possível gerar o relatório PDF. Tente novamente.', { type: 'error' });
    } finally {
      exportingRef.current = false;
      setExporting(false);
    }
  };

  return (
    <button type="button" className={`report-download-button ${className}`} onClick={handleDownload}
      disabled={disabled || exporting} aria-busy={exporting} title={title}>
      {exporting ? 'Gerando PDF...' : 'Baixar relatório PDF'}
    </button>
  );
}
