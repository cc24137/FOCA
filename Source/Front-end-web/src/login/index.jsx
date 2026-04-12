import { useNavigate } from 'react-router-dom';
import SeletorTipo from "../components/selecionar-tipo";
import { useState } from "react";
import "./login.css";
import TituloLateral from '../components/titulo-lateral';
  
export default function Login(){
    const [tipoSelecionado, setTipoSelecionado] = useState("professor");

    return (
        <div>
            <TituloLateral />
        </div>
        
    )
}