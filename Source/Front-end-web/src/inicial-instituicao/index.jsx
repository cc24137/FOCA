import { useNavigate } from 'react-router-dom';
import Header from '../components/header';

import User from "../assets/user.svg?react"
import Book from "../assets/book.svg?react"
import Pen from "../assets/pen.svg?react"
import Bookmark from "../assets/bookmark.svg?react"

import "./inicial-instituicao.css"


export default function InicialInstituicao(){
    return (
        <div>
            <Header

                routes = {[
                    {textButton: "Início", routeButton: "/inicial"},
                    {textButton: "Sobre o Projeto", routeButton: "/inicial"},
                    {textButton: "Perfil"         , routeButton: "/editar-dados"}
                ]}
            />
            <div className='inicial-instituicao-body'>
                <div className='inicial-instituicao-title'>
                    <h1>Olá, [nome da instituição]</h1>
                </div>
                

                <div className='inicial-instituicao-cards-container'>
                    <div className='inicial-instituicao-card'>
                        <div className='inicial-instituicao-card-top'>
                            <User className="icons" />
                            <p>Professores</p>
                        </div>
                        <p className='inicial-instituicao-card-subtitle'>Gerencie seus professores</p>
                        <p className='inicial-instituicao-card-text'>Adicionar novos, editar, excluir, analisar gráficos ...</p>
                    </div>

                    <div className='inicial-instituicao-card'>
                        <div className='inicial-instituicao-card-top'>
                            <Book className="icons" />
                            <p>Turmas</p>
                        </div>
                        <p className='inicial-instituicao-card-subtitle'>Gerencie suas turmas</p>
                        <p className='inicial-instituicao-card-text'>Adicionar novas, editar, excluir, analisar gráficos ...</p>
                    </div>

                    <div className='inicial-instituicao-card'>
                        <div className='inicial-instituicao-card-top'>
                            <Pen className="icons" />
                            <p>Disciplinas</p>
                        </div>
                        <p className='inicial-instituicao-card-subtitle'>Gerencie suas disciplinas</p>
                        <p className='inicial-instituicao-card-text'>Adicionar novas, editar, excluir, analisar gráficos</p>
                    </div>

                    <div className='inicial-instituicao-card'>
                        <div className='inicial-instituicao-card-top'>
                            <Bookmark className="icons" />
                            <p >Estatísticas Gerais</p>
                        </div>
                        <p className='inicial-instituicao-card-subtitle'>Compare os dados obtidos</p>
                        <p className='inicial-instituicao-card-text'>Selecione as categorias e gere ps gráficos desejados com toda a instituição</p>
                    </div>
                </div>
            </div>
        </div>
        
    )
}