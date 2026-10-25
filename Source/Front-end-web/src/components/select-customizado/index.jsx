import React, { useState, useEffect, useRef } from 'react';
import './select-customizado.css';
import ChevronDownIcon from '../../assets/chevron-down-bold.svg?react';

export default function SelectCustomizado({ options, value, onChange, placeholder }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Encontra o item que está selecionado atualmente para mostrar o texto dele no topo
    const itemSelecionado = options.find(opt => opt.value === value);

    // Fecha o dropdown se o usuário clicar em qualquer outro lugar da tela
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="custom-select-container" ref={dropdownRef}>
            {/* Gatilho/Botão do Select */}
            <div className={`custom-select-trigger ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                <span className={itemSelecionado ? 'custom-select-value' : 'custom-select-placeholder'}>
                    {itemSelecionado ? itemSelecionado.label : placeholder || 'Selecione...'}
                </span>
                <ChevronDownIcon className={`custom-select-chevron ${isOpen ? 'rotated' : ''}`} />
            </div>

            {/* Lista de Opções (Dropdown) */}
            {isOpen && (
                <ul className="custom-select-options">
                    {options.map((opt) => (
                        <li
                            key={opt.value}
                            className={`custom-select-item ${opt.value === value ? 'selected' : ''}`}
                            title={opt.title} // Exibe a descrição ao deixar o mouse por cima
                            onClick={() => {
                                onChange(opt.value); // Atualiza o estado no componente pai
                                setIsOpen(false);    // Fecha o dropdown
                            }}
                        >
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
