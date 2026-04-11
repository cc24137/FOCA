import "./selecionar-tipo.css";

export default function SelecionarTipo({option, onSelect}){
    return(
        <div className="selector">
            <button
            className={`selector-field selector-left ${
                option === "teacher" ? "active" : "" //se opção selecionada for professor adiciona ativo no nome da classe se não adiciona ""
            }`}
            onClick={() => onSelect("teacher")}
            >
                Professor
            </button>

            <button
            className={`selector-field selector-right ${
                option === "institution" ? "active" : "" //se opção selecionada for Instituição adiciona ativo no nome da classe se não adiciona ""
            }`}
            onClick={() => onSelect("institution")}
            >
                Instituição
            </button>
        </div>
    )
}