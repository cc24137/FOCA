import './footer.css'
import GithubIcon from "../../assets/github.svg?react";

export default function Footer(){
    return(
        <div className='footer-body'>
            <div className='footer-elements'>
                <div className='footer-about'>
                    <p className='footer-title'>Sobre o projeto</p>

                    <p className='footer-text'>
                        FOCA é um projeto que utiliza IA para analisar a atenção de uma sala de aula por imagens. A ferramenta integra visão computacional e análise de dados para proporcionar uma forma de professores e escolas 
                    </p>
                </div>

                <div className='footer-contacts'>
                    <p className='footer-title'>Contatos</p>
                    <ul>
                        <li><p>projetofocacontato@gmail.com</p></li>
                        <li><p>juliopstein@gmail.com</p></li>
                        <li><p>eduardo.tribst@gmail.com</p></li>
                        <li><p>rafafazion9@gmail.com</p></li>
                    </ul>
                </div>

                <div className='footer-more-about'>
                    <p className='footer-title'>Mais do projeto</p>
                    <div className='more-about-row'>
                        <GithubIcon className='github-icon'/>
                        <a className='more-about-text' href="https://github.com/cc24137/FOCA">Github</a>
                    </div>
                    
                </div>
            </div>

            

        </div>
    );
}