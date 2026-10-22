import React, { useEffect, useState } from 'react';
import Header from '../../components/header';
import Footer from '../../components/footer';
import './sobre-projeto.css';

const sections = [
  { id: 'apresentacao', title: 'O que é o FOCA?' },
  { id: 'motivacao', title: 'Motivação e contexto' },
  { id: 'funcionamento', title: 'Como a análise funciona' },
  { id: 'plataforma', title: 'A plataforma web' },
  { id: 'resultados', title: 'Resultados obtidos' },
  { id: 'limitacoes', title: 'Limitações e desafios' },
  { id: 'privacidade', title: 'Privacidade e uso responsável' },
  { id: 'perspectivas', title: 'Conclusão e próximos passos' },
  { id: 'equipe', title: 'Equipe e orientação' },
  { id: 'referencias', title: 'Referências' },
];

function AboutSection({ id, children }) {
  const section = sections.find((item) => item.id === id);

  return (
    <section
      className="project-about-section"
      id={id}
      aria-labelledby={`${id}-title`}
      tabIndex={-1}
    >
      <h2 id={`${id}-title`}>{section.title}</h2>
      {children}
    </section>
  );
}

export default function SobreProjeto() {
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const [isContentsOpen, setIsContentsOpen] = useState(false);
  const [session] = useState(() => {
    try {
      const isLoggedIn = !!localStorage.getItem('@FOCA:token');
      const user = JSON.parse(localStorage.getItem('@FOCA:user') || 'null');
      return { isLoggedIn, isProfessor: user?.isProfessor === true };
    } catch {
      return { isLoggedIn: false, isProfessor: false };
    }
  });

  const homePath = session.isLoggedIn
    ? session.isProfessor ? '/inicial-professor' : '/inicial-instituicao'
    : '/';

  useEffect(() => {
    const elements = sections
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean);
    let frameId;

    const updateActiveSection = () => {
      // A mesma distância usada nas âncoras mantém o título abaixo do Header.
      const content = document.getElementById('project-about-content');
      const offset = parseFloat(
        getComputedStyle(content).getPropertyValue('--project-about-anchor-offset'),
      ) || 128;
      const current = [...elements]
        .reverse()
        .find((element) => element.getBoundingClientRect().top <= offset + 16);
      const isAtBottom = window.scrollY > 0
        && Math.ceil(window.innerHeight + window.scrollY)
          >= document.documentElement.scrollHeight - 2;

      setActiveSection(isAtBottom
        ? sections[sections.length - 1].id
        : current?.id || sections[0].id);
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, []);

  return (
    <div className="project-about-page">
      <a className="project-about-skip-link" href="#project-about-article">
        Ir para o conteúdo do projeto
      </a>

      <Header sticky titulo="FOCA" routes={[
        { textButton: 'Início', routeButton: homePath },
        { textButton: 'Sobre o Projeto', routeButton: '/sobre-projeto' },
        {
          textButton: session.isLoggedIn ? 'Perfil' : 'Login',
          routeButton: session.isLoggedIn ? '/editar-dados' : '/login',
        },
      ]} />

      <main className="project-about-content" id="project-about-content">
        <header className="project-about-intro" id="topo-projeto">
          <h1>Sobre o <span>projeto</span></h1>
          <p className="project-about-lead">
            Conheça o FOCA: a proposta, o desenvolvimento e os resultados de uma
            ferramenta de apoio à observação de turmas em aulas presenciais.
          </p>
        </header>

        <div className="project-about-layout">
          <aside className="project-about-sidebar">
            <nav className="project-about-toc" aria-label="Sumário do projeto">
              <button
                className="project-about-toc-toggle"
                type="button"
                aria-expanded={isContentsOpen}
                aria-controls="project-about-toc-list"
                onClick={() => setIsContentsOpen((isOpen) => !isOpen)}
              >
                <span>Sumário</span>
                <span aria-hidden="true">{isContentsOpen ? '−' : '+'}</span>
              </button>
              <ol
                className="project-about-toc-list"
                id="project-about-toc-list"
                data-open={isContentsOpen}
              >
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      aria-current={activeSection === section.id ? 'location' : undefined}
                      onClick={() => {
                        setActiveSection(section.id);
                        setIsContentsOpen(false);
                      }}
                    >
                      <span className="project-about-toc-number" aria-hidden="true">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span>{section.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="project-about-article" id="project-about-article" tabIndex={-1} aria-label="Sobre o projeto FOCA">
            <AboutSection id="apresentacao">
              <p>
                O <strong>FOCA — Ferramenta de Observação e Classificação de Atenção</strong> é
                um projeto desenvolvido no Colégio Técnico de Campinas (COTUCA),
                da Universidade Estadual de Campinas. Sua proposta é transformar
                indícios visuais de uma sala de aula em informações que ajudem
                professores e instituições a acompanhar o comportamento coletivo
                dos estudantes.
              </p>
              <p>
                A partir de imagens e vídeos, o sistema detecta rostos, calcula
                indicadores estimados de atenção e organiza sua evolução ao longo
                da aula. Os resultados são apresentados em uma plataforma web,
                com gráficos, histórico e feedbacks que complementam a observação
                e a interpretação do professor.
              </p>
            </AboutSection>

            <AboutSection id="motivacao">
              <p>
                Explicar conteúdos, conduzir atividades e acompanhar a reação dos
                alunos são tarefas que acontecem ao mesmo tempo. Em turmas
                numerosas, perceber quando o comportamento do grupo muda pode
                ser especialmente difícil. O FOCA surgiu do interesse em aplicar
                inteligência artificial a esse desafio do ensino presencial.
              </p>
              <p>
                A literatura discutida no trabalho relaciona o engajamento à
                participação e à aprendizagem, mas também destaca suas dimensões
                comportamentais, emocionais e cognitivas. Por isso, a atenção não
                pode ser resumida à direção do rosto. O projeto se concentra em
                tendências visuais da turma, que precisam ser interpretadas à luz
                da atividade e do contexto da aula.
              </p>
            </AboutSection>

            <AboutSection id="funcionamento">
              <p>
                A análise combina aprendizado de máquina e métodos matemáticos.
                Cada etapa tem uma função específica, da localização dos rostos
                à organização das informações para o docente.
              </p>
              <h3>Detecção de rostos</h3>
              <p>
                Modelos baseados na arquitetura YOLOv8, treinados no projeto com
                o conjunto de dados WIDER FACE, localizam os rostos presentes
                nas imagens. Nos vídeos, a análise utiliza quadros extraídos em
                intervalos configuráveis, equilibrando o detalhamento temporal
                e o tempo de processamento.
              </p>
              <h3>Estimativa dos indicadores</h3>
              <p>
                Um algoritmo geométrico analisa a proporção entre largura e
                altura das regiões faciais detectadas e atribui um índice
                estimado a cada uma. A análise também considera padrões
                coletivos, como vários alunos se voltando para um mesmo ponto
                lateral. A média dos índices compõe o indicador da turma em
                cada instante analisado.
              </p>
              <h3>Interpretação ao longo do tempo</h3>
              <p>
                Os indicadores formam uma série temporal. Um conjunto de regras
                identifica quedas, crescimentos, estabilidade e períodos
                relevantes, além de comparar a aula com o histórico do mesmo
                contexto. Os feedbacks são priorizados e recebem sugestões de
                investigação, intervenção, reforço ou monitoramento.
              </p>
            </AboutSection>

            <AboutSection id="plataforma">
              <p>
                A plataforma reúne o envio de vídeos, a consulta dos resultados
                e o acompanhamento das aulas. Sua organização segue a ideia de
                alfabetização de dados para educadores: apresentar informações
                de forma clara para facilitar sua leitura e seu uso na reflexão
                pedagógica.
              </p>
              <p>
                <strong>Para professores,</strong> a interface oferece acesso às
                turmas e às aulas, gráficos da evolução dos indicadores e
                comparações com registros anteriores. <strong>Para instituições,</strong> reúne
                a gestão de professores, turmas e disciplinas, além de análises
                comparativas conforme as permissões de cada perfil.
              </p>
              <p>
                O desenvolvimento partiu de wireframes e de um protótipo no
                Figma. A solução integra uma interface em React, uma API em
                Node.js, um banco de dados e um serviço de processamento em
                Python com FastAPI.
              </p>
            </AboutSection>

            <AboutSection id="resultados">
              <p>
                As variantes Nano e Small do YOLOv8 foram avaliadas no conjunto
                oficial de validação do WIDER FACE, com 3.226 imagens e 39.707
                rostos anotados. O modelo Small apresentou melhor desempenho
                de detecção, enquanto o Nano exigiu menos tempo de inferência
                nas condições dos testes.
              </p>
              <div className="project-about-table-wrapper">
                <table className="project-about-table" aria-describedby="project-about-metric-note">
                  <caption>Detecção de rostos · Validação WIDER FACE</caption>
                  <thead>
                    <tr>
                      <th scope="col">Modelo</th>
                      <th scope="col">mAP@50</th>
                      <th scope="col">Inferência média</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><th scope="row">YOLOv8 Nano</th><td>73,26%</td><td>10,52 ms/imagem</td></tr>
                    <tr><th scope="row">YOLOv8 Small</th><td>78,00%</td><td>21,22 ms/imagem</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="project-about-note" id="project-about-metric-note">
                <strong>Como ler esses resultados:</strong> mAP@50 é uma métrica
                de qualidade da detecção de rostos. Os valores acima não
                representam a precisão da estimativa de atenção ou uma medida
                da aprendizagem dos estudantes.
              </p>
              <p>
                A estimativa de atenção foi explorada em testes qualitativos
                com imagens de diferentes orientações e enquadramentos.
                A apresentação dos resultados e os feedbacks foram avaliados
                quanto ao funcionamento e à coerência, sem um estudo formal
                de usabilidade ou de impacto pedagógico em aulas reais.
              </p>
            </AboutSection>

            <AboutSection id="limitacoes">
              <p>
                A orientação aparente do rosto é um indício visual e não permite
                determinar diretamente a concentração de um estudante.
                Um aluno pode olhar para baixo para fazer anotações ou
                permanecer voltado para a frente sem acompanhar a explicação.
                O contexto pedagógico é indispensável para interpretar os dados.
              </p>
              <p>
                Iluminação, posição da câmera, rostos pequenos ou parcialmente
                encobertos e variações nas regiões detectadas afetam a análise.
                Na validação, o modelo Small encontrou 69,91% dos rostos
                anotados, indicando que parte deles pode ficar fora do cálculo
                coletivo. As regras de análise também precisam de calibração
                para diferentes turmas e atividades.
              </p>
              <p>
                Uma variação no indicador não explica, por si só, sua causa.
                Os feedbacks apontam momentos que merecem investigação;
                cabe ao professor relacioná-los ao que ocorria na aula e
                decidir sobre possíveis mudanças em sua prática.
              </p>
            </AboutSection>

            <AboutSection id="privacidade">
              <p>
                O projeto adota como diretriz o uso temporário das mídias durante
                a análise e seu descarte após a extração das métricas. A proposta
                documentada é manter, para consulta posterior, os resultados
                derivados e os registros das aulas, sem utilizar os vídeos
                enviados como material de treinamento do modelo.
              </p>
              <p>
                O uso de imagens em ambientes escolares requer cuidados com
                finalidade, acesso e proteção dos participantes. A continuidade
                da pesquisa em salas de aula deve considerar os procedimentos
                de autorização, consentimento e avaliação ética aplicáveis,
                conforme discutido no relatório.
              </p>
            </AboutSection>

            <AboutSection id="perspectivas">
              <p>
                O desenvolvimento do FOCA integrou detecção facial, análise
                geométrica, interpretação temporal e uma interface destinada
                a professores e instituições. Os experimentos evidenciam
                possibilidades de transformar dados visuais em informações
                acessíveis para acompanhar turmas presenciais.
              </p>
              <p>
                Os próximos passos incluem testes sistemáticos em salas de aula,
                avaliação com docentes, calibração dos indicadores e das regras
                de feedback e investigação de novos sinais visuais compatíveis
                com imagens de baixa resolução. O objetivo é aperfeiçoar a
                ferramenta como apoio à reflexão e à tomada de decisão do professor.
              </p>
            </AboutSection>

            <AboutSection id="equipe">
              <p>
                Trabalho de Conclusão de Curso desenvolvido no Colégio Técnico
                de Campinas, da Universidade Estadual de Campinas, em 2026.
              </p>
              <dl className="project-about-credits">
                <div>
                  <dt>Autores</dt>
                  <dd>
                    <ul>
                      <li>Eduardo Artigiani Lima Tribst</li>
                      <li>Júlio Pacheco Stein</li>
                      <li>Rafael Fazion Baldin Dias</li>
                    </ul>
                  </dd>
                </div>
                <div><dt>Orientadora</dt><dd>Andreia Cristina de Souza</dd></div>
                <div><dt>Coorientador</dt><dd>Guilherme de Oliveira Macedo</dd></div>
              </dl>
            </AboutSection>

            <AboutSection id="referencias">
              <p>
                Esta página sintetiza o projeto de pesquisa e o relatório de
                desenvolvimento do FOCA. Entre as referências discutidas no
                trabalho, destacam-se:
              </p>
              <ul className="project-about-references">
                <li>
                  FREDRICKS, J. A.; BLUMENFELD, P. C.; PARIS, A. H.
                  {' '}<cite>School engagement: potential of the concept, state of the evidence.</cite>
                  {' '}Review of Educational Research, 2004.
                </li>
                <li>
                  WHITEHILL, J. et al.
                  {' '}<cite>The Faces of Engagement: Automatic Recognition of Student Engagement from Facial Expressions.</cite>
                  {' '}IEEE Transactions on Affective Computing, 2014.
                </li>
                <li>
                  CANEDO, D.; TRIFAN, A.; NEVES, A. J. R.
                  {' '}<cite>Monitoring Students’ Attention in a Classroom Through Computer Vision.</cite>
                  {' '}The PAAMS Collection, 2018.
                </li>
                <li>
                  REDMON, J. et al.
                  {' '}<cite>You Only Look Once: Unified, Real-Time Object Detection.</cite>
                  {' '}CVPR, 2016.
                </li>
                <li>
                  YANG, S. et al.
                  {' '}<cite>WIDER FACE: A Face Detection Benchmark.</cite>
                  {' '}CVPR, 2016.
                </li>
              </ul>
            </AboutSection>

            <div className="project-about-article-end">
              <p>FOCA · COTUCA / Unicamp · 2026</p>
              <a href="#topo-projeto">Voltar ao topo <span aria-hidden="true">↑</span></a>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
