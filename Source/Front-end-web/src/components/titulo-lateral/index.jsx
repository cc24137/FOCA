import "./titulo-lateral.css";
import FocaLogoImg from "../../assets/foca_logo.png";

export default function TituloLateral(){
    return(
        // ✨ Usamos uma classe container principal para o componente
        <aside className='titulo-lateral-container'>
            {/* O conteúdo interno será controlado pelo CSS do componente */}
            <div className='titulo-lateral-top-left'>
                <img src={FocaLogoImg} alt="Logo Foca" className='titulo-lateral-seal-icon' />
                <span className='titulo-lateral-title'>FOCA</span>
            </div>
            
            <div className="titulo-lateral-bottom">
                <p className="titulo-lateral-phrase">Análise inteligente da recepção didática dos alunos</p>
            </div>
        </aside>
    )
}
