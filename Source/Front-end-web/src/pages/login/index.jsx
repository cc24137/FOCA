import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./login.css";
import AuthLayout from "../../components/auth-layout";
import EyeOnIcon from "../../assets/eye-on.svg?react"; // open eye
import EyeOffIcon from "../../assets/eye-off.svg?react";
import { useToast } from '../../components/toast'; // closed eye

export default function Login() {
  const { showToast } = useToast();
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
      showToast("Por favor, preencha todos os campos.", { type: 'warning' });
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
          showToast("Email não verificado. Por favor, verifique seu email para concluir o cadastro.", { type: 'warning' });
          goTo("/codigo-email");
        } else if (errorMessage === "Incorrect password") {
          showToast("Senha incorreta. Por favor, tente novamente.", { type: 'error' });
          setPassword("");
        } else if (
          errorMessage === "User not found" ||
          error.response.status === 404
        ) {
          showToast("Nenhum usuário encontrado com essas credenciais. Por favor, verifique seu email e senha.", { type: 'error' });
          setEmail("");
          setPassword("");
        } else {
          showToast("Ocorreu um erro inesperado. Tente novamente mais tarde.", { type: 'error' });
        }
      } else {
        showToast("Erro de conexão com o servidor.", { type: 'error' });
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
