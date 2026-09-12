import { useState, useEffect, useRef } from "react";
import html2pdf from "html2pdf.js";
import Header from "../../components/header";
import Combobox from "../../components/combobox-turmas";
import GenericLineChart from "../../components/time-vs-value-chart";
import GenericBarChart from "../../components/bar-chart";
import KpiCards from "../../components/kpi-cards";
import { unificarLinhasDoTempo } from "../../utils/chartHelpers";
import api from "../../services/api";
import "./estatisticas.css";

const USE_MOCK = true;
const MAX_SELECAO_COMPARACAO = 5;

const MOCK_MATRIZ = [
  { id: 101, aulaId: 101, labelAula: "Aula #101 - Álgebra Linear", professor: "Prof. Carlos", turma: "2ºA", disciplina: "Matemática" },
  { id: 102, aulaId: 102, labelAula: "Aula #102 - Geometria Espacial", professor: "Prof. Carlos", turma: "2ºA", disciplina: "Matemática" },
  { id: 103, aulaId: 103, labelAula: "Aula #103 - Trigonometria", professor: "Prof. Carlos", turma: "2ºB", disciplina: "Matemática" },
  { id: 201, aulaId: 201, labelAula: "Aula #201 - Leis de Newton", professor: "Profª. Ana", turma: "2ºA", disciplina: "Física" },
  { id: 202, aulaId: 202, labelAula: "Aula #202 - Termodinâmica", professor: "Profª. Ana", turma: "2ºA", disciplina: "Física" },
  { id: 301, aulaId: 301, labelAula: "Aula #301 - Tabela Periódica", professor: "Prof. Roberto", turma: "2ºB", disciplina: "Química" },
  { id: 302, aulaId: 302, labelAula: "Aula #302 - Estequiometria", professor: "Prof. Roberto", turma: "3ºA", disciplina: "Química" },
  { id: 401, aulaId: 401, labelAula: "Aula #401 - Citologia", professor: "Profª. Juliana", turma: "2ºA", disciplina: "Biologia" },
  { id: 402, aulaId: 402, labelAula: "Aula #402 - Genética e DNA", professor: "Profª. Juliana", turma: "2ºB", disciplina: "Biologia" },
];

const gerarMockLogs = (aulaId) => {
  const logs = [];
  const duracoesPossiveis = [180, 240, 300, 420, 540, 600];
  const duracaoSegundos = duracoesPossiveis[aulaId % duracoesPossiveis.length];
  const fatorBase = (aulaId % 3 === 0) ? 0.85 : (aulaId % 2 === 0) ? 0.70 : 0.55;

  for (let s = 0; s <= duracaoSegundos; s += 15) {
    const variacao = Math.sin(s / 30) * 0.12 + (Math.random() * 0.08 - 0.04);
    const atencao = Math.min(100, Math.max(30, (fatorBase + variacao) * 100));
    
    logs.push({
      segundoVideo: s,
      indiceAtencao: Number(atencao.toFixed(1))
    });
  }
  return logs;
};

const PALETA_CORES = [
  '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'
];

export default function Estatisticas() {
    const reportRef = useRef(null);

    const [option, setOption] = useState("Professores");
    const [selectedA, setSelectedA] = useState([]);
    const [selectedB, setSelectedB] = useState([]);
    const [itemsParaComparar, setItemsParaComparar] = useState([]);
    
    const [matriz, setMatriz] = useState([]);
    const [loadingDados, setLoadingDados] = useState(true);

    const [dadosComparativosLine, setDadosComparativosLine] = useState([]);
    const [configuracaoLinhas, setConfiguracaoLinhas] = useState([]);
    const [dadosBarChart, setDadosBarChart] = useState([]);
    
    const [loadingGraficos, setLoadingGraficos] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const [kpis, setKpis] = useState({
        mediaGeral: 0,
        totalAulas: 0,
        melhorDesempenho: "N/A"
    });

    const config = {
        Professores: { mainField: "professor",  filterAField: "turma", filterALabel: "Turmas", filterBField: "disciplina", filterBLabel: "Disciplinas" },
        Turmas:      { mainField: "turma",      filterAField: "professor", filterALabel: "Professores", filterBField: "disciplina", filterBLabel: "Disciplinas" },
        Disciplinas: { mainField: "disciplina", filterAField: "professor", filterALabel: "Professores", filterBField: "turma", filterBLabel: "Turmas" },
        Aulas:       { mainField: "labelAula",  filterAField: "professor", filterALabel: "Professores", filterBField: "turma", filterBLabel: "Turmas" },
    };

    const cfg = config[option];

    // Carregamento de dados inicial
    useEffect(() => {
        let isMounted = true;

        async function carregarEstatisticas() {
            setLoadingDados(true);

            if (USE_MOCK) {
                setTimeout(() => {
                    if (isMounted) {
                        setMatriz(MOCK_MATRIZ);
                        setKpis(prev => ({ ...prev, totalAulas: MOCK_MATRIZ.length }));
                        setLoadingDados(false);
                    }
                }, 400);
                return;
            }

            try {
                const resVinculos = await api.get('/turmas/infosPorInstituicao');
                const vinculos = Array.isArray(resVinculos.data) ? resVinculos.data : [];

                if (vinculos.length === 0) {
                    if (isMounted) setMatriz([]);
                    return;
                }

                const promessasAulas = vinculos.map(async (vinculo) => {
                    const linkId = vinculo.id;

                    try {
                        const resAulas = await api.get(`/aula/${linkId}`);
                        const aulas = Array.isArray(resAulas.data) ? resAulas.data : [];

                        const profNome = typeof vinculo.professor === 'object' ? vinculo.professor?.nome : vinculo.professor;
                        const discNome = typeof vinculo.disciplina === 'object' ? vinculo.disciplina?.nome : vinculo.disciplina;

                        return aulas.map(aula => {
                            const aulaId = aula.id || aula.id_aula;
                            const tituloAula = aula.titulo || aula.nome || aula.nomeAula || aula.descricao || `Aula #${aulaId}`;
                            
                            return {
                                id: aulaId,
                                professor: profNome || "Sem Nome",
                                turma: vinculo.nome || "Sem Turma",
                                disciplina: discNome || "Sem Disciplina",
                                labelAula: tituloAula,
                                aulaId: aulaId,
                                linkIdOriginal: linkId
                            };
                        }).filter(a => a.id);
                    } catch (err) {
                        return [];
                    }
                });

                const resultadosAulas = await Promise.all(promessasAulas);
                const matrizFinal = resultadosAulas.flat();
                
                if (isMounted) {
                    setMatriz(matrizFinal);
                    setKpis(prev => ({ ...prev, totalAulas: matrizFinal.length }));
                }

            } catch (error) {
                console.error("Erro ao carregar estatísticas:", error);
                if (isMounted) setMatriz([]);
            } finally {
                if (isMounted) setLoadingDados(false);
            }
        }

        carregarEstatisticas();
        return () => { isMounted = false; };
    }, []);

    // Reset de seleção e gráficos ao alterar qualquer filtro
    useEffect(() => {
        setItemsParaComparar([]);
        setDadosComparativosLine([]);
        setDadosBarChart([]);
        setConfiguracaoLinhas([]);
    }, [selectedA, selectedB, option]);

    // Filtros em cascata: ajusta as opções baseando-se no outro filtro selecionado
    const getAvailableOptions = (targetField, currentSelected, otherField, otherSelected) => {
        if (!matriz || matriz.length === 0) return [];
        
        let rows = matriz;
        if (otherSelected.length > 0 && !otherSelected.includes("Todas")) {
            rows = rows.filter(r => otherSelected.includes(r[otherField]));
        }

        const all = [...new Set(rows.map(r => r[targetField]).filter(Boolean))];
        const baseOptions = all.filter(i => !currentSelected.includes(i));
        return currentSelected.includes("Todas") ? baseOptions : ["Todas", ...baseOptions];
    };

    const handleOptionChange = (v) => {
        setOption(v);
        setSelectedA([]);
        setSelectedB([]);
    };

    const handleSelectFilter = (v, selected, setSelected) => {
        if (!v) return;
        if (v === "Todas") {
            setSelected(["Todas"]);
        } else {
            setSelected(prev => {
                if (prev.includes(v)) return prev;
                return [...prev.filter(i => i !== "Todas"), v];
            });
        }
    };

    const removeChip = (item, selected, setSelected) => {
        setSelected(prev => prev.filter(i => i !== item));
    };

    const getListagem = () => {
        if (!option || matriz.length === 0) return [];
        let rows = matriz;

        const filterAAtivo = selectedA.length > 0 && !selectedA.includes("Todas");
        const filterBAtivo = selectedB.length > 0 && !selectedB.includes("Todas");

        if (filterAAtivo) {
            rows = rows.filter(r => selectedA.includes(r[cfg.filterAField]));
        }
        if (filterBAtivo) {
            rows = rows.filter(r => selectedB.includes(r[cfg.filterBField]));
        }

        return [...new Set(rows.map(r => r[cfg.mainField]))].filter(Boolean);
    };

    const listagem = getListagem();

    const handleToggleItemComparacao = (item) => {
        setItemsParaComparar(prev => {
            if (prev.includes(item)) {
                return prev.filter(i => i !== item);
            }
            if (prev.length >= MAX_SELECAO_COMPARACAO) {
                alert(`Você pode comparar no máximo ${MAX_SELECAO_COMPARACAO} itens por vez para garantir a clareza do gráfico.`);
                return prev;
            }
            return [...prev, item];
        });
    };

    const handleGerarGraficos = async () => {
        if (itemsParaComparar.length === 0) return;

        setLoadingGraficos(true);
        try {
            const listaParaUnificar = [];
            const listaBarData = [];

            let somaMedias = 0;
            let maiorMedia = -1;
            let melhorNome = "N/A";

            for (const itemNome of itemsParaComparar) {
                const aulasDoItem = matriz.filter(m => m[cfg.mainField] === itemNome);
                
                if (aulasDoItem.length === 0) continue;

                let todosLogs = [];

                if (USE_MOCK) {
                    todosLogs = aulasDoItem.flatMap(item => gerarMockLogs(item.aulaId));
                } else {
                    const promessasLogs = aulasDoItem.map(item => 
                        api.get(`/leituraAtencao/${item.aulaId}`)
                           .then(res => res.data)
                           .catch(() => [])
                    );
                    const resultados = await Promise.all(promessasLogs);
                    todosLogs = resultados.flat();
                }

                if (todosLogs.length > 0) {
                    // Agrupamento temporal por instante/segundo para médias corretas de múltiplas aulas
                    const mapaPorSegundo = {};

                    todosLogs.forEach(log => {
                        const seg = log.segundoVideo;
                        const valorAtencao = log.indiceAtencao <= 1 ? log.indiceAtencao * 100 : log.indiceAtencao;

                        if (!mapaPorSegundo[seg]) {
                            mapaPorSegundo[seg] = { soma: 0, quantidade: 0 };
                        }

                        mapaPorSegundo[seg].soma += valorAtencao;
                        mapaPorSegundo[seg].quantidade += 1;
                    });

                    const dataFormatada = Object.keys(mapaPorSegundo)
                        .map(seg => ({
                            segundos: Number(seg),
                            temp: Number((mapaPorSegundo[seg].soma / mapaPorSegundo[seg].quantidade).toFixed(1))
                        }))
                        .sort((a, b) => a.segundos - b.segundos);

                    const mediaItem = dataFormatada.reduce((acc, curr) => acc + curr.temp, 0) / dataFormatada.length;
                    
                    listaBarData.push({
                        label: itemNome,
                        media: Number(mediaItem.toFixed(1))
                    });

                    somaMedias += mediaItem;

                    if (mediaItem > maiorMedia) {
                        maiorMedia = mediaItem;
                        melhorNome = itemNome;
                    }

                    listaParaUnificar.push({
                        id: `item_${itemNome}`,
                        label: itemNome,
                        data: dataFormatada
                    });
                }
            }

            if (listaParaUnificar.length === 0) {
                alert("Nenhum dado de atenção encontrado para os itens selecionados.");
                setDadosComparativosLine([]);
                setDadosBarChart([]);
                setConfiguracaoLinhas([]);
                return;
            }

            const linhasConfig = listaParaUnificar.map((item, index) => ({
                key: item.id,
                label: item.label,
                color: PALETA_CORES[index % PALETA_CORES.length]
            }));

            const dadosUnificados = unificarLinhasDoTempo(listaParaUnificar);

            setDadosComparativosLine(dadosUnificados);
            setDadosBarChart(listaBarData);
            setConfiguracaoLinhas(linhasConfig);

            setKpis(prev => ({
                ...prev,
                mediaGeral: somaMedias / listaBarData.length,
                melhorDesempenho: melhorNome
            }));

        } catch (error) {
            console.error("Erro ao gerar gráficos:", error);
            alert("Erro ao processar dados dos gráficos.");
        } finally {
            setLoadingGraficos(false);
        }
    };

    const handleExportarPDF = () => {
        if (!reportRef.current) return;
        setIsExporting(true);

        const element = reportRef.current;
        const options = {
            margin: 10,
            filename: `relatorio-estatisticas-${option.toLowerCase()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf()
            .set(options)
            .from(element)
            .save()
            .then(() => setIsExporting(false))
            .catch(() => setIsExporting(false));
    };

    return (
        <div className="estatisticas-body">
            <Header
                routes={[
                    { textButton: "Início", routeButton: "/inicial-instituicao" },
                    { textButton: "Sobre o Projeto", routeButton: "/" },
                    { textButton: "Perfil", routeButton: "/editar-dados" }
                ]}
            />
            
            <div className="estatisticas-content" ref={reportRef}>
                <div className="estatisticas-header-row">
                    <h2>Estatísticas da Instituição {USE_MOCK && <span style={{ fontSize: '0.8rem', color: '#EF4444' }}>(Modo Mock Ativo)</span>}</h2>
                    {dadosBarChart.length > 0 && (
                        <button 
                            className="estatisticas-btn-pdf" 
                            onClick={handleExportarPDF} 
                            disabled={isExporting}
                        >
                            {isExporting ? "Gerando PDF..." : "Exportar Relatório PDF"}
                        </button>
                    )}
                </div>

                {/* GRID DO DASHBOARD */}
                <div className="estatisticas-dashboard-grid">
                    
                    {/* COLUNA DA ESQUERDA: Filtros e Seleção */}
                    <aside className="estatisticas-sidebar">
                        <div className="estatisticas-selector-box">
                            <p className="sidebar-subtitle">Comparar por:</p>
                            <Combobox
                                options={["Professores", "Turmas", "Disciplinas", "Aulas"]}
                                value={option}
                                onChange={handleOptionChange}
                                placeholder="Selecione uma opção"
                            />
                        </div>

                        {option && (
                            <div className="estatisticas-filters">
                                <div className="estatisticas-filter-row">
                                    <p>{cfg.filterALabel}:</p>
                                    <Combobox
                                        options={getAvailableOptions(cfg.filterAField, selectedA, cfg.filterBField, selectedB)}
                                        value=""
                                        onChange={v => handleSelectFilter(v, selectedA, setSelectedA)}
                                        placeholder={`Filtrar por ${cfg.filterALabel.toLowerCase()}`}
                                    />
                                </div>

                                {selectedA.length > 0 && (
                                    <div className="estatisticas-chips">
                                        {selectedA.map(item => (
                                            <div key={`a-${item}`} className="estatisticas-chip">
                                                <span>{item}</span>
                                                <button onClick={() => removeChip(item, selectedA, setSelectedA)}>✕</button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="estatisticas-filter-row">
                                    <p>{cfg.filterBLabel}:</p>
                                    <Combobox
                                        options={getAvailableOptions(cfg.filterBField, selectedB, cfg.filterAField, selectedA)}
                                        value=""
                                        onChange={v => handleSelectFilter(v, selectedB, setSelectedB)}
                                        placeholder={`Filtrar por ${cfg.filterBLabel.toLowerCase()}`}
                                    />
                                </div>

                                {selectedB.length > 0 && (
                                    <div className="estatisticas-chips">
                                        {selectedB.map(item => (
                                            <div key={`b-${item}`} className="estatisticas-chip">
                                                <span>{item}</span>
                                                <button onClick={() => removeChip(item, selectedB, setSelectedB)}>✕</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {loadingDados ? (
                            <div className="loading-container">
                                <div className="spinner" />
                                <p>Buscando dados...</p>
                            </div>
                        ) : listagem.length > 0 ? (
                            <div className="estatisticas-selection-section">
                                <p className="section-title">
                                    Selecione ({itemsParaComparar.length}/{MAX_SELECAO_COMPARACAO}):
                                </p>
                                <div className="estatisticas-listagem">
                                    {listagem.map((item) => {
                                        const active = itemsParaComparar.includes(item);
                                        return (
                                            <div 
                                                key={item} 
                                                className={`estatisticas-listagem-item ${active ? 'active' : ''}`}
                                                onClick={() => handleToggleItemComparacao(item)}
                                            >
                                                <input 
                                                    type="checkbox" 
                                                    checked={active} 
                                                    readOnly
                                                />
                                                <p>{item}</p>
                                            </div>
                                        );
                                    })}
                                </div>

                                <button 
                                    className="estatisticas-btn-comparar" 
                                    onClick={handleGerarGraficos}
                                    disabled={itemsParaComparar.length === 0 || loadingGraficos}
                                >
                                    {loadingGraficos ? "Processando..." : "Gerar Gráficos Comparativos"}
                                </button>
                            </div>
                        ) : (
                            option && <p className="empty-message">Nenhum item encontrado.</p>
                        )}
                    </aside>

                    {/* COLUNA DA DIREITA: KPIs e Gráficos */}
                    <main className="estatisticas-main">
                        <KpiCards 
                            mediaGeral={kpis.mediaGeral}
                            totalAulas={kpis.totalAulas}
                            melhorDesempenho={kpis.melhorDesempenho}
                        />

                        <div className="estatisticas-average-attention">
                            <p className="estatisticas-average-attention-text">Comparativo de Média de Atenção (%)</p>
                            <div className="estatisticas-average-attention-graph">
                                {dadosBarChart.length > 0 ? (
                                    <GenericBarChart
                                        data={dadosBarChart}
                                        xKey="label"
                                        yKey="media"
                                        colors={PALETA_CORES}
                                    />
                                ) : (
                                    <p className="graph-placeholder">
                                        Selecione os itens no painel à esquerda e clique em <strong>"Gerar Gráficos Comparativos"</strong>.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="estatisticas-average-attention">
                            <p className="estatisticas-average-attention-text">Evolução da Atenção ao Longo do Tempo</p>
                            <div className="estatisticas-average-attention-graph">
                                {dadosComparativosLine.length > 0 ? (
                                    <GenericLineChart
                                        data={dadosComparativosLine}
                                        xKey="tempoFormatado"
                                        lines={configuracaoLinhas}
                                    />
                                ) : (
                                    <p className="graph-placeholder">
                                        Selecione os itens no painel à esquerda e clique em <strong>"Gerar Gráficos Comparativos"</strong>.
                                    </p>
                                )}
                            </div>
                        </div>
                    </main>

                </div>
            </div>
        </div>
    );
}