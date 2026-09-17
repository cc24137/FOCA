import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/header';
import DatePicker from '../../components/date-picker';
import SelectCustomizado from '../../components/select-customizado';
import './cadastro-aula.css';
import { useState, useEffect } from 'react'; 
import api from '../../services/api';

export default function CadastroAula() {
  const navigate = useNavigate();
  const location = useLocation();

  const { idRelacao, nomeTurma, nomeDisciplina, instituicao, quantidadeAlunos } = location.state || {};

  const [classificacoes, setClassificacoes] = useState([]);
  const [classificacao, setClassificacao] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const dd = selectedDate ? String(selectedDate.getDate()).padStart(2, '0') : '';
  const mm = selectedDate ? String(selectedDate.getMonth() + 1).padStart(2, '0') : '';
  const yyyy = selectedDate ? String(selectedDate.getFullYear()) : '';

  useEffect(() => {
    async function loadClassificacoes() {
      try {
        const response = await api.get('/aula/classificacao-conteudo');
        if (response.data && response.data.length > 0) {
          setClassificacoes(response.data);
          setClassificacao(response.data[0].idClassificacaoConteudo);
        }
      } catch (error) {
        console.error('Erro ao carregar classificações:', error);
      }
    }

    loadClassificacoes();
  }, []);

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  async function formSubmit(e) {
    if (e) e.preventDefault();

    if (!selectedDate) {
        alert('Por favor, selecione a data da aula.');
        return;
    }

    if (!conteudo.trim()) {
        alert('Por favor, descreva o conteúdo da aula.');
        return;
    }

    setLoading(true);

    try {
        // Formata a data para o padrão YYYY-MM-DD aceito pela API
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateFormatted = `${year}-${month}-${day}`;

        const payload = {
            classSubjectTeacherId: idRelacao,
            date: dateFormatted,
            idContentClassification: classificacao,
            content: conteudo
        };

        const response = await api.post('/aula/criar', payload);

        if (response.status === 201 || response.status === 200) {
        navigate('/analise/upload', {
            state: {
            aulaCadastrada: response.data,
            idRelacao,
            nomeTurma,
            nomeDisciplina,
            instituicao,
            quantidadeAlunos,
            data: selectedDate,
            classificacao,
            conteudo
            }
        });
        } else {
        alert('Erro ao cadastrar a aula.');
        }
    } catch (error) {
        console.error('Erro no cadastro da aula:', error?.response?.data || error);
        const mensagem = error?.response?.data?.error || error?.response?.data?.message || 'Erro ao cadastrar aula.';
        alert(Array.isArray(mensagem) ? mensagem.join('\n') : mensagem);
    } finally {
        setLoading(false);
    }
    }

  return (
    <div className='upload-video-body'>
      <Header
        routes={[
          { textButton: 'Início', routeButton: '/inicial-professor' },
          { textButton: 'Sobre o Projeto', routeButton: '/' },
          { textButton: 'Perfil', routeButton: '/editar-dados' }
        ]}
      />

      <main className='upload-video-content'>
        <div className='cadastro-aula-card'>
          <div className='cadastro-aula-header'>
            <h2>Cadastro de Nova Aula</h2>

            <div className='info-badges'>
              <span className='badge'>
                <strong>Turma:</strong> {nomeTurma || 'Não informada'}
              </span>
              <span className='badge'>
                <strong>Disciplina:</strong> {nomeDisciplina || 'Não informada'}
              </span>
            </div>
          </div>

          <form className='cadastro-aula-form' onSubmit={formSubmit}>
            <div className='form-grid'>
              {/* Seletor de Data */}
              <div className='form-group'>
                <label className='form-label'>Data da aula</label>
                <div
                  className='date-inputs-wrapper'
                  onClick={() => setShowDatePicker((prev) => !prev)}
                  title='Clique para selecionar a data no calendário'
                >
                  <div className='date-inputs'>
                    <input
                      type='text'
                      className={`dd ${dd ? 'active' : ''}`}
                      placeholder='DD'
                      value={dd}
                      readOnly
                    />
                    <span>/</span>
                    <input
                      type='text'
                      className={`mm ${mm ? 'active' : ''}`}
                      placeholder='MM'
                      value={mm}
                      readOnly
                    />
                    <span>/</span>
                    <input
                      type='text'
                      className={`yyyy ${yyyy ? 'active' : ''}`}
                      placeholder='AAAA'
                      value={yyyy}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Classificação */}
              <div className='form-group'>
                <label className='form-label'>Classificação da aula</label>
                <SelectCustomizado
                  placeholder='Selecione uma classificação...'
                  value={classificacao}
                  onChange={(novoId) => setClassificacao(novoId)}
                  options={classificacoes.map((item) => ({
                    value: item.idClassificacaoConteudo,
                    label: item.nomeClassificacaoConteudo,
                    title: item.descricaoClassificacaoConteudo
                  }))}
                />
              </div>
            </div>

            {/* Conteúdo Expandido (Textarea) */}
            <div className='form-group full-width'>
              <label className='form-label'>Conteúdo da aula</label>
              <textarea
                className='textarea-conteudo'
                rows='5'
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                placeholder='Descreva os tópicos, assuntos ministrados e observações relevantes sobre esta aula...'
              />
            </div>

            <div className='form-actions'>
              <button type='submit' className='btn-submit-aula' disabled={loading}>
                {loading ? 'Cadastrando...' : 'Cadastrar e Continuar'}
              </button>
            </div>
          </form>
        </div>

        {showDatePicker && (
          <div className='datepicker-popover-backdrop' onClick={() => setShowDatePicker(false)}>
            <div className='datepicker-popover-content' onClick={(e) => e.stopPropagation()}>
              <DatePicker selectedDate={selectedDate} onSelectDate={handleSelectDate} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}