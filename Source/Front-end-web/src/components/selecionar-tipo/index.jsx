import "./selecionar-tipo.css";

export default function SelecionarTipo({option, onSelect}){
    return(
        <div className="selector">
            <button
            className={`selector-field selector-left ${
                option === "professor" ? "active" : "" //se opção selecionada for professor adiciona ativo no nome da classe se não adiciona ""
            }`}
            onClick={() => onSelect("professor")}
            >
                Professor
            </button>

            <button
            className={`selector-field selector-right ${
                option === "instituição" ? "active" : "" //se opção selecionada for Instituição adiciona ativo no nome da classe se não adiciona ""
            }`}
            onClick={() => onSelect("instituição")}
            >
                Instituição
            </button>
        </div>
    )
}