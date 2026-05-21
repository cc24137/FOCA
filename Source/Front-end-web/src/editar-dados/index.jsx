import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import api from "../services/api";
import "./editar-dados.css";
import EyeOnIcon from "../assets/eye-on.svg?react";
import EyeOffIcon from "../assets/eye-off.svg?react";

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
    <div className="editar-dados-body">
      <Header
        routes={[
          { textButton: "Início", routeButton: "/inicial-professor" },
          { textButton: "Sobre o Projeto", routeButton: "/inicial-professor" },
          { textButton: "Vínculos", routeButton: "/vinculos-professor" }
        ]}
      />

      <div className="editar-dados-middle">
        <div className="editar-dados-box">
          <p className="editar-dados-title">Edite seus dados</p>

          <div className="editar-dados-inputs">
            <div className="input-field">
              <label htmlFor="nome">Nome</label>
              <input
                type="text"
                id="nome"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Seu nome"
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
                  className="with-icon"
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

          <div className="editar-dados-buttons">
            <button className="btn-excluir" onClick={handleExcluir}>
              <p className="btn-excluir-text">Excluir Conta</p>
            </button>

            <button className="btn-salvar" onClick={handleSalvar}>
              <p className="btn-salvar-text">Salvar</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
