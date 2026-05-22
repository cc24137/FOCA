import { useNavigate } from 'react-router-dom';
import Header from '../components/header';
import Footer from '../components/footer'
import Divider from '../components/divider';
import './inicial.css'
import BookIcon from '../assets/book.svg?react';
import BookmarkIcon from '../assets/bookmark.svg?react';
import CheckIcon from '../assets/check.svg?react';
import SealIcon from '../assets/seal.svg?react';
import LockIcon from '../assets/lock.svg?react';

export default function Inicial(){
    const navigate = useNavigate()

    function goTo(path){
        navigate(path)
    }

    return(
        <div className='inicial-body'>
            <Header
            titulo="FOCA"
            links={[
                { texto: "Início", destino: "/" },
                { texto: "Criar conta", destino: "/cadastro" }
            ]}
            />
            
            <div className='inicial-content'>

                <div className='inicial-intro'>
                    <div className='inicial-intro-left'>
                        <p className='inicial-intro-title'><span className='inicial-intro-title-span'>F</span>erramenta de</p>
                        <p className='inicial-intro-title'><span className='inicial-intro-title-span'>O</span>bservação e</p>
                        <p className='inicial-intro-title'><span className='inicial-intro-title-span'>C</span>lassificação de</p>
                        <p className='inicial-intro-title'><span className='inicial-intro-title-span'>A</span>tenção</p>
                    </div>

                    <div className='inicial-intro-right'>
                        <div className='inicial-intro-top'>
                            <p className='inicial-intro-top-title'>
                                Uma Nova Forma de <span className='inicial-intro-top-title-span'>Entender</span> Suas Turmas
                            </p>
                            
                        </div>

                        <div className='inicial-intro-bottom'>
                            <p className='inicial-intro-text'>
                                Identificação e análise de atenção que mostram a recepção da didática pela turma.
                            </p>
                        </div>
                    </div>
                </div>

                <Divider />

                <div className='inicial-test-offer'>
                    <p className='inicial-test-offer-title'>Teste <span className='inicial-test-offer-title-span'>agora</span> sem criar uma conta!</p>
                    <p className='inicial-test-offer-text'>Utilize a versão teste da análise de vídeos e geração de relatório</p>
                    <button className='inicial-test-offer-button' onClick={() => goTo("/teste-video")}>
                        <p className='inicial-test-offer-button-text'>Acesse aqui</p>
                    </button>
                </div>

                <Divider />

                <div className='inicial-how-it-works'>
                    <div className='inicial-how-it-works-top-row'>
                        <BookIcon className='inicial-how-it-works-icon' />
                        <p className='inicial-how-it-works-title'>Como <span className='inicial-how-it-works-title-span'>funciona</span> ?</p>
                    </div>

                    <div className='inicial-how-it-works-cards-row'>
                        <div className='inicial-how-it-works-cards-element'>
                            <p className='inicial-how-it-works-card-title'>1. Acesse a plataforma</p>
                            <div className='inicial-how-it-works-card'>
                                <p className='inicial-how-it-works-card-text'>Faça login ou cadastre-se como um professor ou instituição.</p>
                            </div>
                        </div>

                        <div className='inicial-how-it-works-cards-element'>
                            <p className='inicial-how-it-works-card-title'>2. Selecione uma turma</p>
                            <div className='inicial-how-it-works-card'>
                                <p className='inicial-how-it-works-card-text'>Após a instituição criar a turma e vinculá-la ao professor, ele pode então acessá-las pela sua tela inicial.</p>
                            </div>
                        </div>
                    </div>

                    <div className='inicial-how-it-works-cards-row'>
                        <div className='inicial-how-it-works-cards-element'>
                            <p className='inicial-how-it-works-card-title'>3. Crie uma nova aula</p>
                            <div className='inicial-how-it-works-card'>
                                <p className='inicial-how-it-works-card-text'>Na área da turma, o professor pode registrar uma nova aula, adicionando informações sobre ela.</p>
                            </div>
                        </div>

                        <div className='inicial-how-it-works-cards-element'>
                            <p className='inicial-how-it-works-card-title'>4. Anexe o vídeo</p>
                            <div className='inicial-how-it-works-card'>
                                <p className='inicial-how-it-works-card-text'>Ao criar a aula, anexe o arquivo da gravação da turma para análise.</p>
                            </div>
                        </div>
                    </div>

                    <div className='inicial-how-it-works-cards-row'>
                        <div className='inicial-how-it-works-cards-element'>
                            <p className='inicial-how-it-works-card-title'>5. Espere os resultados !</p>
                            <div className='inicial-how-it-works-card'>
                                <p className='inicial-how-it-works-card-text'>Após o processamento, a plataforma gerará um relatório compreensivo dos dados obtidos do vídeo.</p>
                            </div>
                        </div>

                        <div className='inicial-how-it-works-cards-element'>
                            <p className='inicial-how-it-works-card-title'>6.Compare diferentes aulas</p>
                            <div className='inicial-how-it-works-card'>
                                <p className='inicial-how-it-works-card-text'>Gráficos da atenção da aula individual e comparações com outras aulas. Relatório em formato PDF também!</p>
                            </div>
                        </div>
                    </div>
                </div>

                <Divider />

                <div className='inicial-goals'>
                    <div className='inicial-goals-top-row'>
                        <BookmarkIcon className='inicial-goals-icon' />
                        <p className='inicial-goals-title'>Objetivos</p>

                        <div className='inicial-goals-content'>
                            <div className='inicial-goals-right'>
                                <div className='inicial-goals-right-row'>
                                    <CheckIcon />
                                    <p className='inicial-goals-right-row-text'>Trazer uma nova forma de avaliar as próprias aulas.</p>
                                </div>

                                <div className='inicial-goals-right-row'>
                                    <CheckIcon />
                                    <p className='inicial-goals-right-row-text'>Proporcionar novos parâmetros de avaliação das turmas.</p>
                                </div>

                                <div className='inicial-goals-right-row'>
                                    <CheckIcon />
                                    <p className='inicial-goals-right-row-text'>Melhorar a forma em que os professores compreendem suas turmas e didátiacas.</p>
                                </div>
                            </div>

                            <div className='inicial-goals-left'>
                                <SealIcon />
                            </div>

                        </div>
                    </div>
                </div>

                <Divider />

                <div className='inicial-security'>
                    <div className='inicial-instituicao-top-row'>
                        <LockIcon />
                        <p className='inicial-security-title'></p>
                    </div>

                    <div className='inicial-security-content'>
                        <div className='inicial-security-content-row'>
                            <CheckIcon />
                            <p className='inicial-security-content-row-text'>Nenhum dado cadastrado de professores, instituições ou turmas é público.</p>
                        </div>

                        <div className='inicial-security-content-row'>
                            <CheckIcon />
                            <p className='inicial-security-content-row-text'>As imagens usadas não são armazenadas, são apenas processadas localmente.</p>
                        </div>

                        <div className='inicial-security-content-row'>
                            <CheckIcon />
                            <p className='inicial-security-content-row-text'>Quaisquer informações de alunos obtidas via imagens são usadas apenas para os relatórios gerados, que não incluem identificação do aluno</p>
                        </div>

                        <div className='inicial-security-content-row'>
                            <CheckIcon />
                            <p className='inicial-security-content-row-text'>Dados sensíveis são criptografados e seguros.</p>
                        </div>
                    </div>

                </div>

                <Divider />

                <div className='inicial-our-values'>
                    <div className='inicial-our-values-left'>

                    </div>

                    <div className='inicial-our-values-right'>
                        <div className='inicial-our-values-right-title-row'>
                            <BookmarkIcon />
                            <p className='inicial-our-values-title'>Nossos Valores</p>
                        </div>

                        <div className='inicial-our-values-card'>
                            <p className='inicial-our-values-card-text'>
                                Buscamos trazer uma forma acessível para que professores possam explorar os resultados de suas didáticas.
                            </p>
                        </div>

                        <div className='inicial-our-values-card'>
                            <p className='inicial-our-values-card-text'>
                                Prezamos pela segurança dos dados usados, principalmente com o tratamento de informações sensíveis.
                            </p>
                        </div>
                        
                    </div>
                </div>

            </div>

            <Footer />
        </div>
        
    )
}