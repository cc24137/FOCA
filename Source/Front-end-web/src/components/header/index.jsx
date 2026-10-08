import "./header.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import UserIcon from "../../assets/user.svg?react";
import HomeIcon from "../../assets/home.svg?react";
import InfoIcon from "../../assets/info.svg?react";
import FocaLogoImg from "../../assets/foca_logo.png";

export default function Header({ routes, sticky = false }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { signed, user } = useAuth();
    const dashboardPath = user?.isProfessor ? "/inicial-professor" : "/inicial-instituicao";
    const isDashboardPage = pathname.replace(/\/+$/, "") === dashboardPath;
    const showDashboardLink = signed && user && !isDashboardPage;
    const homeLink = {
        textButton: showDashboardLink
            ? user.isProfessor ? "Inicial Professor" : "Inicial Instituição"
            : "Inicial",
        routeButton: showDashboardLink ? dashboardPath : "/"
    };

    const rotasPadrao = [
        { textButton: "Início", routeButton: "/" },
        { textButton: "Sobre o Projeto", routeButton: "/sobre-projeto" },
        { textButton: "Perfil", routeButton: "/perfil" }
    ];
    
    const rotasAtivas = (routes && routes.length > 0 ? routes : rotasPadrao).map((link, index) => {
        if (index === 0) return homeLink;
        if (index === 1) return { ...link, routeButton: "/sobre-projeto" };
        return link;
    });

    function goTo(route) {
        if (route) navigate(route);
    }

    const getIcon = (index) => {
        if (index === 0) return <HomeIcon className="home-icon" />;
        if (index === 1) return <InfoIcon className="info-icon" />;
        return <UserIcon className="user-icon" />;
    };

    return (
        <header className={`header${sticky ? " header--sticky" : ""}`}>
            <div className="header-elements">
                <div className="header-left">
                    <img src={FocaLogoImg} alt="Logo Foca" className="header-logo" /> 
                    <h1 className="header-title">FOCA</h1>
                </div>

                <div className="header-right">
                    {rotasAtivas.map((link, index) => (
                        <button
                            key={index}
                            className={index === 2 ? "header-button" : "header-link"}
                            onClick={() => goTo(link.routeButton)}
                        >
                            <div className="content-button">
                                {getIcon(index)}
                                {link.textButton}
                            </div>
                        </button>
                    ))}
                </div>
              </div>
            
        </header>
    );
}
