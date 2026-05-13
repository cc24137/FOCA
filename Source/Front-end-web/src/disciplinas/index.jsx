import Header from '../components/header';
import './disciplinas.css';
import { useState } from 'react';

export default function Disciplinas(){
    const [disciplinas, setDisciplinas] = useState([
        { nome: "Matemática", mediaDeAtencao: 78.2, turmas: ["7B, 8A"] },
        { nome: "Português", mediaDeAtencao: 82.5, turmas: ["9C, 10D"] },
        { nome: "Ciências", mediaDeAtencao: 75.0, turmas: ["6A, 7C"] },
        { nome: "História", mediaDeAtencao: 80.0, turmas: ["8B, 9E"] },
    ]);

    const [isEditing, setIsEditing] = useState(false);
    const [selectedDisciplina, setSelectedDisciplina] = useState(null);
    const [nomeDisciplina, setNomeDisciplina] = useState(null)

    function edit_clicked(){
        if(selectedDisciplina != null){
            if(!isEditing){
                setNomeDisciplina(disciplinas[selectedDisciplina]?.nome)
            } else {
                setDisciplinas(prev => prev.map((d, i) =>
                    i === selectedDisciplina ? { ...d, nome: nomeDisciplina } : d
                ));
            }
            setIsEditing(prev => !prev)
        }
    }

    return (
        <div className='disciplinas-body'>
            <Header />
            <div className='disciplinas-content'>
                <div className='disciplinas-esquerda'>
                    <p className='disciplinas-esquerda-title'>Lista de disciplinas</p>

                    <div className='disciplinas-list-container'>
                        {disciplinas.map((disciplina, index) => (
                            <div
                                key={index}
                                className={`disciplina-item ${selectedDisciplina === index ? 'selected' : ''}`}
                                onClick={() => setSelectedDisciplina(index)}
                            >
                                {disciplina.nome}
                            </div>
                        ))}
                    </div>

                    <div>
                        <button className='disciplinas-adicionar'>
                            <p className='disciplinas-adicionar-text'>Adicionar disciplina</p>
                        </button>
                    </div>
                </div>

                <div className='disciplinas-direita'>
                        {isEditing ? (
                            <input
                                className='disciplinas-direita-title-input'
                                value={nomeDisciplina || ''}
                                onChange={(e) => setNomeDisciplina(e.target.value)}
                            />
                        ) : (
                            <p className='disciplinas-direita-title'>
                                {disciplinas[selectedDisciplina]?.nome || 'Detalhes da disciplina'}
                            </p>
                        )}

                    <div>
                        {selectedDisciplina !== null ? (
                            <div className='disciplina-detalhes'>
                                <p><strong>Media de Atenção:</strong> {disciplinas[selectedDisciplina].mediaDeAtencao}</p>
                                <p><strong>Turmas:</strong> {disciplinas[selectedDisciplina].turmas.join(', ')}</p>
                            </div>
                        ) : (
                            <p className='disciplina-selecione'>Selecione uma disciplina para ver os detalhes</p>
                        )}
                    </div>

                    <div className='disciplinas-historico-aulas-content'>
                    
                    </div>
                    
                    <div className='disciplinas-row'>
                        <button 
                            className='disciplinas-editar'
                            onClick={edit_clicked}
                        >
                            <p className='disciplinas-editar-text'>{isEditing ? "Salvar": "Editar disciplina"}</p>
                        </button>

                        <button className='disciplinas-remover'>
                            <p className='disciplinas-remover-text'>Remover disciplina</p>
                        </button>
                    </div>
                    
                </div>
            </div>
        </div>
    )
}
