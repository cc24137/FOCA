import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import "./vinculos-professor.css";
import api from "../services/api";

import IconPendente from "../assets/bookmark.svg?react";
import IconVinculado from "../assets/file-text.svg?react";

export default function VinculosProfessor() {
  const navigate = useNavigate();

  const [vinculos, setVinculos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVinculos();
  }, []);

  async function fetchVinculos() {
    try {
      const response = await api.get("/professor/vinculosInstituicao");

      const vinculosFormatados = response.data.map(v => ({
        id: v.id,
        nome: v.nome,
        turmas: v.turmas || 0,
        status: v.professorAceitou ? "vinculado" : "pendente"
      }));

      setVinculos(vinculosFormatados);
    } catch (error) {
      console.error("Erro ao buscar vínculos:", error);

      // Se o token for inválido, não existir ou expirar (erro 401/403)
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAceitar(instituicaoId) {
    try {
      await api.put("/professor/aceitarConvite", { instituicaoId });

      setVinculos(prevVinculos =>
        prevVinculos.map(v =>
          v.id === instituicaoId ? { ...v, status: "vinculado" } : v
        )
      );
      alert("Convite aceito com sucesso!");
    } catch (error) {
      console.error("Erro ao aceitar convite:", error);
      alert("Erro ao aceitar o convite. Tente novamente.");
    }
  }

  async function handleRecusar(instituicaoId) {
    try {
      await api.delete("/professor/recusarConvite", {
        data: { instituicaoId }
      });

      setVinculos(prevVinculos =>
        prevVinculos.filter(v => v.id !== instituicaoId)
      );
    } catch (error) {
      console.error("Erro ao recusar convite:", error);
      alert("Erro ao recusar o convite. Tente novamente.");
    }
  }

  async function handleSair(instituicaoId) {
    const confirmacao = window.confirm(
      "Tem certeza que deseja sair desta instituição? Você perderá o acesso às turmas."
    );

    if (confirmacao) {
      try {
        await api.delete("/professor/recusarConvite", {
          data: { instituicaoId }
        });

        setVinculos(prevVinculos =>
          prevVinculos.filter(v => v.id !== instituicaoId)
        );
        alert("Você saiu da instituição.");
      } catch (error) {
        console.error("Erro ao sair da instituição:", error);
        alert("Erro ao tentar sair. Tente novamente.");
      }
    }
  }

  return (
    <div className="vinculos-page">
      <Header
        routes={[
          { textButton: "Início", routeButton: "/inicial-professor" },
          { textButton: "Sobre o Projeto", routeButton: "/inicial-professor" },
          { textButton: "Perfil", routeButton: "/editar-dados" }
        ]}
      />

      <div className="vinculos-body">
        <div className="vinculos-title-wrapper">
          <h1 className="vinculos-title">Vínculos a instituições</h1>
        </div>

        <div className="vinculos-grid">
          {loading ? (
            <p>Carregando vínculos...</p>
          ) : (
            <>
              {vinculos.map(vinculo =>
                vinculo.status === "pendente" ? (
                  <div key={vinculo.id} className="vinculo-card">
                    <div className="vinculo-card-header">
                      <IconPendente />
                      <span className="vinculo-card-title">{vinculo.nome}</span>
                    </div>
                    <p className="vinculo-card-pending-label">
                      Pedido para participação
                    </p>
                    <div className="vinculo-card-actions">
                      <button
                        className="btn-aceitar"
                        onClick={() => handleAceitar(vinculo.id)}
                      >
                        Aceitar
                      </button>
                      <button
                        className="btn-recusar"
                        onClick={() => handleRecusar(vinculo.id)}
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={vinculo.id} className="vinculo-card">
                    <div className="vinculo-card-header">
                      <IconVinculado className="vinculo-card-icon" />
                      <span className="vinculo-card-title">{vinculo.nome}</span>
                    </div>
                    <p className="vinculo-card-info">
                      Nº de turmas: <span>{vinculo.turmas}</span>
                    </p>
                    <button
                      className="btn-sair"
                      onClick={() => handleSair(vinculo.id)}
                    >
                      Sair da instituição
                    </button>
                  </div>
                )
              )}

              {vinculos.length === 0 && (
                <p className="no-vinculos-message">
                  Nenhum vínculo encontrado.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
