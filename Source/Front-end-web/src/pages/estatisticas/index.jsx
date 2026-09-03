import { useState, useEffect, useRef } from "react";
import html2pdf from "html2pdf.js";
import Header from "../../components/header";
import Combobox from "../../components/combobox-turmas";
import GenericLineChart from "../../components/time-vs-value-chart";
import { unificarLinhasDoTempo } from "../../utils/chartHelpers";
import api from "../../services/api";
import "./estatisticas.css";

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

    const [dadosComparativos, setDadosComparativos] = useState([]);
    const [configuracaoLinhas, setConfiguracaoLinhas] = useState([]);
    const [loadingGrafico, setLoadingGrafico] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const config = {
        Professores: { mainField: "professor", filterAField: "turma", filterALabel: "Turmas", filterBField: "disciplina", filterBLabel: "Disciplinas" },
        Turmas:      { mainField: "turma", filterAField: "professor", filterALabel: "Professores", filterBField: "disciplina", filterBLabel: "Disciplinas" },
        Disciplinas: { mainField: "disciplina", filterAField: "professor", filterALabel: "Professores", filterBField: "turma", filterBLabel: "Turmas" },
    };

    const cfg = config[option];

    useEffect(() => {
        let isMounted = true;

        async function carregarEstatisticas() {
            setLoadingDados(true);
            setMatriz([]);

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

                        // Formata os nomes de professor/disciplina caso venham como objeto ou string
                        const profNome = typeof vinculo.professor === 'object' ? vinculo.professor?.nome : vinculo.professor;
                        const discNome = typeof vinculo.disciplina === 'object' ? vinculo.disciplina?.nome : vinculo.disciplina;

                        return aulas.map(aula => ({
                            id: aula.id || aula.id_aula,
                            professor: profNome || "Sem Nome",
                            turma: vinculo.nome || "Sem Turma",
                            disciplina: discNome || "Sem Disciplina",
                            aulaId: aula.id || aula.id_aula,
                            linkIdOriginal: linkId
                        })).filter(a => a.id);
                    } catch (err) {
                        console.error(`Erro ao buscar aulas da turma ${linkId}:`, err.message);
                        return [];
                    }
                });

                const resultadosAulas = await Promise.all(promessasAulas);
                const matrizFinal = resultadosAulas.flat();
                
                if (isMounted) setMatriz(matrizFinal);

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

    const getUniqueByField = (field) => {
        if (!matriz || matriz.length === 0) return [];
        return [...new Set(matriz.map(r => r[field]).filter(Boolean))];
    };

    const handleOptionChange = (v) => {
        setOption(v);
        setSelectedA([]);
        setSelectedB([]);
        setItemsParaComparar([]);
        setDadosComparativos([]);
        setConfiguracaoLinhas([]);
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

    const getAvailableOptions = (field, selected) => {
        const all = getUniqueByField(field);
        const baseOptions = all.filter(i => !selected.includes(i));
        return selected.includes("Todas") ? baseOptions : ["Todas", ...baseOptions];
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
        setItemsParaComparar(prev => 
            prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
        );
    };

    const handleGerarGrafico = async () => {
        if (itemsParaComparar.length === 0) return;

        setLoadingGrafico(true);
        try {
            const listaParaUnificar = await Promise.all(
                itemsParaComparar.map(async (itemNome) => {
                    const aulasDoItem = matriz.filter(m => m[cfg.mainField] === itemNome);
                    
                    if (aulasDoItem.length === 0) {
                        return { id: `item_${itemNome}`, label: itemNome, data: [] };
                    }

                    const promessasLogs = aulasDoItem.map(item => 
                        api.get(`/leituraAtencao/${item.aulaId}`)
                           .then(res => res.data)
                           .catch(() => [])
                    );

                    const resultados = await Promise.all(promessasLogs);
                    const todosLogs = resultados.flat();

                    const dataFormatada = todosLogs.map(log => ({
                        segundos: log.segundoVideo,
                        temp: log.indiceAtencao <= 1 ? log.indiceAtencao * 100 : log.indiceAtencao
                    }));

                    return {
                        id: `item_${itemNome}`,
                        label: itemNome,
                        data: dataFormatada
                    };
                })
            );

            const itensValidos = listaParaUnificar.filter(item => item.data.length > 0);

            if (itensValidos.length === 0) {
                alert("Nenhum dado de atenção encontrado para os itens selecionados.");
                setDadosComparativos([]);
                setConfiguracaoLinhas([]);
                return;
            }

            const linhasConfig = itensValidos.map((item, index) => ({
                key: item.id,
                label: item.label,
                color: PALETA_CORES[index % PALETA_CORES.length]
            }));

            const dadosUnificados = unificarLinhasDoTempo(itensValidos);

            setDadosComparativos(dadosUnificados);
            setConfiguracaoLinhas(linhasConfig);
        } catch (error) {
            console.error("Erro ao gerar gráfico:", error);
            alert("Erro ao processar gráfico.");
        } finally {
            setLoadingGrafico(false);
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
            .catch((err) => {
                console.error("Erro ao gerar PDF:", err);
                alert("Falha ao gerar PDF.");
                setIsExporting(false);
            });
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
                    <h2>Estatísticas da Instituição</h2>
                    {dadosComparativos.length > 0 && (
                        <button 
                            className="estatisticas-btn-pdf" 
                            onClick={handleExportarPDF} 
                            disabled={isExporting}
                        >
                            {isExporting ? "Gerando PDF..." : "Exportar Relatório PDF"}
                        </button>
                    )}
                </div>

                <div className="estatisticas-selector-row">
                    <p>Comparar por:</p>
                    <Combobox
                        options={["Professores", "Turmas", "Disciplinas"]}
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
                                options={getAvailableOptions(cfg.filterAField, selectedA)}
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
                                options={getAvailableOptions(cfg.filterBField, selectedB)}
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
                        <p>Buscando dados da instituição...</p>
                    </div>
                ) : listagem.length > 0 ? (
                    <div className="estatisticas-selection-section">
                        <p className="section-title">Selecione os itens para comparar no gráfico:</p>
                        <div className="estatisticas-listagem">
                            {listagem.map((item, i) => {
                                const active = itemsParaComparar.includes(item);
                                return (
                                    <div 
                                        key={i} 
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
                            onClick={handleGerarGrafico}
                            disabled={itemsParaComparar.length === 0 || loadingGrafico}
                        >
                            {loadingGrafico ? "Processando..." : "Gerar Gráfico Comparativo"}
                        </button>
                    </div>
                ) : (
                    option && <p className="empty-message">Nenhum item encontrado com os filtros selecionados.</p>
                )}

                <div className="estatisticas-average-attention">
                    <p className="estatisticas-average-attention-text">Comparativo de Atenção ao Longo do Tempo</p>
                    <div className="estatisticas-average-attention-graph">
                        {dadosComparativos.length > 0 ? (
                            <GenericLineChart
                                data={dadosComparativos}
                                xKey="tempoFormatado"
                                lines={configuracaoLinhas}
                            />
                        ) : (
                            <p className="graph-placeholder">
                                Selecione um ou mais itens acima e clique em <strong>"Gerar Gráfico Comparativo"</strong>.
                            </p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}