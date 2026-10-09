import { useNavigate } from "react-router-dom";
import "./cadastro.css";
import SeletorTipo from "../../components/selecionar-tipo";
import { useState, useEffect } from "react";
import EyeOnIcon from "../../assets/eye-on.svg?react";
import EyeOffIcon from "../../assets/eye-off.svg?react";
import AuthLayout from "../../components/auth-layout";
import api from "../../services/api";
import Asterisk from "../../assets/asterisk.svg?react";
import { useToast } from '../../components/toast';

export default function Cadastro() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState("professor");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
    isProfessor: true
  });

  const [confirmarSenha, setConfirmarSenha] = useState("");

  useEffect(() => {
    setForm(prevForm => ({
      ...prevForm,
      isProfessor: selectedType === "professor"
    }));
  }, [selectedType]);

  function goTo(path, routeState = null) {
    navigate(path, { state: routeState });
  }

  function handleChange(e) {
    const { id, value } = e.target;
    setForm({
      ...form,
      [id]: value
    });

    if (id === "password" && value.length > 0) {
      setPasswordTouched(true);
    }
  }

  async function formSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    if (
      form.password !== confirmarSenha ||
      form.password === "" ||
      form.email === "" ||
      form.name === "" ||
      verifyPassword() !== ""
    ) {
      showToast("As senhas não coincidem ou algum campo está inválido!", { type: 'warning' });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.post("/users/cadastro", form);

      if (response.status === 201 || response.status === 200) {
        const userEmail = form.email;
        setForm({ email: "", name: "", password: "", isProfessor: true });
        setConfirmarSenha("");
        showToast("Conta criada! Verifique seu e-mail para concluir o cadastro.", { type: 'success' });
        goTo(`/codigo-email`, { email: userEmail });
      } else {
        showToast("Erro ao criar a conta.", { type: 'error' });
      }
    } catch (error) {
      console.error(error);
      showToast("Erro ao criar a conta. Verifique os dados e tente novamente.", { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }

  function verifyPassword() {
    if (!passwordTouched) return "";
    if (form.password === "") return "A senha é obrigatória.";
    if (form.password.length < 8) return "A senha deve conter pelo menos 8 caracteres.";
    if (!/[a-z]/.test(form.password)) return "A senha deve conter pelo menos uma letra minúscula.";
    if (!/[A-Z]/.test(form.password)) return "A senha deve conter pelo menos uma letra maiúscula.";
    if (!/[0-9]/.test(form.password)) return "A senha deve conter pelo menos um número.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) return "A senha deve conter caracteres especiais.";
    if (form.password.length > 30) return "A senha deve conter no máximo 30 caracteres.";
    return "";
  }

  return (
    <AuthLayout pageClass="cadastro-body" onSubmit={formSubmit}>
        <h2 className="sign-in-title-text">Cadastro</h2>

        <div className="seletor-cadastro-wrapper">
          <SeletorTipo option={selectedType} onSelect={setSelectedType} />
        </div>

        <div className="sign-in-center">
          <div className="field-group">
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="text-field"
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="name">
              Nome {selectedType === "professor" ? "do " : "da "} {selectedType}
            </label>
            <input
              id="name"
              value={form.name}
              onChange={handleChange}
              className="text-field"
            />
          </div>

          <div className="field-group">
            <div className="label-with-asterisk">
              <label className="field-label">Senha</label>
              <Asterisk className={`asterisk ${verifyPassword() !== "" ? "visible" : "hidden"}`} />
              <p className="text-password">{verifyPassword()}</p>
            </div>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="text-field with-icon"
                value={form.password}
                onChange={handleChange}
                onBlur={() => setPasswordTouched(true)}
              />
              <button type="button" className="eye-button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOnIcon /> : <EyeOffIcon />}
              </button>
            </div>
          </div>

          <div className="field-group">
            <div className="label-with-asterisk">
              <label className="field-label">Confirmar Senha</label>
              <Asterisk className={`asterisk ${form.password !== confirmarSenha ? "visible" : "hidden"}`} />
              <p className={`text-confirm-password ${form.password !== confirmarSenha ? "visible" : "hidden"}`}>
                As senhas devem ser iguais.
              </p>
            </div>
            <div className="input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="text-field with-icon"
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
              />
              <button type="button" className="eye-button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <EyeOnIcon /> : <EyeOffIcon />}
              </button>
            </div>
          </div>
        </div>

        <div className="sign-in-bottom">
          <button type="submit" className="sign-in-submit-button" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? "Criando..." : "Criar"}
          </button>
          <div className="text-to-login">
            <p>
              Já tem uma conta?{" "}
              <span className="redirect-to-login" onClick={() => goTo("/login")}>
                Acesse o Login aqui!
              </span>
            </p>
          </div>
        </div>
    </AuthLayout>
  );
}
