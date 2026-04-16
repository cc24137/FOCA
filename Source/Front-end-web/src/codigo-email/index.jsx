import { useNavigate } from 'react-router-dom';
import TituloLateral from '../components/titulo-lateral';
import HomeIcon from "../assets/home.svg?react";
import './codigo-email.css';
import OtpInput from 'react-otp-input';
import { useState } from 'react';

// export default function CodigoEmail(){
//     const [code, setCode] = useState('');

//     return (
//         <div className='codigo-email-body'>
//             <TituloLateral />

//             <div className='codigo-email-right'>

            
//                 <button
//                     className="codigo-email-button"
//                     onClick={() => goTo("/")}
//                 >
//                     <div className="codigo-email-content-button">
//                         <HomeIcon className="home-icon" />
//                         <span className='codigo-email-button-text'>Início</span>
//                     </div>
//                 </button>
            
//                 <div className='codigo-email-center'>
//                     <div className='codigo-email-box'>
//                         <p>Quase lá!</p>
//                         <p>Insira o código de verificação enviado para seu email para finalizar a recuperação da sua conta.</p>
//                     </div>
                
//                     <OtpInput
//                         value={code}
//                         onChange={setCode}
//                         numInputs={6}
//                         renderInput={(props) => <input {...props} />}
//                     />
//                 <div />

                
//             </div>

//             <div className='codigo-email-bottom'>
//                 <button 
//                     className='codigo-email-submit-button'
//                     onClick={() => formSubmit()}
//                 >
//                     Confirmar Código
//                 </button>
//             </div>
//         </div>
//     );
// }

export default function CodigoEmail(){
    return (
        <h1>Código de Email</h1>
    )
}