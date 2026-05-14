import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import Header from '../components/header';
import Combobox from '../components/combobox-turmas'
import './turmas.css'

const MOCK_PROFESSORES = [
    "Ana Silva", "Carlos Melo", "Beatriz Lima", "Diego Souza",
    "Flávia Costa", "Gabriel Reis", "Helena Moura", "Igor Pinto",
    "Juliana Ferraz", "Lucas Andrade", "Mariana Neves", "Nicolas Rocha",
];

const MOCK_DISCIPLINAS = [
    "Matemática", "Cálculo", "Português", "Literatura",
    "Biologia", "Química", "Física", "História",
    "Geografia", "Filosofia", "Sociologia", "Inglês", "Educação Física",
];

export default function Turmas(){
    const [turmas, setTurma] = useState([
        { nome: "PD24", numeroAlunos: 78,  professores: [{ nome: "Ana Silva", disciplina: "Matemática" }, { nome: "Carlos Melo", disciplina: "Cálculo" }] },
        { nome: "PD25", numeroAlunos: 82,  professores: [{ nome: "Beatriz Lima", disciplina: "Português" }] },
        { nome: "PD26", numeroAlunos: 75,  professores: [{ nome: "Diego Souza", disciplina: "Biologia" }, { nome: "Flávia Costa", disciplina: "Química" }] },
        { nome: "PD27", numeroAlunos: 80,  professores: [{ nome: "Gabriel Reis", disciplina: "História" }] },
    ]);

    const [isEditing, setIsEditing] = useState(false);
    const [selectedTurma, setSelectedTurma] = useState(null);
    const [nameTurma, setNameTurma] = useState(null);
    const [addingProf, setAddingProf] = useState(false);
    const [newProf, setNewProf] = useState({ nome: '', disciplina: '' });

    function edit_clicked(){
        if(selectedTurma != null){
            if(!isEditing){
                setNameTurma(turmas[selectedTurma]?.nome)
            } else {
                setTurma(prev => prev.map((d, i) =>
                    i === selectedTurma ? { ...d, nome: nameTurma } : d
                ));
            }
            setIsEditing(prev => !prev)
        }
    }

    function confirmAddProf() {
        if (!newProf.nome || !newProf.disciplina) return;
        setTurma(prev => prev.map((t, ti) =>
            ti === selectedTurma
                ? { ...t, professores: [...t.professores, newProf] }
                : t
        ));
        setNewProf({ nome: '', disciplina: '' });
        setAddingProf(false);
    }

    return (
        <div className='turmas-body'>
            <Header />
            <div className='turmas-content'>
                <div className='turmas-esquerda'>
                    <p className='turmas-esquerda-title'>Lista de turmas</p>

                    <div className='turmas-list-container'>
                        {turmas.map((turma, index) => (
                            <div
                                key={index}
                                className={`turma-item ${selectedTurma === index ? 'selected' : ''}`}
                                onClick={() => setSelectedTurma(index)}
                            >
                                {turma.nome}
                            </div>
                        ))}
                    </div>

                    <div>
                        <button className='turmas-adicionar'>
                            <p className='turmas-adicionar-text'>Adicionar turma</p>
                        </button>
                    </div>
                </div>

                <div className='turmas-direita'>
                        {isEditing ? (
                            <input
                                className='turmas-direita-title-input'
                                value={nameTurma || ''}
                                onChange={(e) => setNameTurma(e.target.value)}
                            />
                        ) : (
                            <p className='turmas-direita-title'>
                                {turmas[selectedTurma]?.nome || 'Detalhes da turma'}
                            </p>
                        )}

                    <div>
                        {selectedTurma !== null ? (
                            <div className='turma-detalhes'>
                                <p><strong>Alunos:</strong> {turmas[selectedTurma].numeroAlunos}</p>

                                <table className='turma-professores-tabela'>
                                    <thead>
                                        <tr>
                                            <th>Professor</th>
                                            <th>Disciplina</th>
                                            <th>
                                                <button
                                                    className='turma-prof-adicionar'
                                                    onClick={() => { setAddingProf(true); setNewProf({ nome: '', disciplina: '' }); }}
                                                    title="Adicionar professor"
                                                >+</button>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {turmas[selectedTurma].professores.map((prof, i) => (
                                            <tr key={i}>
                                                <td>{prof.nome}</td>
                                                <td>{prof.disciplina}</td>
                                                <td>
                                                    <button
                                                        className='turma-prof-remover'
                                                        onClick={() => setTurma(prev => prev.map((t, ti) =>
                                                            ti === selectedTurma
                                                                ? { ...t, professores: t.professores.filter((_, pi) => pi !== i) }
                                                                : t
                                                        ))}
                                                    >✕</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {addingProf && (
                                            <tr className='turma-prof-nova-linha'>
                                                <td>
                                                    <Combobox
                                                        options={MOCK_PROFESSORES}
                                                        value={newProf.nome}
                                                        onChange={v => setNewProf(p => ({ ...p, nome: v }))}
                                                        placeholder="Professor..."
                                                    />
                                                </td>
                                                <td>
                                                    <Combobox
                                                        options={MOCK_DISCIPLINAS}
                                                        value={newProf.disciplina}
                                                        onChange={v => setNewProf(p => ({ ...p, disciplina: v }))}
                                                        placeholder="Disciplina..."
                                                    />
                                                </td>
                                                <td className='turma-prof-nova-acoes'>
                                                    <button className='turma-prof-confirmar' onClick={confirmAddProf} title="Confirmar">✓</button>
                                                    <button className='turma-prof-remover' onClick={() => setAddingProf(false)} title="Cancelar">✕</button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className='turma-selecione'>Selecione uma turma para ver os detalhes</p>
                        )}
                    </div>

                    <div className='turmas-historico-aulas-content'>
                    
                    </div>
                    
                    <div className='turmas-row'>
                        <button 
                            className='turmas-editar'
                            onClick={edit_clicked}
                        >
                            <p className='turmas-editar-text'>{isEditing ? "Salvar": "Editar turma"}</p>
                        </button>

                        <button className='turmas-remover'>
                            <p className='turmas-remover-text'>Remover turma</p>
                        </button>
                    </div>
                    
                </div>
            </div>
        </div>
    )
}