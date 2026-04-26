import { useNavigate } from 'react-router-dom';
import Header from '../components/header';
import "./inicial-professor.css"
import SearchIcon from "../assets/search.svg?react" 
import Book from "../assets/book.svg?react"
import { useState } from 'react';


export default function InicialProfessor(){
    const [query, setQuery] = useState("");
    
    const items = [
        {name: "PD24", subject: "Matemática", institution: "Cotuca"},
        {name: "TA24", subject: "Português", institution: "Cotuca"},
        {name: "PD24", subject: "Matemática", institution: "Etec"},
        {name: "TA24", subject: "Português", institution: "Etec"},
        {name: "PD24", subject: "Matemática", institution: "Fatec"},
        {name: "TA24", subject: "Português", institution: "Fatec"},
    ];

    const filteredItems = items.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.subject.toLowerCase().includes(query.toLowerCase()) ||
        item.institution.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className='inicial-professor-page'>
            <Header
                routes = {[
                    {textButton: "Início", routeButton: "/inicial"},
                    {textButton: "Sobre o Projeto", routeButton: "/inicial"},
                    {textButton: "Perfil"         , routeButton: "/editar-dados"}
                ]}
            />
                
            <div className='inicial-professor-body'>
                    <div className='inicial-professor-middle-line'>
                    <div className='inicial-professor-middle-line-title'>
                        <h1 className='inicial-professor-middle-text'>Turmas</h1>
                    </div>
                                    
                    <div className="search-container">
                        <SearchIcon className="search-icon" />
                        <input
                            type="text"
                            placeholder="Pesquisar por turma, matéria ou instituição..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>  
                    
                    <button className='inicial-professor-middle-button'>
                        <div>
                            <p className='inicial-professor-middle-button-text'>
                                Gerenciar Instituições
                            </p>
                        </div>
                        
                    </button>
                </div>
                

                
                
                
                <div className="inicial-professor-cards-container">
                    {filteredItems.map((item, index) => (
                        <div key={index} className='inicial-professor-card'>
                            <div className='card-header'>
                                <Book />
                                <h2 className='inicial-professor-card-title'>{item.name}</h2>
                            </div>
                            <p className='card-subject'>Disciplina: {item.subject}</p>
                            <p className='card-subject'>Instituição: {item.institution}</p>
                        </div>
                    ))}
                    
                    {filteredItems.length === 0 && (
                        <p className="no-results">Nenhum resultado encontrado para "{query}"</p>
                    )}
                </div>
            </div>
        </div>
    )
}