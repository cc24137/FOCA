import "./header.css";
import { useNavigate } from "react-router-dom";
import logoFoca from "../../assets/seal.svg";

export default function Header({
  titulo = "FOCA",
  links = [],
  botaoTexto,
  botaoDestino,
  mostrarBotao = false,
}) {
  const navigate = useNavigate();

  function irParaDestino(destino) {
    navigate(destino);
  }

  return (
    <header className="header">
      <div className="header-esquerda">
            <img src={logoFoca} alt="Logo" className="header-logo" />
            <h1 className="header-titulo">{titulo}</h1>
      </div>


      <div className="header-direita">
        {links.map((link, index) => (
          <button
            key={index}
            className="header-link"
            onClick={() => irParaDestino(link.destino)}
          >
            {link.texto}
          </button>
        ))}

        {mostrarBotao && (
          <button
            className="header-botao"
            onClick={() => irParaDestino(botaoDestino)}
          >
            {botaoTexto}
          </button>
        )}
      </div>
    </header>
  );
}