import { useNavigate } from 'react-router-dom';
import SeletorTipo from "../components/selecionar-tipo";
import { useState } from "react";
import "./login.css";
import TituloLateral from '../components/titulo-lateral';
import HomeIcon from "../assets/home.svg?react";
  
export default function Login(){
    const [tipoSelecionado, setTipoSelecionado] = useState("professor");
    const navigate = useNavigate();

    function goTo(path) {
        navigate(path);
    }

    return (
        <div className='login-body'>
            <TituloLateral />

            <div className='login-right'>
                <button
                    className="login-button"
                    onClick={() => goTo("/")}
                >
                    <div className="login-content-button">
                        <HomeIcon className="login-home-icon" />
                        <span className='login-button-text'>Início</span>
                    </div>

                </button>
            </div>
        </div>
        
    )
}