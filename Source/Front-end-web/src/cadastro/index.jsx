import { useNavigate } from 'react-router-dom';
import './cadastro.css';
import HomeIcon from "../assets/home.svg?react";
import SeletorTipo from '../components/selecionar-tipo';
import { useState } from "react";
import EyeOnIcon from "../assets/eye-on.svg?react";      // open eye
import EyeOffIcon from "../assets/eye-off.svg?react"; // closed eye
import TituloLateral from '../components/titulo-lateral';
import api from '../services/api';
import Asterisk from '../assets/asterisk.svg?react';

export default function Cadastro(){

    const navigate = useNavigate();
    const [selectedType, setSelectedType] = useState("professor");
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordTouched, setPasswordTouched] = useState(false);

    const [form, setForm] = useState({
        email: "",
        name: "",
        password: "",
        isProfessor: true,
    });

    const [confirmarSenha, setConfirmarSenha] = useState("");

    function goTo(path) {
        navigate(path);
    }

    function handleChange(e) {
        const { id, value } = e.target;
        setForm({
            ...form,
            [id]: value
        });

        if (id === 'password' && value.length > 0) {
            setPasswordTouched(true);
        }
    }

    async function formSubmit(){
        
        if(
            (form.password !== confirmarSenha) ||
            (form.password === "") ||
            (form.email === "") ||
            (form.name === "") ||
            (verifyPassword() !== "")
        ) {
            alert("As senhas não coincidem!");
            return;
        }
        try {
            form.isProfessor = selectedType === "professor";

            const response = await api.post(
                "/users/cadastro",
                form
            );

            console.log(response.data);

            setForm({ email: "", name: "", password: "" });
            setConfirmarSenha("");
            goTo(`/${selectedType === "professor" ? "inicial-professor" : "inicial-instituicao"}`);

        } catch (error) {
            console.error(error);
        }
    }

    function verifyPassword() {
        if (!passwordTouched) return "";
        if (form.password === "") return "A senha é obrigatória.";
        if(form.password.length < 8) return "A senha deve conter pelo menos 8 caracteres.";
        if(!/[a-z]/.test(form.password)) return "A senha deve conter pelo menos uma letra minúscula.";
        if(!/[A-Z]/.test(form.password)) return "A senha deve conter pelo menos uma letra maiúscula.";
        if(!/[0-9]/.test(form.password)) return "A senha deve conter pelo menos um número.";
        if(!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) return "A senha deve conter pelo menos um caractere especial.";
        if(form.password.length > 30) return "A senha deve conter no máximo 30 caracteres.";
        return "";
    }
    return (
        <div className='cadastro-body'>
            {/*esquerda*/}
            <TituloLateral />

            {/*direita*/}
            <div className='right'>
                {/*botao inicio*/}
                <button
                    className="sign-in-button"
                    onClick={() => goTo("/")}
                >
                    <div className="sign-in-content-button">
                        <HomeIcon className="home-icon" />
                        <span className='sign-in-button-text'>Início</span>
                    </div>

                </button>

                <SeletorTipo
                    option={selectedType}
                    onSelect={setSelectedType}
                />
                
                {/*Email da instituição/professor*/}
                <div className='sign-in-center'>
                    <div className="field-group">
                        <label className="field-label" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            className="text-field"
                            placeholder=""
                        />
                    </div>
                    {/*nome da instituição/professor*/}

                    <div className="field-group">
                        <label className="field-label" htmlFor='name'>
                            Nome {selectedType === "professor" ? "do " : "da "} {selectedType}
                        </label>
                        <input
                            id="name"
                            value={form.name}
                            onChange={handleChange}
                            className="text-field"
                            placeholder=""
                        />
                    </div>
                    {/*senha*/}

                    <div className="field-group">
                        <div className="label-with-asterisk">
                            <label className="field-label">Senha</label>
                            <Asterisk className={`asterisk ${verifyPassword() != "" ? "visible" : "hidden"}`} />
                            <p className='text-password'>{verifyPassword()}</p>
                        </div>
                        

                        <div className="input-wrapper">
                            <input
                                id='password'
                                type={showPassword ? "text" : "password"}
                                className={`text-field with-icon `}
                                value={form.password}
                                onChange={handleChange}
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
                    {/*confirmar senha*/}

                    <div className="field-group">
                        <div className="label-with-asterisk">
                            <label className="field-label">Confirmar Senha</label>
                            <Asterisk className={`asterisk ${form.password != confirmarSenha ? "visible" : "hidden"}`} />
                            <p className={`text-confirm-password ${form.password != confirmarSenha ? "visible" : "hidden"}`}>As senhas devem ser iguais.</p>
                        </div>

                        <div className="input-wrapper">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                className={`text-field with-icon `}
                                value={confirmarSenha}
                                onChange={(e) => setConfirmarSenha(e.target.value)}
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
                
                {/*botao*/}

                <div className='sign-in-bottom'>
                    <button 
                        className='sign-in-submit-button'
                        onClick={() => formSubmit()}
                    >
                        Criar
                    </button>
                    {/*texto de redirecionamento para login*/}

                    <div className='text-to-login'>
                        <p>Já tem uma conta? <span className='redirect-to-login' onClick={() => goTo("/login")}>Acesse o Login aqui!</span></p>
                    </div>
                </div>
                
            </div>
        </div>
    )
}