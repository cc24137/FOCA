import { useNavigate } from 'react-router-dom';

export default function Inicial(){
    const navigate = useNavigate()

    function irParaLogin(){
        navigate("/login")
    }

    return(
        <div>
            <h1>Tela Inicial</h1>
            <button onClick={irParaLogin}>
                Entrar
            </button>
        </div>
        
    )
}