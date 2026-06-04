import "./header.css";
import { useNavigate } from "react-router-dom";
import LogoIcon from "../../assets/seal.svg?react";
import UserIcon from "../../assets/user.svg?react";
import HomeIcon from "../../assets/home.svg?react";
import InfoIcon from "../../assets/info.svg?react";

export default function Header({ routes }) {
    const navigate = useNavigate();

    const rotasPadrao = [
        { textButton: "Início", routeButton: "/" },
        { textButton: "Sobre o Projeto", routeButton: "/" },
        { textButton: "Perfil", routeButton: "/perfil" }
    ];
    
    const rotasAtivas = routes && routes.length > 0 ? routes : rotasPadrao;

    function goTo(route) {
        if (route) navigate(route);
    }

    const getIcon = (index) => {
        if (index === 0) return <HomeIcon className="home-icon" />;
        if (index === 1) return <InfoIcon className="info-icon" />;
        return <UserIcon className="user-icon" />;
    };

    return (
        <header className="header">
            <div className="header-elements">
                <div className="header-left">
                    <LogoIcon className="header-logo" />
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
