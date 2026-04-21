import "./header.css";
import { useNavigate } from "react-router-dom";
import LogoIcon from "../../assets/seal.svg?react";
import UserIcon from "../../assets/user.svg?react";
import HomeIcon from "../../assets/home.svg?react";
import InfoIcon from "../../assets/info.svg?react";

export default function Header({
	routes = [
		{ textButton: "Início", routeButton: "/" },
		{ textButton: "Sobre o Projeto", routeButton: "/" },
		{ textButton: "Perfil", routeButton: "/perfil" },
	],
}) {
	const navigate = useNavigate();

	function goTo(route) {
		navigate(route);
	}

	return (
		<header className="header">
			<div className="header-elements">
				<div className="header-left">

					<LogoIcon className="header-logo" />
					<h1 className="header-title">FOCA</h1>

				</div>

				<div className="header-right">

					<button
						className="header-link"
						onClick={() => goTo(routes[0].routeButton)}
					>
						<div className="content-button">
							<HomeIcon className="home-icon" />
							{routes[0].textButton}
						</div>
					</button>

					<button
						className="header-link"
						onClick={() => goTo(routes[1].routeButton)}
					>
						<div className="content-button">
							<InfoIcon className="info-icon" />
							{routes[1].textButton}
						</div>

					</button>

					<button
						className="header-button"
						onClick={() => goTo(routes[2].routeButton)}
					>
						<div className="content-button">
							<UserIcon className="user-icon" />
							{routes[2].textButton}
						</div>

					</button>
				</div>
			</div>
		</header>
	);
}