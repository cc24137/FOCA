import { useNavigate } from 'react-router-dom';
import './cadastro.css';
import SealIcon from "../assets/seal.svg?react";
import HomeIcon from "../assets/home.svg?react";
import SeletorTipo from '../components/selecionar-tipo';
import { useState } from "react";
import EyeOnIcon from "../assets/eye-on.svg?react";      // open eye
import EyeOffIcon from "../assets/eye-off.svg?react"; // closed eye
import TituloLateral from '../components/titulo-lateral';

export default function Cadastro(){
    const navigate = useNavigate();
    const [selectedType, setSelectedType] = useState("professor");
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    function goTo(path) {
        navigate(path);
    }

    function formSubmit(){
        if (
            (document.getElementById("email").value != "")
        ){
            if(selectedType == "professor"){
                goTo("/inicial-professor")
            }
            else{
                goTo("/inicial-instituicao")
            }
        }
    }

    return (
        <div className='cadastro-body'>
            {/*esquerda*/}
            <TituloLateral />

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
                <div className='sign-in-center'>
                    <div className="field-group">
                        <label className="field-label" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="text-field"
                            placeholder=""
                        />
                    </div>
                    {/*nome da instituição/professor*/}

                    <div className="field-group">
                        <label className="field-label" htmlFor='name'>
                            Nome {selectedType == "professor" ? "do " : "da "} {selectedType}
                        </label>
                        <input
                            id="name"
                            className="text-field"
                            placeholder=""
                        />
                    </div>
                    {/*senha*/}

                    <div className="field-group">
                        <label className="field-label">Senha</label>

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
                    </div>
                    {/*confirmar senha*/}

                    <div className="field-group">
                        <label className="field-label">Confirmar Senha</label>

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
                </div>
                
                {/*botao*/}

                <div className='sign-in-bottom'>
                    <button 
                        className='sign-in-submit-button'
                        onClick={() => formSubmit()}
                    >
                        Criar
                    </button>
                    {/*texto de redirecionamento para login*/}

                    <div className='text-to-login'>
                        <p>Já tem uma conta? <span className='redirect-to-login' onClick={() => goTo("/login")}>Acesse o Login aqui!</span></p>
                    </div>
                </div>
                
            </div>
        </div>
    )
}