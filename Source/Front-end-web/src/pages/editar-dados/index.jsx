import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/header";
import api from "../../services/api";
import "./editar-dados.css";
import EyeOnIcon from "../../assets/eye-on.svg?react";
import EyeOffIcon from "../../assets/eye-off.svg?react";

export default function EditarDados() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("@FOCA:user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [nome, setNome] = useState(user ? user.nome : "");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  async function handleSalvar() {
    if (!nome.trim()) {
      alert("O campo Nome não pode ficar vazio!");
      return;
    }

    try {
      await api.put("/users/atualizarPerfil", { nome, senha });

      if (user) {
        const updatedUser = { ...user, nome };
        setUser(updatedUser);
        localStorage.setItem("@FOCA:user", JSON.stringify(updatedUser));
      }

      alert("Perfil atualizado com sucesso!");
      setSenha("");
      setShowPassword(false);
    } catch (error) {
      console.error("Erro ao atualizar o perfil:", error);
      alert("Erro ao atualizar os dados. Tente novamente.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("@FOCA:user");
    localStorage.removeItem("@FOCA:token");
    alert("Você foi desconectado com sucesso.");
    navigate("/login");
  }

  async function handleExcluir() {
    const confirmacao = window.confirm(
      "Tem certeza que deseja excluir sua conta? Esta ação é irreversível e você perderá todas as suas informações."
    );

    if (confirmacao) {
      try {
        if (user.isProfessor) {
          await api.delete("/professor/excluir");
        } else {
          await api.delete("/instituicao/excluir");
        }

        alert("Conta excluída com sucesso.");
        localStorage.removeItem("@FOCA:user");
        localStorage.removeItem("@FOCA:token");
        navigate("/login");
      } catch (error) {
        console.error("Erro ao excluir conta:", error);
        alert("Erro ao excluir a conta. Tente novamente.");
      }
    }
  }

  if (!user) return null;

  return (
    <div className="editar-dados-page">
      <Header
        routes={[
          { textButton: "Início", routeButton: "/inicial-professor" },
          { textButton: "Sobre o Projeto", routeButton: "/inicial-professor" },
          { textButton: "Vínculos", routeButton: "/vinculos-professor" }
        ]}
      />

      <div className="editar-dados-middle">
        <div className="editar-dados-box">
          
          {/* TOPO DO CARD: Título + Botão Sair com Ícone */}
          <div className="editar-dados-header-zone">
            <h1 className="editar-dados-title">Edite seus dados</h1>
            <button className="btn-logout-top" onClick={handleLogout} title="Sair da Conta">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="logout-icon">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Sair</span>
            </button>
          </div>

          {/* MEIO DO CARD: Inputs */}
          <div className="editar-dados-inputs">
            <div className="input-field">
              <label htmlFor="nome">Nome</label>
              <input
                type="text"
                id="nome"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Seu nome"
                className="text-field"
              />
            </div>

            <div className="input-field">
              <label htmlFor="senha">Nova Senha</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="senha"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="Digite sua nova senha (opcional)"
                  className="text-field with-icon"
                />
                <button
                  type="button"
                  className="eye-button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOnIcon /> : <EyeOffIcon />}
                </button>
              </div>
            </div>
          </div>

          {/* BASE DO CARD: Apenas as ações do formulário */}
          <div className="editar-dados-buttons">
            <button className="btn-excluir" onClick={handleExcluir}>
              <span className="btn-excluir-text">Excluir Conta</span>
            </button>

            <button className="btn-salvar" onClick={handleSalvar}>
              <span className="btn-salvar-text">Salvar</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}