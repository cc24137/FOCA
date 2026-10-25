import AnalysisDisclaimer from '../analysis-disclaimer';
import { ANALYSIS_MODELS } from '../../utils/analysis-models';
import './analysis-model-help.css';

export default function AnalysisModelHelp() {
  return (
    <AnalysisDisclaimer title="Diferenças entre os modelos"
      label="Informações sobre Foca Fast e Foca Strong" align="end">
      <dl className="analysis-model-help__list">
        {ANALYSIS_MODELS.map(model => (
          <div key={model.value}>
            <dt>{model.label}</dt>
            <dd>{model.description}</dd>
          </div>
        ))}
      </dl>
    </AnalysisDisclaimer>
  );
}
