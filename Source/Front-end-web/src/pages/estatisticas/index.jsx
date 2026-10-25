import { useState, useEffect, useRef } from "react";
import html2pdf from "html2pdf.js";
import Header from "../../components/header";
import Combobox from "../../components/combobox-turmas";
import GenericLineChart from "../../components/time-vs-value-chart";
import GenericBarChart from "../../components/bar-chart";
import KpiCards from "../../components/kpi-cards";
import StatisticsReport from "../../components/statistics-report";
import { useAuth } from "../../contexts/AuthContext";
import { unificarLinhasDoTempo } from "../../utils/chartHelpers";
import api from "../../services/api";
import { useToast } from "../../components/toast";
import "./estatisticas.css";

const MAX_SELECAO_COMPARACAO = 5;

const CONFIG_COMPARACAO = {
    Professores: {
        mainField: "professor",
        filterAField: "turma",
        filterALabel: "Turmas",
        filterBField: "disciplina",
        filterBLabel: "Disciplinas"
    },
    Turmas: {
        mainField: "turma",
        filterAField: "professor",
        filterALabel: "Professores",
        filterBField: "disciplina",
        filterBLabel: "Disciplinas"
    },
    Disciplinas: {
        mainField: "disciplina",
        filterAField: "professor",
        filterALabel: "Professores",
        filterBField: "turma",
        filterBLabel: "Turmas"
    },
    Aulas: {
        mainField: "labelAula",
        filterAField: "professor",
        filterALabel: "Professores",
        filterBField: "turma",
        filterBLabel: "Turmas"
    }
};

const PALETA_CORES = [
    "var(--indigo)",
    "var(--success-accent)",
    "var(--warning-accent)",
    "var(--error-accent)",
    "var(--chart-violet)",
    "var(--chart-cyan)",
    "var(--chart-pink)"
];

const comoLista = data =>
    Array.isArray(data) ? data : data ? [data] : [];

function unicosPorId(data) {
    return Array.from(
        new Map(
            comoLista(data)
                .filter(item => item?.id != null)
                .map(item => [String(item.id), item])
        ).values()
    );
}

function numeroValido(value) {
    if (
        typeof value !== "number" &&
        (typeof value !== "string" || value.trim() === "")
    ) {
        return null;
    }

    const numero = Number(value);
    return Number.isFinite(numero) ? numero : null;
}

function filtrarMatriz(matriz, cfg, selectedA, selectedB) {
    if (!cfg) return [];

    return matriz.filter(row =>
        (
            selectedA.length === 0 ||
            selectedA.includes("Todas") ||
            selectedA.includes(row[cfg.filterAField])
        ) &&
        (
            selectedB.length === 0 ||
            selectedB.includes("Todas") ||
            selectedB.includes(row[cfg.filterBField])
        )
    );
}

function calcularKpisMatriz(matriz) {
    const analisadas = unicosPorId(matriz).filter(
        aula => aula.mediaAtencao != null
    );

    return {
        mediaGeral: analisadas.length > 0
            ? analisadas.reduce(
                (soma, aula) => soma + aula.mediaAtencao,
                0
            ) / analisadas.length
            : 0,
        totalAulas: analisadas.length,
        melhorDesempenho: "N/A"
    };
}

function agruparLeituras(logs) {
    const porSegundo = new Map();

    comoLista(logs).forEach(log => {
        const segundo = numeroValido(log?.segundoVideo);
        const atencao = numeroValido(log?.indiceAtencao);

        // A API já retorna percentuais entre 0 e 100.
        if (
            segundo == null ||
            segundo < 0 ||
            atencao == null ||
            atencao < 0 ||
            atencao > 100
        ) {
            return;
        }

        const ponto = porSegundo.get(segundo) || {
            soma: 0,
            quantidade: 0
        };

        ponto.soma += atencao;
        ponto.quantidade += 1;
        porSegundo.set(segundo, ponto);
    });

    return Array.from(
        porSegundo,
        ([segundos, ponto]) => ({
            segundos,
            temp: Number(
                (ponto.soma / ponto.quantidade).toFixed(1)
            )
        })
    ).sort((a, b) => a.segundos - b.segundos);
}

async function carregarMatrizEstatisticas(clienteApi, signal) {
    const [resProfessores, resTurmas] = await Promise.all([
        clienteApi.get(
            "/professor/infosPorInstituicao",
            { signal }
        ),
        clienteApi.get(
            "/turmas/infosPorInstituicao",
            { signal }
        )
    ]);

    const professores = unicosPorId(resProfessores.data);

    const professoresPorId = new Map(
        professores.map(professor => [
            String(professor.id),
            professor
        ])
    );

    const nomes = new Map();

    professores.forEach(professor => {
        nomes.set(
            professor.nome,
            (nomes.get(professor.nome) || 0) + 1
        );
    });

    const rotuloProfessor = professor =>
        nomes.get(professor.nome) > 1
            ? `${professor.nome} (${professor.email || `ID ${professor.id}`})`
            : professor.nome || "Professor sem nome";

    let falhasCarregamento = 0;

    // A listagem inicial retorna IDs de turmas.
    // Precisamos buscar os vínculos de cada turma antes de consultar as aulas.
    const relacoesPorTurma = await Promise.all(
        unicosPorId(resTurmas.data).map(async turma => {
            try {
                const response = await clienteApi.get(
                    "/turmaRelacao/porTurma",
                    {
                        params: { idTurma: turma.id },
                        signal
                    }
                );

                return unicosPorId(response.data).map(relacao => ({
                    ...relacao,
                    nomeTurma: turma.nome
                }));
            } catch (error) {
                if (signal?.aborted) throw error;

                falhasCarregamento++;
                console.error(
                    "Erro ao carregar vínculos para as estatísticas:",
                    error
                );

                return [];
            }
        })
    );

    const linhasPorRelacao = await Promise.all(
        unicosPorId(relacoesPorTurma.flat()).map(async relacao => {
            try {
                // Confirma a identidade do professor pelo ID.
                const resDetalhe = await clienteApi.get(
                    `/turmaRelacao/${relacao.id}`,
                    { signal }
                );

                const detalhes = resDetalhe.data;

                const professor = professoresPorId.get(
                    String(detalhes?.idProfessor)
                );

                if (!professor) return [];

                // Esta rota recebe o ID do vínculo, não o ID da turma.
                const resAulas = await clienteApi.get(
                    `/aula/${relacao.id}`,
                    { signal }
                );

                const base = {
                    professorId: professor.id,
                    professor: rotuloProfessor(professor),
                    turma:
                        detalhes.nomeTurma ||
                        relacao.nomeTurma ||
                        "Sem turma",
                    disciplina:
                        detalhes.nomeDisciplina ||
                        relacao.nomeDisciplina ||
                        "Sem disciplina",
                    linkIdOriginal: relacao.id
                };

                const aulas = unicosPorId(resAulas.data);

                // Mantém o professor na seleção mesmo sem aulas cadastradas.
                if (aulas.length === 0) {
                    return [{
                        ...base,
                        id: null,
                        aulaId: null,
                        labelAula: null
                    }];
                }

                return aulas.map(aula => {
                    const media = numeroValido(
                        aula.media_atencao_total
                    );

                    return {
                        ...base,
                        id: aula.id,
                        aulaId: aula.id,
                        labelAula:
                            `Aula #${aula.id} - ${aula.conteudo || "Sem conteúdo"}`,
                        mediaAtencao:
                            media != null && media >= 0 && media <= 100
                                ? media
                                : null
                    };
                });
            } catch (error) {
                if (signal?.aborted) throw error;

                falhasCarregamento++;
                console.error(
                    "Erro ao carregar aulas para as estatísticas:",
                    error
                );

                return [];
            }
        })
    );

    const matriz = linhasPorRelacao.flat();

    const professoresComLinhas = new Set(
        matriz.map(row => String(row.professorId))
    );

    // Inclui também professores que ainda não possuem vínculos com turmas.
    professores.forEach(professor => {
        if (!professoresComLinhas.has(String(professor.id))) {
            matriz.push({
                id: null,
                aulaId: null,
                labelAula: null,
                professorId: professor.id,
                professor: rotuloProfessor(professor),
                turma: null,
                disciplina: null
            });
        }
    });

    return { matriz, falhasCarregamento };
}

export default function Estatisticas() {
    const { showToast } = useToast();
    const { user } = useAuth();
    const reportRef = useRef(null);
    const consultaGraficos = useRef(0);

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
    const [contextoRelatorio, setContextoRelatorio] = useState(null);

    const [kpis, setKpis] = useState({
        mediaGeral: 0,
        totalAulas: 0,
        melhorDesempenho: "N/A"
    });

    const cfg = CONFIG_COMPARACAO[option];

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        async function carregarEstatisticas() {
            setLoadingDados(true);

            try {
                const {
                    matriz: matrizFinal,
                    falhasCarregamento
                } = await carregarMatrizEstatisticas(
                    api,
                    controller.signal
                );

                if (isMounted) {
                    setMatriz(matrizFinal);

                    if (falhasCarregamento > 0) {
                        showToast(
                            "Alguns vínculos ou aulas não puderam ser carregados. As estatísticas podem estar incompletas.",
                            { type: "warning" }
                        );
                    }
                }
            } catch (error) {
                if (!isMounted) return;

                console.error(
                    "Erro ao carregar estatísticas:",
                    error
                );

                setMatriz([]);

                showToast(
                    "Não foi possível carregar as estatísticas. Tente novamente.",
                    { type: "error" }
                );
            } finally {
                if (isMounted) setLoadingDados(false);
            }
        }

        carregarEstatisticas();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [showToast]);

    // Limpa resultados anteriores quando os filtros ou os dados mudam.
    useEffect(() => {
        consultaGraficos.current++;
        setLoadingGraficos(false);
        setItemsParaComparar([]);
        setDadosComparativosLine([]);
        setDadosBarChart([]);
        setConfiguracaoLinhas([]);
        setContextoRelatorio(null);

        setKpis(
            calcularKpisMatriz(
                filtrarMatriz(
                    matriz,
                    CONFIG_COMPARACAO[option],
                    selectedA,
                    selectedB
                )
            )
        );

        return () => {
            consultaGraficos.current++;
        };
    }, [selectedA, selectedB, option, matriz]);

    const getAvailableOptions = (
        targetField,
        currentSelected,
        otherField,
        otherSelected
    ) => {
        if (matriz.length === 0) return [];

        let rows = matriz;

        if (
            otherSelected.length > 0 &&
            !otherSelected.includes("Todas")
        ) {
            rows = rows.filter(row =>
                otherSelected.includes(row[otherField])
            );
        }

        const all = [
            ...new Set(
                rows.map(row => row[targetField]).filter(Boolean)
            )
        ];

        const baseOptions = all.filter(
            item => !currentSelected.includes(item)
        );

        return currentSelected.includes("Todas")
            ? baseOptions
            : ["Todas", ...baseOptions];
    };

    const handleOptionChange = value => {
        setOption(value);
        setSelectedA([]);
        setSelectedB([]);
    };

    const handleSelectFilter = (value, setSelected) => {
        if (!value) return;

        if (value === "Todas") {
            setSelected(["Todas"]);
        } else {
            setSelected(prev => {
                if (prev.includes(value)) return prev;

                return [
                    ...prev.filter(item => item !== "Todas"),
                    value
                ];
            });
        }
    };

    const removeChip = (item, setSelected) => {
        setSelected(prev => prev.filter(value => value !== item));
    };

    const getListagem = () => {
        if (!option || matriz.length === 0) return [];

        const rows = filtrarMatriz(
            matriz,
            cfg,
            selectedA,
            selectedB
        );

        return [
            ...new Set(rows.map(row => row[cfg.mainField]))
        ].filter(Boolean);
    };

    const listagem = getListagem();

    const handleToggleItemComparacao = item => {
        if (
            !itemsParaComparar.includes(item) &&
            itemsParaComparar.length >= MAX_SELECAO_COMPARACAO
        ) {
            showToast(
                `Você pode comparar no máximo ${MAX_SELECAO_COMPARACAO} itens por vez para garantir a clareza do gráfico.`,
                { type: "warning" }
            );
            return;
        }

        setItemsParaComparar(prev => {
            if (prev.includes(item)) {
                return prev.filter(value => value !== item);
            }

            if (prev.length >= MAX_SELECAO_COMPARACAO) {
                return prev;
            }

            return [...prev, item];
        });
    };

    const handleGerarGraficos = async () => {
        if (
            itemsParaComparar.length === 0 ||
            loadingGraficos
        ) {
            return;
        }

        const consulta = ++consultaGraficos.current;
        setLoadingGraficos(true);

        try {
            const listaParaUnificar = [];
            const listaBarData = [];
            let falhasLeituras = 0;

            let somaMedias = 0;
            let maiorMedia = -1;
            let melhorNome = "N/A";

            const matrizFiltrada = filtrarMatriz(
                matriz,
                cfg,
                selectedA,
                selectedB
            );

            for (
                const [itemIndex, itemNome]
                of itemsParaComparar.entries()
            ) {
                const aulasDoItem = unicosPorId(
                    matrizFiltrada.filter(row =>
                        row[cfg.mainField] === itemNome &&
                        row.aulaId != null
                    )
                );

                if (aulasDoItem.length === 0) continue;

                const resultados = await Promise.all(
                    aulasDoItem.map(item =>
                        api.get(`/leituraAtencao/${item.aulaId}`)
                            .then(res => comoLista(res.data))
                            .catch(() => {
                                falhasLeituras++;
                                return [];
                            })
                    )
                );

                // Ignora respostas de uma comparação que já foi cancelada.
                if (consulta !== consultaGraficos.current) return;

                const dataFormatada = agruparLeituras(
                    resultados.flat()
                );

                if (dataFormatada.length > 0) {
                    const mediaItem = dataFormatada.reduce(
                        (soma, ponto) => soma + ponto.temp,
                        0
                    ) / dataFormatada.length;

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
                        id: `item_${itemIndex}`,
                        label: itemNome,
                        data: dataFormatada
                    });
                }
            }

            if (listaParaUnificar.length === 0) {
                showToast(
                    falhasLeituras > 0
                        ? "Não foi possível carregar os dados de atenção para os gráficos. Tente novamente."
                        : "Nenhum dado de atenção encontrado para os itens selecionados.",
                    {
                        type: falhasLeituras > 0
                            ? "error"
                            : "info"
                    }
                );

                setDadosComparativosLine([]);
                setDadosBarChart([]);
                setConfiguracaoLinhas([]);
                setContextoRelatorio(null);
                return;
            }

            const linhasConfig = listaParaUnificar.map(
                (item, index) => ({
                    key: item.id,
                    label: item.label,
                    color:
                        PALETA_CORES[index % PALETA_CORES.length]
                })
            );

            const dadosUnificados = unificarLinhasDoTempo(
                listaParaUnificar
            );

            setDadosComparativosLine(dadosUnificados);
            setDadosBarChart(listaBarData);
            setConfiguracaoLinhas(linhasConfig);
            setContextoRelatorio({
                tipo: option,
                geradoEm: new Date().toLocaleString('pt-BR'),
                filtros: [
                    { label: 'Comparação por', valor: option },
                    { label: 'Itens com resultados', valor: listaBarData.length },
                    { label: cfg.filterALabel, valor: selectedA.length ? selectedA.join(', ') : 'Todas' },
                    { label: cfg.filterBLabel, valor: selectedB.length ? selectedB.join(', ') : 'Todas' },
                ],
                totalAulas: unicosPorId(matrizFiltrada.filter(aula =>
                    aula.mediaAtencao != null && listaBarData.some(item => item.label === aula[cfg.mainField])
                )).length,
                mediaGeral: somaMedias / listaBarData.length,
                melhorDesempenho: melhorNome,
                leiturasIncompletas: falhasLeituras > 0,
            });

            setKpis(prev => ({
                ...prev,
                mediaGeral: somaMedias / listaBarData.length,
                melhorDesempenho: melhorNome
            }));

            if (falhasLeituras > 0) {
                showToast(
                    "Algumas leituras de atenção não puderam ser carregadas. Os gráficos podem estar incompletos.",
                    { type: "warning" }
                );
            }
        } catch (error) {
            if (consulta !== consultaGraficos.current) return;

            console.error("Erro ao gerar gráficos:", error);

            showToast(
                "Erro ao processar dados dos gráficos.",
                { type: "error" }
            );
        } finally {
            if (consulta === consultaGraficos.current) {
                setLoadingGraficos(false);
            }
        }
    };

    const handleExportarPDF = async () => {
        if (!reportRef.current || !contextoRelatorio || isExporting || loadingGraficos) return;

        setIsExporting(true);

        try {
            await document.fonts.ready;
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            if (!reportRef.current) return;
            await Promise.all(Array.from(reportRef.current.querySelectorAll('img'), image => image.decode()));
            const report = reportRef.current.cloneNode(true);

            const options = {
                margin: 10,
                filename:
                    `relatorio-estatisticas-${contextoRelatorio.tipo.toLowerCase()}.pdf`,
                pagebreak: {
                    mode: ['css', 'legacy'],
                    before: '.statistics-report__timeline',
                    avoid: ['.statistics-report__metrics', '.statistics-report__chart', '.statistics-report__table tr'],
                },
                image: {
                    type: "jpeg",
                    quality: 0.98
                },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    onclone: clonedDocument => {
                        // SVGs rasterizados separadamente precisam de cores resolvidas.
                        clonedDocument.querySelectorAll("svg, svg [fill], svg [stroke]").forEach(element => {
                            const styles = clonedDocument.defaultView.getComputedStyle(element);
                            for (const attribute of ["fill", "stroke"]) {
                                if (element.getAttribute(attribute)?.includes("var(")) {
                                    element.setAttribute(attribute, styles.getPropertyValue(attribute));
                                }
                            }
                        });
                    }
                },
                jsPDF: {
                    unit: "mm",
                    format: "a4",
                    orientation: "portrait"
                }
            };

            await html2pdf()
                .set(options)
                .from(report)
                .toPdf()
                .get('pdf')
                .then(pdf => {
                    const pages = pdf.internal.getNumberOfPages();
                    for (let page = 1; page <= pages; page++) {
                        pdf.setPage(page);
                        pdf.setFontSize(9);
                        pdf.text(`FOCA - ${page}/${pages}`, 105, 292, { align: 'center' });
                    }
                })
                .save();
            showToast(
                "Relatório PDF gerado com sucesso!",
                { type: "success" }
            );
        } catch (error) {
            console.error(
                "Erro ao exportar o relatório PDF:",
                error
            );

            showToast(
                "Não foi possível gerar o relatório PDF. Tente novamente.",
                { type: "error" }
            );
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="estatisticas-body">
            <Header
                routes={[
                    {
                        textButton: "Início",
                        routeButton: "/inicial-instituicao"
                    },
                    {
                        textButton: "Sobre o Projeto",
                        routeButton: "/"
                    },
                    {
                        textButton: "Perfil",
                        routeButton: "/editar-dados"
                    }
                ]}
            />

            <div
                className="estatisticas-content"
            >
                <div className="estatisticas-header-row">
                    <h2>Estatísticas da Instituição</h2>

                    {dadosBarChart.length > 0 && contextoRelatorio && (
                        <button
                            type="button"
                            className="estatisticas-btn-pdf"
                            onClick={handleExportarPDF}
                            disabled={isExporting || loadingGraficos || loadingDados}
                            aria-busy={isExporting}
                        >
                            {isExporting
                                ? "Gerando PDF..."
                                : "Baixar relatório PDF"}
                        </button>
                    )}
                </div>

                <div className="estatisticas-dashboard-grid">
                    <aside className="estatisticas-sidebar">
                        <div className="estatisticas-selector-box">
                            <p className="sidebar-subtitle">
                                Comparar por:
                            </p>

                            <Combobox
                                options={[
                                    "Professores",
                                    "Turmas",
                                    "Disciplinas",
                                    "Aulas"
                                ]}
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
                                        options={getAvailableOptions(
                                            cfg.filterAField,
                                            selectedA,
                                            cfg.filterBField,
                                            selectedB
                                        )}
                                        value=""
                                        onChange={value =>
                                            handleSelectFilter(
                                                value,
                                                setSelectedA
                                            )
                                        }
                                        placeholder={
                                            `Filtrar por ${cfg.filterALabel.toLowerCase()}`
                                        }
                                    />
                                </div>

                                {selectedA.length > 0 && (
                                    <div className="estatisticas-chips">
                                        {selectedA.map(item => (
                                            <div
                                                key={`a-${item}`}
                                                className="estatisticas-chip"
                                            >
                                                <span>{item}</span>

                                                <button
                                                    onClick={() =>
                                                        removeChip(
                                                            item,
                                                            setSelectedA
                                                        )
                                                    }
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="estatisticas-filter-row">
                                    <p>{cfg.filterBLabel}:</p>

                                    <Combobox
                                        options={getAvailableOptions(
                                            cfg.filterBField,
                                            selectedB,
                                            cfg.filterAField,
                                            selectedA
                                        )}
                                        value=""
                                        onChange={value =>
                                            handleSelectFilter(
                                                value,
                                                setSelectedB
                                            )
                                        }
                                        placeholder={
                                            `Filtrar por ${cfg.filterBLabel.toLowerCase()}`
                                        }
                                    />
                                </div>

                                {selectedB.length > 0 && (
                                    <div className="estatisticas-chips">
                                        {selectedB.map(item => (
                                            <div
                                                key={`b-${item}`}
                                                className="estatisticas-chip"
                                            >
                                                <span>{item}</span>

                                                <button
                                                    onClick={() =>
                                                        removeChip(
                                                            item,
                                                            setSelectedB
                                                        )
                                                    }
                                                >
                                                    ✕
                                                </button>
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
                                    Selecione (
                                    {itemsParaComparar.length}/
                                    {MAX_SELECAO_COMPARACAO}):
                                </p>

                                <div className="estatisticas-listagem">
                                    {listagem.map(item => {
                                        const active =
                                            itemsParaComparar.includes(
                                                item
                                            );

                                        return (
                                            <div
                                                key={item}
                                                className={
                                                    `estatisticas-listagem-item ${active ? "active" : ""}`
                                                }
                                                onClick={() =>
                                                    handleToggleItemComparacao(
                                                        item
                                                    )
                                                }
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
                                    disabled={
                                        itemsParaComparar.length === 0 ||
                                        loadingGraficos
                                    }
                                >
                                    {loadingGraficos
                                        ? "Processando..."
                                        : "Gerar Gráficos Comparativos"}
                                </button>
                            </div>
                        ) : (
                            option && (
                                <p className="empty-message">
                                    Nenhum item encontrado.
                                </p>
                            )
                        )}
                    </aside>

                    <main className="estatisticas-main">
                        <KpiCards
                            mediaGeral={kpis.mediaGeral}
                            totalAulas={kpis.totalAulas}
                            melhorDesempenho={
                                kpis.melhorDesempenho
                            }
                        />

                        <div className="estatisticas-average-attention">
                            <p className="estatisticas-average-attention-text">
                                Comparativo de Média de Atenção (%)
                            </p>

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
                                        Selecione os itens no painel à
                                        esquerda e clique em{" "}
                                        <strong>
                                            "Gerar Gráficos Comparativos"
                                        </strong>.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="estatisticas-average-attention">
                            <p className="estatisticas-average-attention-text">
                                Evolução da Atenção ao Longo do Tempo
                            </p>

                            <div className="estatisticas-average-attention-graph">
                                {dadosComparativosLine.length > 0 ? (
                                    <GenericLineChart
                                        data={dadosComparativosLine}
                                        xKey="tempoFormatado"
                                        lines={configuracaoLinhas}
                                    />
                                ) : (
                                    <p className="graph-placeholder">
                                        Selecione os itens no painel à
                                        esquerda e clique em{" "}
                                        <strong>
                                            "Gerar Gráficos Comparativos"
                                        </strong>.
                                    </p>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
            <StatisticsReport
                refProp={reportRef}
                contexto={contextoRelatorio}
                medias={dadosBarChart}
                linhaDoTempo={dadosComparativosLine}
                linhas={configuracaoLinhas}
                nomeInstituicao={user?.nome || 'Instituição'}
            />
        </div>
    );
}
