import './footer.css'

export default function Footer(){
    return(
        <div className='footer-body'>

            <div className='footer-about'>
                <p className='footer-title'>Sobre o projeto</p>
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
                <div>
                    <a href="https://github.com/cc24137/FOCA">Github</a>
                </div>
                
            </div>

        </div>
    );
}