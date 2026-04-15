import { useNavigate } from 'react-router-dom';
import './alterar-senha.css'
import TituloLateral from '../components/titulo-lateral';
import HomeIcon from "../assets/home.svg?react";
import { useState } from "react";
import EyeOnIcon from "../assets/eye-on.svg?react";      // open eye
import EyeOffIcon from "../assets/eye-off.svg?react"; // closed eye

export default function AlterarSenha(){
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    function goTo(path) {
        navigate(path);
    }

    return (
        <div className='alterar-senha-body'>
            <TituloLateral />

            <div className='alterar-senha-right'>
                <button
                    className="alterar-senha-button"
                    onClick={() => goTo("/")}
                >
                    <div className="alterar-senha-content-button">
                        <HomeIcon className="home-icon" />
                        <span className='alterar-senha-button-text'>Início</span>
                    </div>

                </button>

                <div className='alterar-senha-center'>
                    <div className='alterar-senha-box'>
                        <p>Quase lá!</p>
                        <p>Defina sua nova senha para finalizar a recuperação da sua conta.</p>
                    </div>
                

                    <div className="alterar-senha-field-group">
                        <label className="alterar-senha-field-label">Senha</label>

                        <div className="input-wrapper">
                            <input
                            type={showPassword ? "text" : "password"}
                            className="text-field with-icon"
                            />

                            <button
                            type="button"
                            className="eye-button"
                            onClick={() => setShowPassword(!showPassword)}
                            >
                            {showPassword ? <EyeOnIcon /> : <EyeOffIcon />}
                            </button>
                        </div>
                        {/*confirmar senha*/}

                    
                        <label className="alterar-senha-field-label">Confirmar Senha</label>

                        <div className="input-wrapper">
                            <input
                            type={showConfirmPassword ? "text" : "password"}
                            className="text-field with-icon"
                            />

                            <button
                            type="button"
                            className="eye-button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                            {showConfirmPassword ? <EyeOnIcon /> : <EyeOffIcon />}
                            </button>
                        </div>
                    </div>
                    
                    {/*botao*/}

                    
                </div> 

                <div className='alterar-senha-bottom'>
                    <button 
                        className='alterar-senha-submit-button'
                        onClick={() => formSubmit()}
                    >
                        Redefinir Senha
                    </button>
                </div>
            </div>
        </div>

    )
}