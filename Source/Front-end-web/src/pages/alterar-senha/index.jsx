import { useNavigate } from "react-router-dom";
import "./alterar-senha.css";
import TituloLateral from "../../components/titulo-lateral";
import HomeIcon from "../../assets/home.svg?react";
import { useState } from "react";
import EyeOnIcon from "../../assets/eye-on.svg?react"; // open eye
import EyeOffIcon from "../../assets/eye-off.svg?react"; // closed eye
import Asterisk from "../../assets/asterisk.svg?react";
import api from "../../services/api";

export default function AlterarSenha() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);

  function goTo(path, routeState = null) {
    navigate(path, { state: routeState });
  }

  function verifyPassword() {
    if (!passwordTouched) return "";
    if (password === "") return "A senha é obrigatória.";
    if (password.length < 8)
      return "A senha deve conter pelo menos 8 caracteres.";
    if (!/[a-z]/.test(password))
      return "A senha deve conter pelo menos uma letra minúscula.";
    if (!/[A-Z]/.test(password))
      return "A senha deve conter pelo menos uma letra maiúscula.";
    if (!/[0-9]/.test(password))
      return "A senha deve conter pelo menos um número.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
      return "A senha deve conter caracteres especiais.";
    if (password.length > 30)
      return "A senha deve conter no máximo 30 caracteres.";
    return "";
  }

  async function formSubmit() {
    if (
      password !== confirmPassword ||
      password === "" ||
      email === "" ||
      verifyPassword() !== ""
    ) {
      alert("As senhas não coincidem ou algum campo está inválido!");
      return;
    }

    try {
      await api.post("/users/enviarCodigo", { email });

      const dadosParaEnviar = { email: email, password: password };
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // Redireciona enviando o email e a nova senha pelo router state
      goTo(`/codigo-email`, dadosParaEnviar);
    } catch (error) {
      console.error("Erro ao solicitar código de redefinição:", error);
      alert(
        "Ocorreu um erro ao enviar o código para o seu e-mail. Verifique se o endereço está correto."
      );
    }
  }

  return (
    <div className="alterar-senha-body">
      <TituloLateral />

      <div className="alterar-senha-right">
        <div className="alterar-senha-top">
          <button className="alterar-senha-button" onClick={() => goTo("/")}>
            <div className="alterar-senha-content-button">
              <HomeIcon className="home-icon" />
              <span className="alterar-senha-button-text">Início</span>
            </div>
          </button>
        </div>

        <div className="alterar-senha-center">
          <div className="alterar-senha-box">
            <p>Quase lá!</p>
            <p>
              Defina sua nova senha para finalizar a recuperação da sua conta.
            </p>
          </div>

          {/* E-mail */}
          <div className="alterar-senha-field-group">
            <label className="alterar-senha-field-label">E-mail</label>
            <div className="input-wrapper">
              <input
                type="email"
                className="text-field"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Senha */}
          <div className="alterar-senha-field-group">
            <div className="label-with-asterisk">
              <label className="alterar-senha-field-label">Senha</label>
              <Asterisk
                className={`asterisk ${
                  verifyPassword() !== "" ? "visible" : "hidden"
                }`}
              />
              <p className="text-password">{verifyPassword()}</p>
            </div>

            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="text-field with-icon"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (e.target.value.length > 0) setPasswordTouched(true);
                }}
                onBlur={() => setPasswordTouched(true)}
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

          {/* Confirmar Senha */}
          <div className="alterar-senha-field-group">
            <div className="label-with-asterisk">
              <label className="alterar-senha-field-label">
                Confirmar Senha
              </label>
              <Asterisk
                className={`asterisk ${
                  password !== confirmPassword ? "visible" : "hidden"
                }`}
              />
              <p
                className={`text-confirm-password ${
                  password !== confirmPassword ? "visible" : "hidden"
                }`}
              >
                As senhas devem ser iguais.
              </p>
            </div>

            <div className="input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="text-field with-icon"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />

              <button
                type="button"
                className="eye-button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOnIcon /> : <EyeOffIcon />}
              </button>
            </div>
          </div>
        </div>

        <div className="alterar-senha-bottom">
          <button
            className="alterar-senha-submit-button"
            onClick={() => formSubmit()}
          >
            Redefinir Senha
          </button>
        </div>
      </div>
    </div>
  );
}