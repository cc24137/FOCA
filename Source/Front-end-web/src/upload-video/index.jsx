import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/header';
import DatePicker from '../components/date-picker';
import AreaUploadVideo from '../components/area-upload-video';
import './upload-video.css';
import { useState } from 'react';
import IconTexto from '../assets/file-text.svg?react';

export default function UploadVideo(){
    const navigate = useNavigate();
    const location = useLocation();

    const { idRelacao, nomeTurma, nomeDisciplina } = location.state || {};

    const [classificacao, setClassificacao] = useState('Explicação');
    const [conteudo, setConteudo] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);

    const handleSelectDate = (date) => {
        setSelectedDate(date);
    };

    const dd = selectedDate ? String(selectedDate.getDate()).padStart(2, '0') : '';
    const mm = selectedDate ? String(selectedDate.getMonth() + 1).padStart(2, '0') : '';
    const yyyy = selectedDate ? String(selectedDate.getFullYear()) : '';

    return (
        <div className='upload-video-body'>
            <Header />

            <div className='upload-video-content'>
                <div className='upload-video-top'>
                    <div className='upload-video-left'>
                        <div>
                            <p className='upload-video-left-title'>Nova Aula</p>
                        </div>
                        <div className='upload-video-left-turma-disciplina'>
                            {/* 4. Substituímos os asteriscos pelas variáveis reais recebidas */}
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
                            <select value={classificacao} onChange={e => setClassificacao(e.target.value)}>
                                <option>Explicação</option>
                                <option>Exercícios</option>
                                <option>Avaliação</option>
                                <option>Revisão</option>
                            </select>
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
                    <div className='upload-video-historico-aulas-content'>

                    </div>

                    <button className='upload-video-salvar'>
                        <div className='upload-video-salvar-row'>
                            <IconTexto className='upload-video-salvar-row-icon' />
                            <p className='upload-video-salvar-row-text'>Gerar PDF</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
