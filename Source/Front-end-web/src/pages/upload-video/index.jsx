import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/header';
import DatePicker from '../../components/date-picker';
import AreaUploadVideo from '../../components/area-upload-video';
import SelectCustomizado from '../../components/select-customizado';
import './upload-video.css';
import { useState, useEffect, useRef } from 'react'; 
import api from '../../services/api';
import IconTexto from '../../assets/file-text.svg?react';
import html2pdf from 'html2pdf.js';
import GenericLineChart from '../../components/time-vs-value-chart';
import ReportTemplate from '../../components/report-template'; 

const tempLogs = [
    { timestamp: '2026-08-13T08:00:00Z', temp: 45 },
    { timestamp: '2026-08-13T09:00:00Z', temp: 58 },
    { timestamp: '2026-08-13T10:00:00Z', temp: 52 },
    { timestamp: '2026-08-13T11:00:00Z', temp: 60 },
    { timestamp: '2026-08-13T12:00:00Z', temp: 55 },
    { timestamp: '2026-08-13T13:00:00Z', temp: 62 },
    { timestamp: '2026-08-13T14:00:00Z', temp: 58 },
    { timestamp: '2026-08-13T15:00:00Z', temp: 65 },
    { timestamp: '2026-08-13T16:00:00Z', temp: 60 },
    { timestamp: '2026-08-13T17:00:00Z', temp: 68 },
    { timestamp: '2026-08-13T18:00:00Z', temp: 63 },
    { timestamp: '2026-08-13T19:00:00Z', temp: 70 },
    { timestamp: '2026-08-13T20:00:00Z', temp: 65 },
    { timestamp: '2026-08-13T21:00:00Z', temp: 72 },
    { timestamp: '2026-08-13T22:00:00Z', temp: 68 },
    { timestamp: '2026-08-13T23:00:00Z', temp: 75 },
    { timestamp: '2026-08-14T00:00:00Z', temp: 70 },
    { timestamp: '2026-08-14T01:00:00Z', temp: 78 },
    { timestamp: '2026-08-14T02:00:00Z', temp: 73 },
    { timestamp: '2026-08-14T03:00:00Z', temp: 80 },
    { timestamp: '2026-08-14T04:00:00Z', temp: 75 },
    { timestamp: '2026-08-14T05:00:00Z', temp: 82 },
    { timestamp: '2026-08-14T06:00:00Z', temp: 77 },
    { timestamp: '2026-08-14T07:00:00Z', temp: 85 }
];

export default function UploadVideo(){
    const navigate = useNavigate();
    const location = useLocation();

    const { idRelacao, nomeTurma, nomeDisciplina } = location.state || {};

    const [classificacoes, setClassificacoes] = useState([]);
    const [classificacao, setClassificacao] = useState('');
    const [conteudo, setConteudo] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // 3. Referência para o container de relatório do PDF
    const reportRef = useRef(null);

    useEffect(() => {
        async function loadClassificacoes() {
            try {
                const response = await api.get('aula/classificacao-conteudo');
                console.log(response);
                setClassificacoes(response.data);
                if (response.data.length > 0) {
                    setClassificacao(response.data[0].idClassificacaoConteudo);
                }
            } catch (error) {
                console.error(error);
            }
        }
        loadClassificacoes();
    }, []);

    const handleSelectDate = (date) => {
        setSelectedDate(date);
    };

    // 4. Nova função para gerar PDF direto da Referência sem alterar CSS da tela
    const handleGerarPDF = async () => {
        if (!reportRef.current) return;

        setIsGeneratingPdf(true);

        const opcoes = {
            margin:       0, // Margem zerada para aproveitar o padding do CSS do A4
            filename:     `relatorio-aula-${nomeTurma || 'turma'}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            await html2pdf().set(opcoes).from(reportRef.current).save();
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const dd = selectedDate ? String(selectedDate.getDate()).padStart(2, '0') : '';
    const mm = selectedDate ? String(selectedDate.getMonth() + 1).padStart(2, '0') : '';
    const yyyy = selectedDate ? String(selectedDate.getFullYear()) : '';
    const dataFormatada = selectedDate ? `${dd}/${mm}/${yyyy}` : 'Não informada';

    // Obtém o nome legível da classificação selecionada para mandar ao relatório
    const nomeClassificacaoSelecionada = classificacoes.find(
        item => item.idClassificacaoConteudo === classificacao
    )?.nomeClassificacaoConteudo || '';

    return (
        <div className='upload-video-body'>
            <Header
                routes={[
                    { textButton: "Início", routeButton: "/inicial-professor" },
                    { textButton: "Sobre o Projeto", routeButton: "/" },
                    { textButton: "Perfil", routeButton: "/editar-dados" }
                ]} />

            <div className='upload-video-content'>
                <div className='upload-video-top'>
                    <div className='upload-video-left'>
                        <div>
                            <p className='upload-video-left-title'>Nova Aula</p>
                        </div>
                        <div className='upload-video-left-turma-disciplina'>
                            <p className='upload-video-left-turma'>Turma: {nomeTurma || "Não informada"}</p>
                            <p className='upload-video-left-disciplina'>Disciplina: {nomeDisciplina || "Não informada"}</p>
                        </div>

                        <div className="upload-video-left-data">
                            <label className='upload-video-data-label'>Data da aula: </label>
                            <div className="date-inputs">
                                <input
                                    type="text"
                                    className={`dd ${dd ? 'active' : ''}`}
                                    placeholder="DD"
                                    value={dd}
                                    readOnly
                                />
                                <input
                                    type="text"
                                    className={`mm ${mm ? 'active' : ''}`}
                                    placeholder="MM"
                                    value={mm}
                                    readOnly
                                />
                                <input
                                    type="text"
                                    className={`yyyy ${yyyy ? 'active' : ''}`}
                                    placeholder="AAAA"
                                    value={yyyy}
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="upload-video-left-classificacao">
                            <label>Classificação da aula</label>
                            <SelectCustomizado
                                placeholder="Selecione uma classificação..."
                                value={classificacao}
                                onChange={(novoId) => setClassificacao(novoId)}
                                options={classificacoes.map(item => ({
                                    value: item.idClassificacaoConteudo,
                                    label: item.nomeClassificacaoConteudo,
                                    title: item.descricaoClassificacaoConteudo
                                }))}
                            />
                        </div>

                        <div className="upload-video-left-conteudo">
                            <label>Conteúdo</label>
                            <input
                                type="text"
                                value={conteudo}
                                onChange={e => setConteudo(e.target.value)}
                            />
                        </div>

                    </div>

                    <DatePicker selectedDate={selectedDate} onSelectDate={handleSelectDate} />

                </div>
                <div className='area-upload'>
                    <p className='upload-video-upload-aulas-title'>Faça o upload da gravação da aula</p>
                    <AreaUploadVideo />

                    <button className='upload-video-processar'>
                        <div className='upload-video-processar-row'>
                            <p className='upload-video-processar-row-text'>Processar Video</p>
                        </div>
                    </button>
                </div>

                <div className='upload-video-historico-aulas'>
                    <p className='upload-video-historico-aulas-title'>Linha do tempo de atenção </p>
                    <GenericLineChart 
                        data={tempLogs} 
                        xKey="timestamp" 
                        yKey="temp"  
                        formatXAxis={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    />

                    <button 
                        className='upload-video-salvar' 
                        onClick={handleGerarPDF}
                        disabled={isGeneratingPdf}
                    >
                        <div className='upload-video-salvar-row'>
                            <IconTexto className='upload-video-salvar-row-icon' />
                            <p className='upload-video-salvar-row-text'>
                                {isGeneratingPdf ? 'Gerando PDF...' : 'Gerar PDF'}
                            </p>
                        </div>
                    </button>
                </div>
            </div>

            <ReportTemplate
                refProp={reportRef}
                nomeTurma={nomeTurma}
                nomeDisciplina={nomeDisciplina}
                dataAula={dataFormatada}
                classificacao={nomeClassificacaoSelecionada}
                conteudo={conteudo}
                data={tempLogs}
            />
        </div>
    );
}