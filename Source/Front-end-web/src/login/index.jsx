import { useNavigate } from 'react-router-dom';
import { useState } from "react";
import "./login.css";
import TituloLateral from '../components/titulo-lateral';
import HomeIcon from "../assets/home.svg?react";
import EyeOnIcon from "../assets/eye-on.svg?react";      // open eye
import EyeOffIcon from "../assets/eye-off.svg?react"; // closed eye
  
export default function Login(){
    const [showPassword, setShowPassword] = useState(false);
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

                <div className='login-center'>
                    <div className="login-field-group">
                        <label className="login-field-label" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="login-text-field"
                            placeholder=""
                        />
                    </div>
                    {/*nome da instituição/professor*/}

                    <div className="login-field-group">
                        <label className="login-field-label">Senha</label>

                        <div className="input-wrapper">
                            <input
                            type={showPassword ? "text" : "password"}
                            className="login-text-field with-icon"
                            />

                            <button
                            type="button"
                            className="eye-button"
                            onClick={() => setShowPassword(!showPassword)}
                            >
                            {showPassword ? <EyeOnIcon /> : <EyeOffIcon />}
                            </button>
                        </div>
                    </div>

                    <div className='forgot-password'>
                        <span className='redirect-to-esqueceu-senha' onClick={() => goTo("/recuperar-senha")}>Esqueci minha senha</span>
                    </div>
                </div>

                <div className='login-bottom'>
                    <button 
                        className='login-submit-button'
                        onClick={() => formSubmit()}
                    >
                        Criar
                    </button>
                    {/*texto de redirecionamento para cadastro*/}

                    <div className='text-to-cadastro'>
                        <p>Ainda não possui uma conta? <span className='redirect-to-cadastro' onClick={() => goTo("/cadastro")}>Acesse o Cadastro aqui!</span></p>
                    </div>
                </div>

            </div>

            
            
        </div>
        
    )
}