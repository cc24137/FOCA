const feedbackConfig = require("../feedbackConfig");

const {
    round,
    average,
    standardDeviation
} = require("../utils/feedbackUtils");


function getLessonAverage(lesson) {
    if (
        lesson.totalAttentionAverage === null ||
        lesson.totalAttentionAverage === undefined
    ) {
        return null;
    }

    const value = Number(
        lesson.totalAttentionAverage
    );

    if (
        !Number.isFinite(value) ||
        value < 0 ||
        value > 100
    ) {
        throw new Error(
            "totalAttentionAverage deve estar entre 0 e 100"
        );
    }

    return value;
}


function normalizeLesson(lesson) {
    const averageValue =
        getLessonAverage(lesson);

    if (averageValue === null) {
        return null;
    }

    return {
        id: lesson.id ?? null,
        date: lesson.date ?? null,
        average: averageValue
    };
}


function getDateValue(date) {
    if (!date) {
        return null;
    }

    const value = new Date(date).getTime();

    if (Number.isNaN(value)) {
        return null;
    }

    return value;
}


function sortLessonsChronologically(lessons) {
    return [...lessons].sort((a, b) => {
        const dateA = getDateValue(a.date);
        const dateB = getDateValue(b.date);

        if (
            dateA !== null &&
            dateB !== null &&
            dateA !== dateB
        ) {
            return dateA - dateB;
        }

        const idA = Number(a.id);
        const idB = Number(b.id);

        if (
            Number.isFinite(idA) &&
            Number.isFinite(idB)
        ) {
            return idA - idB;
        }

        return 0;
    });
}


function normalizeHistory(previousLessons) {
    if (!Array.isArray(previousLessons)) {
        throw new Error(
            "O histórico de aulas deve ser uma lista"
        );
    }

    const normalized = previousLessons
        .map(normalizeLesson)
        .filter(Boolean);

    return sortLessonsChronologically(
        normalized
    );
}


function calculateTrend(lessons) {
    if (lessons.length < 2) {
        return null;
    }

    const values = lessons.map(
        lesson => lesson.average
    );

    const n = values.length;

    const xAverage = (n - 1) / 2;
    const yAverage = average(values);

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
        numerator +=
            (i - xAverage) *
            (values[i] - yAverage);

        denominator +=
            (i - xAverage) ** 2;
    }

    const slope =
        denominator === 0
            ? 0
            : numerator / denominator;

    const totalDifference =
        values[values.length - 1] -
        values[0];

    let positiveTransitions = 0;
    let negativeTransitions = 0;
    let stableTransitions = 0;

    for (let i = 1; i < values.length; i++) {
        const difference =
            values[i] - values[i - 1];

        if (difference > 0) {
            positiveTransitions++;
        }
        else if (difference < 0) {
            negativeTransitions++;
        }
        else {
            stableTransitions++;
        }
    }

    let direction = "mixed";

    if (
        slope > 0 &&
        totalDifference > 0
    ) {
        direction = "up";
    }
    else if (
        slope < 0 &&
        totalDifference < 0
    ) {
        direction = "down";
    }
    else if (
        slope === 0 &&
        totalDifference === 0
    ) {
        direction = "stable";
    }

    const transitions =
        values.length - 1;

    let consistency = 0;

    if (direction === "up") {
        consistency =
            positiveTransitions /
            transitions;
    }
    else if (direction === "down") {
        consistency =
            negativeTransitions /
            transitions;
    }
    else if (direction === "stable") {
        consistency =
            stableTransitions /
            transitions;
    }

    return {
        lessonCount: lessons.length,

        firstAverage:
            round(values[0]),

        lastAverage:
            round(values[values.length - 1]),

        slope:
            round(slope),

        totalDifference:
            round(totalDifference),

        direction,

        consistency:
            round(consistency, 3),

        positiveTransitions,
        negativeTransitions,
        stableTransitions
    };
}


function calculateHistoryMetrics(
    currentLesson,
    previousLessons
) {
    const config = feedbackConfig.history;

    const current =
        normalizeLesson(currentLesson);

    if (!current) {
        throw new Error(
            "A aula atual deve possuir totalAttentionAverage"
        );
    }

    const normalizedHistory =
        normalizeHistory(previousLessons);

    /*
     * Pegamos somente as N aulas anteriores mais recentes.
     */
    const recentHistory =
        normalizedHistory.slice(
            -config.lookbackLessons
        );

    const historicalValues =
        recentHistory.map(
            lesson => lesson.average
        );

    const historicalAverage =
        historicalValues.length > 0
            ? average(historicalValues)
            : null;

    const differenceFromHistoricalAverage =
        historicalAverage !== null
            ? current.average -
              historicalAverage
            : null;

    /*
     * Para tendência e estabilidade incluímos também
     * a aula atual.
     */
    const recentLessonsIncludingCurrent = [
        ...recentHistory,
        current
    ];

    const recentValues =
        recentLessonsIncludingCurrent.map(
            lesson => lesson.average
        );

    const trend = calculateTrend(
        recentLessonsIncludingCurrent
    );

    return {
        current,

        previousLessons:
            recentHistory,

        previousLessonCount:
            recentHistory.length,

        historicalAverage:
            historicalAverage === null
                ? null
                : round(historicalAverage),

        differenceFromHistoricalAverage:
            differenceFromHistoricalAverage === null
                ? null
                : round(
                    differenceFromHistoricalAverage
                ),

        recentAverage:
            round(
                average(recentValues)
            ),

        recentStandardDeviation:
            round(
                standardDeviation(recentValues)
            ),

        recentLessonCount:
            recentLessonsIncludingCurrent.length,

        trend
    };
}


module.exports = {
    calculateHistoryMetrics,
    calculateTrend,
    normalizeHistory,
    normalizeLesson
};
