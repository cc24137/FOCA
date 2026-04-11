import { useNavigate } from 'react-router-dom';
import Header from '../components/header';

export default function Inicial(){
    const navigate = useNavigate()

    function irParaLogin(){
        navigate("/login")
    }

    return(
        <div>
            <Header
            titulo="FOCA"
            links={[
                { texto: "Início", destino: "/" },
                { texto: "Criar conta", destino: "/cadastro" }
            ]}
            />
            <h1>Tela Inicial</h1>
        </div>
        
    )
}