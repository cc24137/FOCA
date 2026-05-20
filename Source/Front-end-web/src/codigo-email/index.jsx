import { useNavigate, useLocation } from "react-router-dom";
import TituloLateral from "../components/titulo-lateral";
import HomeIcon from "../assets/home.svg?react";
import "./codigo-email.css";
import OtpInput from "react-otp-input";
import { useState } from "react";
import api from "../services/api";

export default function CodigoEmail() {
  const navigate = useNavigate();
  const location = useLocation();

  // Recebe o email e a senha passados pelo router
  const email = location.state?.email || "";
  const password = location.state?.password || ""; // Virá preenchido apenas se vier da tela AlterarSenha

  const [code, setCode] = useState("");

  function maskEmail(email) {
    if (!email) return "";

    const [name, domain] = email.split("@");
    if (!domain) return email; // Retorno de segurança caso não encontre o "@"

    // Se o nome tiver apenas 1 ou 2 caracteres (ex: oi@email.com)
    if (name.length <= 2) {
      return `${name[0]}***@${domain}`;
    }

    // Pega as duas primeiras letras e a última letra antes do @
    const firstPart = name.slice(0, 2);
    const lastPart = name.slice(-1);

    return `${firstPart}***${lastPart}@${domain}`;
  }

  function goTo(path) {
    navigate(path);
  }

  async function formSubmit() {
    if (code.length !== 6) {
      alert("Código inválido! O código deve conter 6 dígitos.");
      return;
    }

    if (!email) {
      alert(
        "Email não encontrado. Por favor, volte e faça o processo novamente."
      );
      return;
    }

    try {
        // redefinir a senha
      if (password) {
        const response = await api.put("/users/mudarSenha", {
          email: email,
          code: code,
          password: password
        });

        console.log("Resposta alterar senha:", response.data);
        alert("Senha redefinida com sucesso!");
        goTo("/login");
      }
      // validar cadastro
      else {
        const response = await api.put("/users/validarCodigo", {
          email: email,
          code: code
        });

        console.log("Resposta validar cadastro:", response.data);
        alert("Conta validada com sucesso!");
        goTo("/login");
      }
    } catch (error) {
      console.error(error);
      if (error.response?.status === 400 || error.code == 400) {
        alert("Código inválido ou expirado, tente novamente.");
      } else {
        alert("Erro ao validar o código. Verifique e tente novamente.");
      }
    }
  }

  async function handleResendCode() {
    if (!email) return;
    try {
      await api.post("/users/enviarCodigo", { email });
      alert("Código reenviado para o seu e-mail!");
    } catch (error) {
      console.error(error);
      alert("Erro ao reenviar o código.");
    }
  }

  return (
    <div className="codigo-email-body">
      <TituloLateral />

      <div className="codigo-email-right">
        <button className="codigo-email-button" onClick={() => goTo("/")}>
          <div className="codigo-email-content-button">
            <HomeIcon className="home-icon" />
            <span className="codigo-email-button-text">Início</span>
          </div>
        </button>

        <div className="codigo-email-center">
          <div className="codigo-email-box">
            <p>
              Enviamos um código de verificação para o email{" "}
              <strong>{email ? maskEmail(email) : "********"}</strong>
            </p>
            <p>Insira o código abaixo para continuar.</p>
          </div>

          <div className="codigo-email-container-code">
            <h1 className="codigo-email-title-code">Código de Verificação</h1>
            <OtpInput
              containerStyle="codigo-email-otp-container"
              value={code}
              onChange={setCode}
              numInputs={6}
              inputType="tel"
              renderInput={props => (
                <input {...props} className="codigo-email-otp-inputs" />
              )}
            />
          </div>
        </div>

        <div className="codigo-email-bottom">
          <button
            className="codigo-email-submit-button"
            onClick={() => formSubmit()}
          >
            Confirmar
          </button>
          <p className="codigo-email-text-code">
            Não recebeu o código?{" "}
            <span
              className="codigo-email-resend-code"
              onClick={handleResendCode}
              style={{ cursor: "pointer" }}
            >
              Clique aqui para reenviar
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
