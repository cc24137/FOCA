import { useNavigate } from 'react-router-dom';
import TituloLateral from '../components/titulo-lateral';
import HomeIcon from "../assets/home.svg?react";
import './codigo-email.css';
import OtpInput from 'react-otp-input';
import { useState } from 'react';



export default function CodigoEmail(){
    const [code, setCode] = useState('');

    return (
        <div className='codigo-email-body'>
            <TituloLateral />

            <div className='codigo-email-right'>

            
                <button
                    className="codigo-email-button"
                    onClick={() => goTo("/")}
                >
                    <div className="codigo-email-content-button">
                        <HomeIcon className="home-icon" />
                        <span className='codigo-email-button-text'>Início</span>
                    </div>
                </button>
            
                <div className='codigo-email-center'>
                    <div className='codigo-email-box'>
                        <p>Enviamos um código de verificação para o email ********</p>
                        <p>Insira o código abaixo para continuar.</p>
                    </div>

                    <div className='codigo-email-container-code'>
                        <h1 className='codigo-email-title-code'>Código de Verificação</h1>
                        <OtpInput
                            containerStyle='codigo-email-otp-container'
                            value={code}
                            onChange={setCode}
                            numInputs={6}
                            inputType='tel'
                            renderInput={(props) => <input {...props}  className='codigo-email-otp-inputs'/>}
                        />
                    </div>
                    
                </div>

                <div className='codigo-email-bottom'>
                    <button 
                        className='codigo-email-submit-button'
                        onClick={() => formSubmit()}
                    >
                        Confirmar
                    </button>
                    <p className='codigo-email-text-code'> Não recebeu o código? <span className='codigo-email-resend-code'>Clique aqui para reenviar</span></p>
                </div>
            </div>

            
        </div>
    )
}

