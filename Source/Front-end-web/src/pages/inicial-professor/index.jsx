import { useNavigate } from "react-router-dom";
import Header from "../../components/header";
import "./inicial-professor.css";
import SearchIcon from "../../assets/search.svg?react";
import Book from "../../assets/book.svg?react";
import { useState, useEffect } from "react";
import api from "../../services/api";

export default function InicialProfessor() {
  const navigate = useNavigate();

  const goTo = route => () => {
    navigate(route);
  };

  const goToTurma = idTurma => {
    navigate(`/informacoes-turma/${idTurma}`);
  };

  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTurmas() {
      try {
        const response = await api.get("/turmaRelacao/porProfessor");

        const turmasFormatadas = response.data.map(item => ({
          id: item.id,
          name: item.nomeTurma || "Sem nome",
          subject: item.nomeDisciplina || "Sem disciplina",
          institution: item.nomeInstituicao || "Sem instituição"
        }));

        setItems(turmasFormatadas);
      } catch (error) {
        console.error("Erro ao buscar turmas:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTurmas();
  }, []);

  const filteredItems = items.filter(
    item =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.subject.toLowerCase().includes(query.toLowerCase()) ||
      item.institution.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="inicial-professor-page">
      <Header
        routes={[
          { textButton: "Início", routeButton: "/inicial" },
          { textButton: "Sobre o Projeto", routeButton: "/inicial" },
          { textButton: "Perfil", routeButton: "/editar-dados" }
        ]}
      />

      <div className="inicial-professor-body">
        <div className="inicial-professor-middle-line">
          <h1 className="inicial-professor-middle-text">Turmas</h1>

          <div className="search-container">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              placeholder="Pesquisar por turma, matéria ou instituição..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <button
            className="inicial-professor-middle-button"
            onClick={goTo("/vinculos-professor")}
          >
            <span className="inicial-professor-middle-button-text">
              Gerenciar Instituições
            </span>
          </button>
        </div>

        <div className="inicial-professor-cards-container">
          {loading ? (
            <p>Carregando turmas...</p>
          ) : (
            <>
              {filteredItems.map((item, index) => (
                <div
                  key={index}
                  className="inicial-professor-card"
                  onClick={() => goToTurma(item.id)}
                >
                  <div className="card-header">
                    <Book />
                    <h2 className="inicial-professor-card-title">
                      {item.name}
                    </h2>
                  </div>
                  <p className="card-subject">Disciplina: {item.subject}</p>
                  <p className="card-subject">
                    Instituição: {item.institution}
                  </p>
                </div>
              ))}

              {filteredItems.length === 0 && !loading && (
                <p className="no-results">
                  Nenhum resultado encontrado para "{query}"
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
