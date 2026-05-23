import Header from '../components/header';
import Combobox from '../components/combobox-turmas';
import './estatisticas.css'
import { useState } from 'react';

export default function Estatisticas(){
    const [option, setOption] = useState("");
    const [selectedA, setSelectedA] = useState([]);
    const [selectedB, setSelectedB] = useState([]);

    const matriz = [
        ["Ana Souza", "3ºA - Manhã", "Matemática"],
        ["Carlos Lima", "2ºB - Tarde", "Português"],
        ["Fernanda Rocha", "1ºC - Noite", "Física"],
        ["Roberto Neves", "4ºA - Manhã", "História"],
    ];

    const config = {
        Professores: { mainIdx: 0, filterAIdx: 1, filterALabel: "turma",      filterBIdx: 2, filterBLabel: "disciplina" },
        Turmas:      { mainIdx: 1, filterAIdx: 0, filterALabel: "professor",   filterBIdx: 2, filterBLabel: "disciplina" },
        Disciplinas: { mainIdx: 2, filterAIdx: 0, filterALabel: "professor",   filterBIdx: 1, filterBLabel: "turma"      },
    };

    const getUniqueByIdx = (idx) => [...new Set(matriz.map(r => r[idx]))];

    const handleOptionChange = (v) => {
        setOption(v);
        setSelectedA([]);
        setSelectedB([]);
    };

    const handleSelect = (v, selected, setSelected) => {
        if (!v) return;
        if (v === "Todas") {
            setSelected(["Todas"]);
        } else {
            setSelected(prev => [...prev.filter(i => i !== "Todas"), v]);
        }
    };

    const removeChip = (item, selected, setSelected) => {
        setSelected(prev => prev.filter(i => i !== item));
    };

    const getAvailable = (idx, selected) => {
        const all = getUniqueByIdx(idx);
        return ["Todas", ...all.filter(i => !selected.includes(i))];
    };

    const getListagem = () => {
        if (!option) return [];
        const { mainIdx, filterAIdx, filterBIdx } = config[option];

        let rows = matriz;

        if (selectedA.length > 0 && !selectedA.includes("Todas")) {
            rows = rows.filter(r => selectedA.includes(r[filterAIdx]));
        }
        if (selectedB.length > 0 && !selectedB.includes("Todas")) {
            rows = rows.filter(r => selectedB.includes(r[filterBIdx]));
        }

        return [...new Set(rows.map(r => r[mainIdx]))];
    };

    const listagem = getListagem();
    const cfg = config[option];

    return (
        <div className='estatisticas-body'>
            <Header />
            <div className='estatisticas-content'>
                <div className='estatisticas-selector-row'>
                    <p>Comparar</p>

                    <Combobox
                        options={["Professores", "Turmas", "Disciplinas"]}
                        value={option}
                        onChange={handleOptionChange}
                        placeholder="Selecione uma opção"
                    />

                    
                </div>

                <div className='estatisticas-filters'>
                    <div className="estatisticas-filter-row">
                        {option && <p style={{textTransform: 'capitalize'}}>{cfg?.filterALabel}{cfg?.filterALabel.slice(-1) === 'r' ? 'es' : 's'}: </p>}
                        {option && (
                            <Combobox
                                options={getAvailable(cfg.filterAIdx, selectedA)}
                                value=""
                                onChange={v => handleSelect(v, selectedA, setSelectedA)}
                                placeholder={`Filtrar por ${cfg.filterALabel}`}
                            />
                        )}
                    </div>
                    {selectedA.map(item => (
                        <div key={`a-${item}`} className='estatisticas-chip chip-a'>
                            <span>{item}</span>
                            <button onClick={() => removeChip(item, selectedA, setSelectedA)}>✕</button>
                        </div>
                    ))}

                    <div className="estatisticas-filter-row">
                        {option && <p style={{textTransform: 'capitalize'}}>{cfg?.filterBLabel}s: </p>}
                        {option && (
                            <Combobox
                                options={getAvailable(cfg.filterBIdx, selectedB)}
                                value=""
                                onChange={v => handleSelect(v, selectedB, setSelectedB)}
                                placeholder={`Filtrar por ${cfg.filterBLabel}`}
                            />
                        )}
                        
                    </div>
                        {(selectedA.length > 0 || selectedB.length > 0) && (
                            <div className='estatisticas-chips'>
                                
                                {selectedB.map(item => (
                                    <div key={`b-${item}`} className='estatisticas-chip chip-b'>
                                        <span>{item}</span>
                                        <button onClick={() => removeChip(item, selectedB, setSelectedB)}>✕</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    
                </div>



                

                

                {listagem.length > 0 && (
                    <div className='estatisticas-listagem'>
                        {listagem.map((item, i) => (
                            <div key={i} className='estatisticas-listagem-item'>
                                <p>{item}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className='estatisticas-average-attention'>
                    <p className='estatisticas-average-attention-text'>Atenção média</p>
                    <div className='estatisticas-average-attention-graph'>
                    </div>
                </div>
            </div>
        </div>
    )
}