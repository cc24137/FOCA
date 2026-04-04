import { BrowserRouter, Routes, Route } from "react-router-dom";

import AlterarSenha       from "./alterar-senha";
import Cadastro           from "./cadastro";
import CodigoEmail        from "./codigo-email";
import Disciplinas        from "./disciplinas";
import EditarDados        from "./editar-dados";
import Estatisticas       from "./estatisticas";
import InformacoesTurma   from "./informacoes-turma";
import Inicial            from "./inicial";
import InicialInstituicao from "./inicial-instituicao";
import InicialProfessor   from "./inicial-professor";
import Login              from "./login";
import Professores        from "./professores";
import TesteVideo         from "./teste-video";
import Turmas             from "./turmas";
import UploadVideo        from "./upload-video";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                    element={<Inicial />} />
        <Route path="/inicial"             element={<Inicial />} />

        <Route path="/alterar-senha"       element={<AlterarSenha />} />
        <Route path="/cadastro"            element={<Cadastro />} />
        <Route path="/codigo-email"        element={<CodigoEmail />} />
        <Route path="/disciplinas"         element={<Disciplinas />} />
        <Route path="/editar-dados"        element={<EditarDados />} />
        <Route path="/estatisticas"        element={<Estatisticas />} />
        <Route path="/informacoes-turma"   element={<InformacoesTurma />} />
        <Route path="/inicial-instituicao" element={<InicialInstituicao />} />
        <Route path="/inicial-professor"   element={<InicialProfessor />} />
        <Route path="/login"               element={<Login />} />
        <Route path="/professores"         element={<Professores />} />
        <Route path="/teste-video"         element={<TesteVideo />} />
        <Route path="/turmas"              element={<Turmas />} />
        <Route path="/upload-video"        element={<UploadVideo />} />
        <Route path="*"                    element={<Inicial />} /> {/*Fallback leva para a tela inicial*/}
      </Routes>
    </BrowserRouter>
  );
}

export default App;