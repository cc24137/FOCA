import { useNavigate } from "react-router-dom";
import TituloLateral from "../titulo-lateral";
import HomeIcon from "../../assets/home.svg?react";
import "./auth-layout.css";

export default function AuthLayout({ children, pageClass, onSubmit }) {
  const navigate = useNavigate();

  return (
    <div className={`auth-page ${pageClass}`}>
      <TituloLateral />
      <div className="auth-content">
        <nav className="auth-nav" aria-label="Navegação">
          <button className="auth-home-button" onClick={() => navigate("/")}>
            <div className="auth-home-content">
              <HomeIcon aria-hidden="true" />
              <span>Início</span>
            </div>
          </button>
        </nav>
        {onSubmit ? (
          <form className="auth-form" onSubmit={onSubmit} noValidate>{children}</form>
        ) : (
          <div className="auth-form">{children}</div>
        )}
      </div>
    </div>
  );
}
