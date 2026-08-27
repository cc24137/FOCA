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
    const [rawVinculos, setRawVinculos] = useState([]); // Guardar retorno bruto para depuração
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
        async function carregarEstatisticas() {
            setLoadingDados(true);
            try {
                const resVinculos = await api.get('/turmas/infosPorInstituicao');
                const vinculos = Array.isArray(resVinculos.data) ? resVinculos.data : (resVinculos.data ? [resVinculos.data] : []);
                setRawVinculos(vinculos);

                if (vinculos.length === 0) {
                    setMatriz([]);
                    return;
                }

                const promessasAulas = vinculos.map(async (vinculo) => {
                    try {
                        const linkId = vinculo.idLink || vinculo.id_turma_disciplina_professor || vinculo.id_relacao || vinculo.id;

                        if (!linkId) return [];

                        const resAulas = await api.get(`/aula/${linkId}`);
                        const aulas = Array.isArray(resAulas.data) ? resAulas.data : (resAulas.data ? [resAulas.data] : []);

                        return aulas.map(aula => ({
                            id: aula.id,
                            professor: vinculo.professor || "Sem Nome",
                            turma: vinculo.nome || "Sem Turma",
                            disciplina:vinculo.disciplina || "Sem Disciplina",
                            aulaId: aula.id,
                            linkIdOriginal: linkId
                        }));
                    } catch (err) {
                        return [];
                    }
                });

                const resultadosAulas = await Promise.all(promessasAulas);
                setMatriz(resultadosAulas.flat());

            } catch (error) {
                console.error("Erro ao carregar matriz de estatísticas:", error);
            } finally {
                setLoadingDados(false);
            }
        }

        carregarEstatisticas();
    }, []);

    const getUniqueByField = (field) => {
        if (!matriz || matriz.length === 0) return [];
        return [...new Set(matriz.map(r => r[field]))].filter(Boolean);
    };

    const handleOptionChange = (v) => {
        setOption(v);
        setSelectedA([]);
        setSelectedB([]);
        setItemsParaComparar([]);
        setDadosComparativos([]);
    };

    const handleSelectFilter = (v, selected, setSelected) => {
        if (!v) return;
        if (v === "Todas") {
            setSelected(["Todas"]);
        } else {
            setSelected(prev => [...prev.filter(i => i !== "Todas"), v]);
        }
    };

    const removeChip = (item, selected, setSelected) => {
        setSelected(prev => prev.filter(i => i !== item));
    };

    const getAvailableOptions = (field, selected) => {
        const all = getUniqueByField(field);
        return ["Todas", ...all.filter(i => !selected.includes(i))];
    };

    const getListagem = () => {
        if (!option || matriz.length === 0) return [];
        let rows = matriz;

        if (selectedA.length > 0 && !selectedA.includes("Todas")) {
            rows = rows.filter(r => selectedA.includes(r[cfg.filterAField]));
        }
        if (selectedB.length > 0 && !selectedB.includes("Todas")) {
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

            const linhasConfig = listaParaUnificar.map((item, index) => ({
                key: item.id,
                label: item.label,
                color: PALETA_CORES[index % PALETA_CORES.length]
            }));

            const dadosUnificados = unificarLinhasDoTempo(listaParaUnificar);

            setDadosComparativos(dadosUnificados);
            setConfiguracaoLinhas(linhasConfig);
        } catch (error) {
            console.error("Erro ao gerar gráfico comparativo:", error);
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
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf()
            .set(options)
            .from(element)
            .save()
            .then(() => setIsExporting(false))
            .catch((err) => {
                console.error("Erro ao gerar PDF:", err);
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
                    <p style={{ padding: "20px 0" }}>Buscando dados da instituição...</p>
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
                    option && <p style={{ color: "#6B7280" }}>Nenhum item encontrado com os filtros selecionados.</p>
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