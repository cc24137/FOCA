import React from 'react';
import Header from '../../components/header';
import './sobre-projeto.css';

const steps = [
  {
    title: 'Detecção de rostos',
    text: 'Modelos de visão computacional baseados em YOLOv8 identificam os rostos presentes nas imagens. O treinamento utiliza o conjunto de dados WIDER FACE.',
  },
  {
    title: 'Estimativa dos indicadores',
    text: 'Um algoritmo analisa as proporções geométricas das regiões faciais e o comportamento coletivo para calcular indicadores visuais de atenção da turma.',
  },
  {
    title: 'Interpretação dos resultados',
    text: 'Os indicadores são organizados ao longo do tempo. Regras de análise identificam variações e tendências e produzem gráficos, feedbacks e recomendações para o professor.',
  },
];

export default function SobreProjeto() {
  return (
    <div className="project-about-page">
      <Header routes={[
        { textButton: 'Início', routeButton: '/' },
        { textButton: 'Entrar', routeButton: '/login' },
      ]} />

      <main className="project-about-content">
        <h1 className="project-about-title">Sobre o Projeto</h1>

        <section className="project-about-hero" aria-labelledby="foca-title">
          <div>
            <span className="project-about-eyebrow">Pesquisa e desenvolvimento · COTUCA / Unicamp</span>
            <h2 id="foca-title">FOCA</h2>
            <p className="project-about-fullname">Ferramenta de Observação e Classificação de Atenção</p>
            <p>
              Um projeto de Trabalho de Conclusão de Curso desenvolvido por estudantes
              do Colégio Técnico de Campinas, da Universidade Estadual de Campinas,
              para apoiar professores na interpretação de indicadores visuais de
              atenção em aulas presenciais.
            </p>
          </div>
          <aside className="project-about-institution" aria-label="Instituição de origem do projeto">
            <span className="project-about-label">Desenvolvido no</span>
            <strong>COTUCA</strong>
            <span>Colégio Técnico de Campinas</span>
            <div className="project-about-university">
              <strong>Unicamp</strong>
              <span>Universidade Estadual de Campinas</span>
            </div>
            <span className="project-about-badge">TCC · Campinas, SP · 2026</span>
          </aside>
        </section>

        <div className="project-about-two-columns">
          <section className="project-about-card" aria-labelledby="origin-title">
            <span className="project-about-eyebrow">Contexto acadêmico</span>
            <h2 id="origin-title">Um projeto construído no COTUCA</h2>
            <p>
              O FOCA nasceu no contexto da formação técnica e de ensino médio do
              COTUCA, colégio vinculado à Unicamp. O trabalho reúne pesquisa,
              experimentação e desenvolvimento de software em torno de um desafio
              do ambiente escolar.
            </p>
            <p>
              Sua construção envolveu levantamento bibliográfico, treinamento e
              avaliação de modelos, testes de diferentes formas de análise visual
              e desenvolvimento de uma plataforma web para apresentar os resultados.
            </p>
          </section>
          <section className="project-about-card" aria-labelledby="motivation-title">
            <span className="project-about-eyebrow">O problema investigado</span>
            <h2 id="motivation-title">Acompanhar uma turma é um desafio</h2>
            <p>
              Durante uma aula, o professor precisa explicar o conteúdo, conduzir as
              atividades e observar a reação dos estudantes. Em turmas numerosas,
              acompanhar essas diferentes demandas ao mesmo tempo se torna ainda
              mais difícil.
            </p>
            <p>
              O projeto busca oferecer informações complementares sobre o
              comportamento coletivo, ajudando a identificar momentos relevantes
              e a refletir sobre as estratégias utilizadas em sala.
            </p>
          </section>
        </div>

        <section className="project-about-section" aria-labelledby="how-title">
          <div className="project-about-section-heading">
            <h2 id="how-title">Como o FOCA funciona</h2>
            <p>Da análise das imagens à apresentação de informações para o docente.</p>
          </div>
          <ol className="project-about-steps">
            {steps.map((step, index) => (
              <li className="project-about-card" key={step.title}>
                <span className="project-about-step-number" aria-hidden="true">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="project-about-card project-about-features" aria-labelledby="features-title">
          <div>
            <span className="project-about-eyebrow">Informações para a prática docente</span>
            <h2 id="features-title">O que a plataforma apresenta</h2>
            <p>
              Os resultados podem ser consultados pelo professor e pela instituição,
              de acordo com seus respectivos perfis de acesso. A plataforma reúne
              os registros de aulas, turmas e disciplinas para facilitar o acompanhamento.
            </p>
          </div>
          <ul className="project-about-feature-list">
            <li><strong>Gráficos temporais</strong><span>A evolução dos indicadores durante a aula.</span></li>
            <li><strong>Histórico e comparações</strong><span>Resultados organizados para acompanhar diferentes aulas e contextos.</span></li>
            <li><strong>Feedbacks priorizados</strong><span>Variações e períodos relevantes destacados para análise.</span></li>
            <li><strong>Recomendações</strong><span>Sugestões de investigação, intervenção, reforço ou monitoramento.</span></li>
          </ul>
        </section>

        <section className="project-about-card project-about-results" aria-labelledby="research-title">
          <div>
            <span className="project-about-eyebrow">Resultados do relatório</span>
            <h2 id="research-title">Pesquisa, testes e avaliação</h2>
            <p>
              Foram avaliadas as variantes Nano e Small do YOLOv8 na detecção de
              rostos. A variante Small apresentou melhor desempenho de detecção,
              enquanto a Nano exigiu menos tempo de processamento nos testes relatados.
            </p>
            <p className="project-about-note" id="metric-note">
              A métrica mAP@50 avalia a detecção de rostos no conjunto de validação
              WIDER FACE. Esses valores não representam a precisão da estimativa de
              atenção dos estudantes.
            </p>
          </div>
          <div className="project-about-table-wrapper">
            <table className="project-about-table" aria-describedby="metric-note">
              <caption>Detecção de rostos · WIDER FACE</caption>
              <thead><tr><th scope="col">Modelo avaliado</th><th scope="col">mAP@50</th></tr></thead>
              <tbody>
                <tr><th scope="row">YOLOv8 Nano</th><td>73,26%</td></tr>
                <tr><th scope="row">YOLOv8 Small</th><td>78,00%</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="project-about-two-columns">
          <section className="project-about-card" aria-labelledby="limits-title">
            <span className="project-about-eyebrow">Interpretação dos indicadores</span>
            <h2 id="limits-title">O contexto da aula importa</h2>
            <p>
              A orientação aparente do rosto é um indício visual. Ela não permite
              determinar diretamente o estado de concentração ou a aprendizagem de
              um estudante. Ângulo da câmera, iluminação, rostos parcialmente
              encobertos e qualidade da imagem podem influenciar os resultados.
            </p>
            <p>
              A avaliação descrita no relatório ainda não constitui uma comprovação
              de impacto pedagógico em aulas reais. A interpretação dos dados e as
              decisões sobre a prática de ensino permanecem com o professor.
            </p>
          </section>
          <section className="project-about-card" aria-labelledby="privacy-title">
            <span className="project-about-eyebrow">Responsabilidade e continuidade</span>
            <h2 id="privacy-title">Cuidado com as imagens e com seu uso</h2>
            <p>
              A proposta descrita no relatório prioriza o uso temporário das imagens
              durante o processamento e a manutenção dos resultados derivados para
              consulta posterior. A utilização em ambientes escolares requer atenção
              à privacidade e aos procedimentos de autorização aplicáveis.
            </p>
            <p>
              Entre os próximos passos da pesquisa estão a realização de testes
              sistemáticos em salas de aula, a calibração dos indicadores e o
              aprimoramento das regras de feedback para diferentes contextos.
            </p>
          </section>
        </div>

        <section className="project-about-card project-about-credits" aria-labelledby="credits-title">
          <div>
            <span className="project-about-eyebrow">Autoria e orientação</span>
            <h2 id="credits-title">As pessoas por trás do FOCA</h2>
            <p>Trabalho desenvolvido no COTUCA, da Unicamp, em 2026.</p>
          </div>
          <div>
            <h3>Autores</h3>
            <ul>
              <li>Eduardo Artigiani Lima Tribst</li>
              <li>Júlio Pacheco Stein</li>
              <li>Rafael Fazion Baldin Dias</li>
            </ul>
          </div>
          <div>
            <h3>Orientação</h3>
            <p><strong>Orientadora</strong><br />Andreia Cristina de Souza</p>
            <p><strong>Coorientador</strong><br />Guilherme de Oliveira Macedo</p>
          </div>
        </section>

        <footer className="project-about-footer">
          <p>FOCA · Colégio Técnico de Campinas · Universidade Estadual de Campinas</p>
          <p>Projeto de Trabalho de Conclusão de Curso · 2026</p>
        </footer>
      </main>
    </div>
  );
}
