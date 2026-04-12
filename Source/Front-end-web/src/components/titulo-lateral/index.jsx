import "./titulo-lateral.css";
import SealIcon from "../../assets/seal.svg?react";

export default function TituloLateral(){
    return(
        <div className='titulo-lateral-left'>
                {/*topo-esquerda*/}
                <div className='titulo-lateral-top-left'>
                    <SealIcon className='titulo-lateral-seal-icon' />
                    <div className='titulo-lateral-title-text'>
                        <h1 className='titulo-lateral-text'><span className='titulo-lateral-start-text'>F</span>erramenta de</h1>
                        <h1 className='titulo-lateral-text'><span className='titulo-lateral-start-text'>O</span>bservação e</h1>
                        <h1 className='titulo-lateral-text'><span className='titulo-lateral-start-text'>C</span>lassificação de</h1>
                        <h1 className='titulo-lateral-text'><span className='titulo-lateral-start-text'>A</span>tenção</h1>
                    </div>
                </div>
            </div>
    )
}

