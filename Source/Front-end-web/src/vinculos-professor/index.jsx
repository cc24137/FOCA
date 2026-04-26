import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header';
import "./vinculos-professor.css";

import IconPendente from "../assets/bookmark.svg?react";
import IconVinculado from "../assets/file-text.svg?react";

export default function VinculosProfessor() {
    const navigate = useNavigate();

    const vinculos = [
        { id: 1, nome: "NomeInstituição", turmas: null, status: "pendente" },
        { id: 2, nome: "NomeInstituição", turmas: 4,    status: "vinculado" },
        { id: 3, nome: "NomeInstituição", turmas: 2,    status: "vinculado" },
        { id: 4, nome: "NomeInstituição", turmas: 6,    status: "vinculado" },
    ];

    function handleAceitar(id) {

    }

    function handleRecusar(id) {

    }

    function handleSair(id) {

    }

    return (
        <div className="vinculos-page">
            <Header
                routes={[
                    { textButton: "Início",         routeButton: "/inicial"      },
                    { textButton: "Sobre o Projeto", routeButton: "/inicial"     },
                    { textButton: "Perfil",          routeButton: "/editar-dados" },
                ]}
            />

            <div className="vinculos-body">
                <div className="vinculos-title-wrapper">
                    <h1 className="vinculos-title">Vínculos a instituições</h1>
                </div>

                <div className="vinculos-grid">
                    {vinculos.map(vinculo => (
                        vinculo.status === "pendente"
                            ? (
                                <div key={vinculo.id} className="vinculo-card">
                                    <div className="vinculo-card-header">
                                        <IconPendente />
                                        <span className="vinculo-card-title">{vinculo.nome}</span>
                                    </div>
                                    <p className="vinculo-card-pending-label">Pedido para participação</p>
                                    <div className="vinculo-card-actions">
                                        <button className="btn-aceitar" onClick={() => handleAceitar(vinculo.id)}>
                                            Aceitar
                                        </button>
                                        <button className="btn-recusar" onClick={() => handleRecusar(vinculo.id)}>
                                            Recusar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div key={vinculo.id} className="vinculo-card">
                                    <div className="vinculo-card-header">
                                        <IconVinculado />
                                        <span className="vinculo-card-title">{vinculo.nome}</span>
                                    </div>
                                    <p className="vinculo-card-info">
                                        Nº de turmas: <span>{vinculo.turmas}</span>
                                    </p>
                                    <button className="btn-sair" onClick={() => handleSair(vinculo.id)}>
                                        Sair da instituição
                                    </button>
                                </div>
                            )
                    ))}

                    {vinculos.length === 0 && (
                        <p style={{ color: "#888", fontFamily: "var(--font-inter)" }}>
                            Nenhum vínculo encontrado.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
