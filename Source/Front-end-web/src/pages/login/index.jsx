import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./login.css";
import AuthLayout from "../../components/auth-layout";
import EyeOnIcon from "../../assets/eye-on.svg?react"; // open eye
import EyeOffIcon from "../../assets/eye-off.svg?react"; // closed eye

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  function goTo(path) {
    navigate(path);
  }

  async function formSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    if (email === "" || password === "") {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(email, password);

      if (user) {
        if (user.isProfessor) {
          goTo("/inicial-professor");
        } else {
          goTo("/inicial-instituicao");
        }
      }
    } catch (error) {
      // catches errors from API
      if (error.response) {
        const errorMessage = error.response.data.message;
        console.log("Erro da API:", errorMessage);

        if (errorMessage === "Email not verified") {
          alert(
            "Email não verificado. Por favor, verifique seu email para concluir o cadastro."
          );
          goTo("/codigo-email");
        } else if (errorMessage === "Incorrect password") {
          alert("Senha incorreta. Por favor, tente novamente.");
          setPassword("");
        } else if (
          errorMessage === "User not found" ||
          error.response.status === 404
        ) {
          alert(
            "Nenhum usuário encontrado com essas credenciais. Por favor, verifique seu email e senha."
          );
          setEmail("");
          setPassword("");
        } else {
          alert("Ocorreu um erro inesperado. Tente novamente mais tarde.");
        }
      } else {
        alert("Erro de conexão com o servidor.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout pageClass="login-body" onSubmit={formSubmit}>
        <div className="login-center">
          {/* O Título de Login agora fica aqui, logo acima dos campos */}
          <h2 className="login-title-text">Login</h2>

          <div className="login-field-group">
            <label className="login-field-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="login-text-field"
              placeholder=""
            />
          </div>

          <div className="login-field-group">
            <label className="login-field-label">Senha</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="login-text-field with-icon"
                value={password}
                onChange={e => setPassword(e.target.value)}
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

          <div className="forgot-password">
            <span
              className="redirect-to-esqueceu-senha"
              onClick={() => goTo("/alterar-senha")}
            >
              Esqueci minha senha
            </span>
          </div>
        </div>

        <div className="login-bottom">
          <button type="submit" className="login-submit-button" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
          <div className="text-to-cadastro">
            <p>
              Ainda não possui uma conta?{" "}
              <span
                className="redirect-to-cadastro"
                onClick={() => goTo("/cadastro")}
              >
                Acesse o Cadastro aqui!
              </span>
            </p>
          </div>
        </div>
    </AuthLayout>
  );
}
