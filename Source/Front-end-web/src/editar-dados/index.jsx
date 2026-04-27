import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header';
import "./editar-dados.css"

export default function EditarDados(){
    const [nome, setNome] = useState('');
    const [senha, setSenha] = useState('');

    return (
        <div className='editar-dados-body'>
            <Header />

            <div className='editar-dados-middle'>
                <div className='editar-dados-box'>
                    <p className='editar-dados-title'>Edite seus dados</p>

                    <div className='editar-dados-inputs'>
                        <div className='input-field'>
                            <label htmlFor="nome">Nome</label>
                            <input
                                type="text"
                                id="nome"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Seu nome"
                            />
                        </div>

                        <div className='input-field'>
                            <label htmlFor="senha">Senha</label>
                            <input
                                type="password"
                                id="senha"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                placeholder="Sua senha"
                            />
                        </div>
                    </div>

                    <div className='editar-dados-buttons'>
                        <button className='btn-excluir'>
                            <p className='btn-excluir-text'>Excluir Conta</p>
                        </button>

                        <button className='btn-salvar'>
                            <p className='btn-salvar-text'>Salvar</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}