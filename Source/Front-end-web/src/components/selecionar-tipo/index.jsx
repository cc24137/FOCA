import "./selecionar-tipo.css";

export default function SelecionarTipo({opcao, aoSelecionar}){
    return(
        <div className="seletor">
            <button
            className={`campo-seletor esquerda ${
                opcao === "professor" ? "ativo" : "" //se opção selecionada for professor adiciona ativo no nome da classe se não adiciona ""
            }`}
            onClick={() => aoSelecionar("professor")}
            >
                Professor
            </button>

            <button
            className={`campo-seletor direita ${
                opcao === "instituicao" ? "ativo" : "" //se opção selecionada for Instituição adiciona ativo no nome da classe se não adiciona ""
            }`}
            onClick={() => aoSelecionar("instituicao")}
            >
                Instituição
            </button>
        </div>
    )
}