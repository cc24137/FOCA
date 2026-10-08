import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/header";
import ConfirmPopup from "../../components/confirm-popup";
import "./vinculos-professor.css";
import api from "../../services/api";

import IconPendente from "../../assets/bookmark.svg?react";
import IconVinculado from "../../assets/file-text.svg?react";

export default function VinculosProfessor() {
  const navigate = useNavigate();

  const [vinculos, setVinculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmacaoRemocao, setConfirmacaoRemocao] = useState(null);
  const [removendo, setRemovendo] = useState(false);
  const [erroRemocao, setErroRemocao] = useState('');
  const remocaoEmAndamento = useRef(false);

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

  function handleRecusar(instituicaoId) {
    const vinculo = vinculos.find(item => item.id === instituicaoId);
    if (!vinculo || remocaoEmAndamento.current) return;
    setErroRemocao('');
    setConfirmacaoRemocao({
      tipo: 'recusar',
      id: vinculo.id,
      titulo: 'Recusar convite?',
      mensagem: `Tem certeza que deseja recusar o convite de ${vinculo.nome}?`,
      textoConfirmar: 'Recusar convite'
    });
  }

  function handleSair(instituicaoId) {
    const vinculo = vinculos.find(item => item.id === instituicaoId);
    if (!vinculo || remocaoEmAndamento.current) return;
    setErroRemocao('');
    setConfirmacaoRemocao({
      tipo: 'sair',
      id: vinculo.id,
      titulo: 'Sair da instituição?',
      mensagem: `Tem certeza que deseja sair de ${vinculo.nome}? Você perderá o acesso às turmas desta instituição.`,
      textoConfirmar: 'Sair da instituição'
    });
  }

  function cancelarRemocao() {
    if (remocaoEmAndamento.current) return;
    setConfirmacaoRemocao(null);
    setErroRemocao('');
  }

  async function confirmarRemocao() {
    if (!confirmacaoRemocao || remocaoEmAndamento.current) return;
    const alvo = confirmacaoRemocao;
    remocaoEmAndamento.current = true;
    setRemovendo(true);
    setErroRemocao('');

    try {
      await api.delete("/professor/recusarConvite", {
        data: { instituicaoId: alvo.id }
      });

      setVinculos(prevVinculos => prevVinculos.filter(v => v.id !== alvo.id));
      setConfirmacaoRemocao(null);
      if (alvo.tipo === 'sair') alert("Você saiu da instituição.");
    } catch (error) {
      console.error("Erro ao remover vínculo:", error);
      setErroRemocao(alvo.tipo === 'recusar'
        ? "Erro ao recusar o convite. Tente novamente."
        : "Erro ao tentar sair. Tente novamente.");
    } finally {
      remocaoEmAndamento.current = false;
      setRemovendo(false);
    }
  }

  return (
    <div className="vinculos-page">
      <Header
        routes={[
          { textButton: "Início", routeButton: "/inicial-professor" },
          { textButton: "Sobre o Projeto", routeButton: "/" },
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
                      <IconPendente className="vinculo-card-pending-icon" />
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
      <ConfirmPopup
        isOpen={confirmacaoRemocao !== null}
        title={confirmacaoRemocao?.titulo}
        message={confirmacaoRemocao?.mensagem || ''}
        confirmText={confirmacaoRemocao?.textoConfirmar}
        onConfirm={confirmarRemocao}
        onCancel={cancelarRemocao}
        isLoading={removendo}
        errorMessage={erroRemocao}
      />
    </div>
  );
}
