const feedbackConfig = require("../feedbackConfig");


function comparisonWithHistoryRule(metrics) {
    const config = feedbackConfig.history;

    if (
        metrics.previousLessonCount <
        config.minimumLessons
    ) {
        return null;
    }

    const difference =
        metrics.differenceFromHistoricalAverage;

    if (difference === null) {
        return null;
    }

    if (
        Math.abs(difference) <
        config.significantDifferencePoints
    ) {
        return null;
    }

    if (difference > 0) {
        return {
            id: "above-recent-average",
            category: "historical_comparison",
            tone: "positive",
            priority: 9,

            title: "Destaque positivo",

            message:
                `A atenção média desta aula ficou ` +
                `${difference.toFixed(1)} pontos acima ` +
                `da média das últimas ` +
                `${metrics.previousLessonCount} aulas.`,

            metric: {
                type: "attention_points",
                value: difference
            },

            data: {
                currentAverage:
                    metrics.current.average,

                historicalAverage:
                    metrics.historicalAverage,

                difference
            }
        };
    }

    return {
        id: "below-recent-average",
        category: "historical_comparison",
        tone: "warning",
        priority: 9,

        title: "Vale observar",

        message:
            `A atenção média desta aula ficou ` +
            `${Math.abs(difference).toFixed(1)} pontos abaixo ` +
            `da média das últimas ` +
            `${metrics.previousLessonCount} aulas.`,

        metric: {
            type: "attention_points",
            value: difference
        },

        data: {
            currentAverage:
                metrics.current.average,

            historicalAverage:
                metrics.historicalAverage,

            difference
        }
    };
}


function trendRule(metrics) {
    const config = feedbackConfig.history;

    const trend = metrics.trend;

    if (!trend) {
        return null;
    }

    if (
        trend.lessonCount <
        config.trendMinimumLessons
    ) {
        return null;
    }

    if (
        Math.abs(trend.totalDifference) <
        config.trendMinimumDifferencePoints
    ) {
        return null;
    }

    if (
        trend.consistency <
        config.trendMinimumConsistency
    ) {
        return null;
    }

    if (trend.direction === "up") {
        return {
            id: "historical-upward-trend",
            category: "historical_trend",
            tone: "positive",
            priority: 8,

            title: "Tendência de melhora",

            message:
                `Nas últimas ${trend.lessonCount} aulas, ` +
                `a atenção média apresenta uma tendência de melhora, ` +
                `com aumento de ` +
                `${trend.totalDifference.toFixed(1)} pontos ` +
                `entre a primeira e a aula mais recente.`,

            metric: {
                type: "historical_trend",
                value: trend.slope
            },

            data: {
                lessonCount:
                    trend.lessonCount,

                firstAverage:
                    trend.firstAverage,

                lastAverage:
                    trend.lastAverage,

                totalDifference:
                    trend.totalDifference,

                consistency:
                    trend.consistency
            }
        };
    }

    if (trend.direction === "down") {
        return {
            id: "historical-downward-trend",
            category: "historical_trend",
            tone: "warning",
            priority: 8,

            title: "Tendência para observar",

            message:
                `Nas últimas ${trend.lessonCount} aulas, ` +
                `a atenção média apresenta uma tendência de queda, ` +
                `com redução de ` +
                `${Math.abs(trend.totalDifference).toFixed(1)} pontos ` +
                `entre a primeira e a aula mais recente.`,

            metric: {
                type: "historical_trend",
                value: trend.slope
            },

            data: {
                lessonCount:
                    trend.lessonCount,

                firstAverage:
                    trend.firstAverage,

                lastAverage:
                    trend.lastAverage,

                totalDifference:
                    trend.totalDifference,

                consistency:
                    trend.consistency
            }
        };
    }

    return null;
}


function historicalStabilityRule(metrics) {
    const config = feedbackConfig.history;

    if (
        metrics.recentLessonCount <
        config.minimumLessons
    ) {
        return null;
    }

    if (
        metrics.recentStandardDeviation >
        config.stabilityMaxStandardDeviation
    ) {
        return null;
    }

    /*
     * Evita chamar de estável um histórico que também
     * apresentou uma diferença relevante entre o início
     * e o fim.
     */
    if (
        metrics.trend &&
        Math.abs(metrics.trend.totalDifference) >=
        config.significantDifferencePoints
    ) {
        return null;
    }

    return {
        id: "historical-stability",
        category: "historical_stability",
        tone: "neutral",
        priority: 5,

        title: "Comportamento consistente",

        message:
            `A atenção média permaneceu relativamente estável ` +
            `nas últimas ${metrics.recentLessonCount} aulas, ` +
            `mantendo média próxima de ` +
            `${metrics.recentAverage.toFixed(1)} pontos.`,

        metric: {
            type: "standard_deviation",
            value:
                metrics.recentStandardDeviation
        },

        data: {
            lessonCount:
                metrics.recentLessonCount,

            averageAttention:
                metrics.recentAverage,

            standardDeviation:
                metrics.recentStandardDeviation
        }
    };
}


function runHistoryRules(metrics) {
    return [
        comparisonWithHistoryRule(metrics),
        trendRule(metrics),
        historicalStabilityRule(metrics)
    ].filter(Boolean);
}


module.exports = {
    runHistoryRules,
    comparisonWithHistoryRule,
    trendRule,
    historicalStabilityRule
};
