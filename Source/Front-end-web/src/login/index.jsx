import { useNavigate } from 'react-router-dom';
import SeletorTipo from "../components/selecionar-tipo";
import { useState } from "react";
  
export default function Login(){
    const [tipoSelecionado, setTipoSelecionado] = useState("professor");

    return (
        <div>
            <h1>Login</h1>

            <SeletorTipo
            opcao={tipoSelecionado}
            aoSelecionar={setTipoSelecionado}
            />

            <h1>{tipoSelecionado}</h1>
        </div>
        
    )
}