import { useNavigate } from 'react-router-dom';
import Header from '../components/header';
import Footer from '../components/footer'
import './inicial.css'

export default function Inicial(){
    const navigate = useNavigate()

    function irParaLogin(){
        navigate("/login")
    }

    return(
        <div className='inicial-body'>
            <Header
            titulo="FOCA"
            links={[
                { texto: "Início", destino: "/" },
                { texto: "Criar conta", destino: "/cadastro" }
            ]}
            />
            
            <h1>Tela Inicial</h1>

            <Footer />
        </div>
        
    )
}