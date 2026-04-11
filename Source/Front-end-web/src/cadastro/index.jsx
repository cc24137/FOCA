import { useNavigate } from 'react-router-dom';
import './cadastro.css';
import SealIcon from "../assets/seal.svg?react";
import HomeIcon from "../assets/home.svg?react";
import SeletorTipo from '../components/selecionar-tipo';
import { useState } from "react";

export default function Cadastro(){
    const navigate = useNavigate();
    const [selectedType, setSelectedType] = useState("teacher");

    function goTo(path) {
        navigate(path);
    }

    return (
        <div className='cadastro-body'>
            {/*esquerda*/}
            <div className='left'>
                {/*topo-esquerda*/}
                <div className='top-left'>
                    <SealIcon className='seal-icon' />
                    <div className='title-text'>
                        <h1 className='text'><span className='start-text'>F</span>erramenta de</h1>
                        <h1 className='text'><span className='start-text'>O</span>bservação e</h1>
                        <h1 className='text'><span className='start-text'>C</span>lassificação de</h1>
                        <h1 className='text'><span className='start-text'>A</span>tenção</h1>
                    </div>
                </div>
            </div>

            {/*direita*/}
            <div className='right'>
                {/*botao inicio*/}
                <button
                    className="sign-in-button"
                    onClick={() => goTo("/")}
                >
                    <div className="sign-in-content-button">
                        <HomeIcon className="home-icon" />
                        <span className='sign-in-button-text'>Início</span>
                    </div>

                </button>

                <SeletorTipo
                    option={selectedType}
                    onSelect={setSelectedType}
                />
                
                {/*Email da instituição/professor*/}
                {/*nome da instituição/professor*/}
                {/*senha*/}
                {/*confirmar senha*/}
                {/*botao*/}
                {/*texto de redirecionamento para login*/}
            </div>
        </div>
    )
}