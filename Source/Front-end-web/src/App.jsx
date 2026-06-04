import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

import AlterarSenha       from "./pages/alterar-senha";
import Cadastro           from "./pages/cadastro";
import CodigoEmail        from "./pages/codigo-email";
import Disciplinas        from "./pages/disciplinas";
import EditarDados        from "./pages/editar-dados";
import Estatisticas       from "./pages/estatisticas";
import Inicial            from "./pages/inicial";
import InicialInstituicao from "./pages/inicial-instituicao";
import InformacoesTurma   from "./pages/informacoes-turma";
import InicialProfessor   from "./pages/inicial-professor";
import Login              from "./pages/login";
import Professores        from "./pages/professores";
import TesteVideo         from "./pages/teste-video";
import Turmas             from "./pages/turmas";
import UploadVideo        from "./pages/upload-video";
import VinculosProfessor  from "./pages/vinculos-professor"

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/"                      element={<Inicial />} />
                    <Route path="/inicial"               element={<Inicial />} />
                    <Route path="/alterar-senha"         element={<AlterarSenha />} />
                    <Route path="/cadastro"              element={<Cadastro />} />
                    <Route path="/login"                 element={<Login />} />
                    <Route path="/codigo-email"          element={<CodigoEmail />} />
                    <Route path="/teste-video"           element={<TesteVideo />} />
                    <Route path="*"                      element={<Inicial />} /> {/*Fallback leva para a tela inicial*/}
    
                    <Route element={<ProtectedRoute />}>
                        <Route path="/disciplinas"           element={<Disciplinas />} />
                        <Route path="/editar-dados"          element={<EditarDados />} />
                        <Route path="/estatisticas"          element={<Estatisticas />} />
                        <Route path="/informacoes-turma/:id" element={<InformacoesTurma />} />
                        <Route path="/inicial-instituicao"   element={<InicialInstituicao />} />
                        <Route path="/inicial-professor"     element={<InicialProfessor />} />
                        <Route path="/vinculos-professor"    element={<VinculosProfessor />} />
                        <Route path="/professores"           element={<Professores />} />
                        <Route path="/turmas"                element={<Turmas />} />
                        <Route path="/upload-video"          element={<UploadVideo />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
