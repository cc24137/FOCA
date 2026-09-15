const feedbackConfig = require("../feedbackConfig");

const {
    formatTime
} = require("../utils/feedbackUtils");


function significantDropRule(metrics) {
    const config = feedbackConfig.lesson;

    const drop = metrics.biggestDrop;

    if (!drop) {
        return null;
    }

    if (
        Math.abs(drop.delta) <
        config.significantDropPoints
    ) {
        return null;
    }

    return {
        id: "significant-drop",
        category: "attention_drop",
        tone: "warning",
        priority: 9,

        title: "Ponto para observar",

        message:
            `A atenção da turma caiu ` +
            `${Math.abs(drop.delta).toFixed(1)} pontos ` +
            `entre ${formatTime(drop.startSecond)} e ` +
            `${formatTime(drop.endSecond)}.`,

        interval: {
            startSecond: drop.startSecond,
            endSecond: drop.endSecond
        },

        metric: {
            type: "attention_points",
            value: drop.delta
        },

        data: {
            initialAttention: drop.from,
            finalAttention: drop.to,
            difference: drop.delta
        }
    };
}


function significantRiseRule(metrics) {
    const config = feedbackConfig.lesson;

    const rise = metrics.biggestRise;

    if (!rise) {
        return null;
    }

    if (
        rise.delta <
        config.significantRisePoints
    ) {
        return null;
    }

    return {
        id: "significant-rise",
        category: "attention_rise",
        tone: "positive",
        priority: 8,

        title: "Destaque positivo",

        message:
            `A atenção da turma aumentou ` +
            `${rise.delta.toFixed(1)} pontos ` +
            `entre ${formatTime(rise.startSecond)} e ` +
            `${formatTime(rise.endSecond)}.`,

        interval: {
            startSecond: rise.startSecond,
            endSecond: rise.endSecond
        },

        metric: {
            type: "attention_points",
            value: rise.delta
        },

        data: {
            initialAttention: rise.from,
            finalAttention: rise.to,
            difference: rise.delta
        }
    };
}


function lowAttentionPeriodRule(metrics) {
    if (
        !metrics.lowPeriods ||
        metrics.lowPeriods.length === 0
    ) {
        return null;
    }

    const period = metrics.lowPeriods.reduce(
        (longest, current) => {
            if (
                current.duration >
                longest.duration
            ) {
                return current;
            }

            return longest;
        }
    );

    return {
        id: "low-attention-period",
        category: "low_attention",
        tone: "warning",
        priority: 10,

        title: "Momento que merece atenção",

        message:
            `A turma permaneceu com atenção abaixo do esperado ` +
            `entre ${formatTime(period.startSecond)} e ` +
            `${formatTime(period.endSecond)}, ` +
            `com média de ${period.average.toFixed(1)} pontos.`,

        interval: {
            startSecond: period.startSecond,
            endSecond: period.endSecond
        },

        metric: {
            type: "average_attention",
            value: period.average
        },

        data: {
            duration: period.duration,
            averageAttention: period.average,
            minimumAttention: period.min,
            maximumAttention: period.max
        }
    };
}


function highAttentionPeriodRule(metrics) {
    if (
        !metrics.highPeriods ||
        metrics.highPeriods.length === 0
    ) {
        return null;
    }

    const period = metrics.highPeriods.reduce(
        (longest, current) => {
            if (
                current.duration >
                longest.duration
            ) {
                return current;
            }

            return longest;
        }
    );

    return {
        id: "high-attention-period",
        category: "high_attention",
        tone: "positive",
        priority: 6,

        title: "Bom nível de atenção",

        message:
            `A turma manteve um nível elevado de atenção ` +
            `entre ${formatTime(period.startSecond)} e ` +
            `${formatTime(period.endSecond)}, ` +
            `com média de ${period.average.toFixed(1)} pontos.`,

        interval: {
            startSecond: period.startSecond,
            endSecond: period.endSecond
        },

        metric: {
            type: "average_attention",
            value: period.average
        },

        data: {
            duration: period.duration,
            averageAttention: period.average
        }
    };
}


function stablePeriodRule(metrics) {
    if (
        !metrics.stablePeriods ||
        metrics.stablePeriods.length === 0
    ) {
        return null;
    }

    const period = metrics.stablePeriods.reduce(
        (best, current) => {
            if (
                current.standardDeviation <
                best.standardDeviation
            ) {
                return current;
            }

            return best;
        }
    );

    return {
        id: "stable-period",
        category: "stability",
        tone: "neutral",
        priority: 5,

        title: "Comportamento estável",

        message:
            `A atenção da turma permaneceu estável ` +
            `entre ${formatTime(period.startSecond)} e ` +
            `${formatTime(period.endSecond)}, ` +
            `mantendo média próxima de ` +
            `${period.average.toFixed(1)} pontos.`,

        interval: {
            startSecond: period.startSecond,
            endSecond: period.endSecond
        },

        metric: {
            type: "standard_deviation",
            value: period.standardDeviation
        },

        data: {
            duration: period.duration,
            averageAttention: period.average,
            standardDeviation:
                period.standardDeviation
        }
    };
}


function recoveryRule(metrics) {
    const config = feedbackConfig.lesson;

    const recovery = metrics.recovery;

    if (!recovery) {
        return null;
    }

    if (
        recovery.percentage <
        config.recoveryMinimumPercentage
    ) {
        return null;
    }

    /*
     * Também exigimos que a queda anterior tenha sido
     * suficientemente relevante.
     */
    if (
        !metrics.biggestDrop ||
        Math.abs(metrics.biggestDrop.delta) <
        config.significantDropPoints
    ) {
        return null;
    }

    return {
        id: "attention-recovery",
        category: "recovery",
        tone: "positive",
        priority: 8,

        title: "Boa recuperação",

        message:
            `Após uma queda na atenção, a turma recuperou ` +
            `${recovery.recoveredPoints.toFixed(1)} pontos, ` +
            `atingindo aproximadamente ` +
            `${recovery.percentage.toFixed(0)}% do nível anterior.`,

        interval: {
            startSecond: recovery.startSecond,
            endSecond: recovery.endSecond
        },

        metric: {
            type: "recovery_percentage",
            value: recovery.percentage
        },

        data: {
            recoveredPoints:
                recovery.recoveredPoints,

            recoveryPercentage:
                recovery.percentage,

            initialAttention:
                recovery.from,

            finalAttention:
                recovery.to
        }
    };
}


function runLessonRules(metrics) {
    return [
        lowAttentionPeriodRule(metrics),
        significantDropRule(metrics),
        recoveryRule(metrics),
        significantRiseRule(metrics),
        highAttentionPeriodRule(metrics),
        stablePeriodRule(metrics)
    ].filter(Boolean);
}


module.exports = {
    runLessonRules,

    significantDropRule,
    significantRiseRule,
    lowAttentionPeriodRule,
    highAttentionPeriodRule,
    stablePeriodRule,
    recoveryRule
};
