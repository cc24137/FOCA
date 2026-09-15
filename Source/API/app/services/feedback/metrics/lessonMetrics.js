const feedbackConfig = require("../feedbackConfig");

const {
    round,
    average,
    standardDeviation
} = require("../utils/feedbackUtils");


function normalizeReadings(readings) {
    if (!Array.isArray(readings)) {
        throw new Error("As leituras devem ser fornecidas em uma lista");
    }

    if (readings.length === 0) {
        return [];
    }

    const normalized = readings.map((reading, index) => {
        const second = Number(reading.segundoVideo);
        const attention = Number(reading.indiceAtencao);

        if (!Number.isInteger(second) || second < 0) {
            throw new Error(
                `segundoVideo inválido na leitura da posição ${index}`
            );
        }

        if (
            !Number.isFinite(attention) ||
            attention < 0 ||
            attention > 100
        ) {
            throw new Error(
                `indiceAtencao inválido na leitura da posição ${index}`
            );
        }

        return {
            second,
            attention
        };
    });

    normalized.sort(
        (a, b) => a.second - b.second
    );

    return normalized;
}


function smoothReadings(
    readings,
    windowSeconds
) {
    if (readings.length === 0) {
        return [];
    }

    const smoothed = [];

    let startIndex = 0;
    let sum = 0;

    for (
        let endIndex = 0;
        endIndex < readings.length;
        endIndex++
    ) {
        const current = readings[endIndex];

        sum += current.attention;

        while (
            current.second -
            readings[startIndex].second >
            windowSeconds
        ) {
            sum -= readings[startIndex].attention;
            startIndex++;
        }

        const amount =
            endIndex - startIndex + 1;

        smoothed.push({
            second: current.second,
            attention: sum / amount
        });
    }

    return smoothed;
}


function findMin(readings) {
    if (readings.length === 0) {
        return null;
    }

    let min = readings[0];

    for (const reading of readings) {
        if (reading.attention < min.attention) {
            min = reading;
        }
    }

    return {
        value: round(min.attention),
        second: min.second
    };
}


function findMax(readings) {
    if (readings.length === 0) {
        return null;
    }

    let max = readings[0];

    for (const reading of readings) {
        if (reading.attention > max.attention) {
            max = reading;
        }
    }

    return {
        value: round(max.attention),
        second: max.second
    };
}


function findBiggestVariations(
    readings,
    variationWindowSeconds
) {
    if (readings.length < 2) {
        return {
            biggestDrop: null,
            biggestRise: null
        };
    }

    let biggestDrop = null;
    let biggestRise = null;

    for (
        let startIndex = 0;
        startIndex < readings.length - 1;
        startIndex++
    ) {
        const start = readings[startIndex];

        for (
            let endIndex = startIndex + 1;
            endIndex < readings.length;
            endIndex++
        ) {
            const end = readings[endIndex];

            const elapsedTime =
                end.second - start.second;

            if (elapsedTime > variationWindowSeconds) {
                break;
            }

            const delta =
                end.attention - start.attention;

            if (
                delta < 0 &&
                (
                    biggestDrop === null ||
                    delta < biggestDrop.delta
                )
            ) {
                biggestDrop = {
                    startSecond: start.second,
                    endSecond: end.second,
                    from: round(start.attention),
                    to: round(end.attention),
                    delta: round(delta)
                };
            }

            if (
                delta > 0 &&
                (
                    biggestRise === null ||
                    delta > biggestRise.delta
                )
            ) {
                biggestRise = {
                    startSecond: start.second,
                    endSecond: end.second,
                    from: round(start.attention),
                    to: round(end.attention),
                    delta: round(delta)
                };
            }
        }
    }

    return {
        biggestDrop,
        biggestRise
    };
}


function findThresholdPeriods(
    readings,
    threshold,
    minimumDurationSeconds,
    comparator
) {
    const periods = [];

    let startIndex = null;

    for (let i = 0; i < readings.length; i++) {
        const reading = readings[i];

        const matches = comparator(
            reading.attention,
            threshold
        );

        if (matches && startIndex === null) {
            startIndex = i;
        }

        const isLastReading =
            i === readings.length - 1;

        if (
            startIndex !== null &&
            (!matches || isLastReading)
        ) {
            let endIndex;

            if (!matches) {
                endIndex = i - 1;
            }
            else {
                endIndex = i;
            }

            const start = readings[startIndex];
            const end = readings[endIndex];

            const duration =
                end.second - start.second;

            if (duration >= minimumDurationSeconds) {
                const values = readings
                    .slice(startIndex, endIndex + 1)
                    .map(item => item.attention);

                periods.push({
                    startSecond: start.second,
                    endSecond: end.second,
                    duration,
                    average: round(average(values)),
                    min: round(Math.min(...values)),
                    max: round(Math.max(...values))
                });
            }

            startIndex = null;
        }
    }

    return periods;
}


function findStablePeriods(
    readings,
    minimumDurationSeconds,
    maximumStandardDeviation
) {
    const periods = [];

    if (readings.length < 2) {
        return periods;
    }

    for (
        let startIndex = 0;
        startIndex < readings.length;
        startIndex++
    ) {
        let endIndex = startIndex;

        while (
            endIndex < readings.length &&
            (
                readings[endIndex].second -
                readings[startIndex].second
            ) < minimumDurationSeconds
        ) {
            endIndex++;
        }

        if (endIndex >= readings.length) {
            break;
        }

        const window = readings.slice(
            startIndex,
            endIndex + 1
        );

        const values = window.map(
            reading => reading.attention
        );

        const deviation =
            standardDeviation(values);

        if (
            deviation <=
            maximumStandardDeviation
        ) {
            periods.push({
                startSecond:
                    readings[startIndex].second,

                endSecond:
                    readings[endIndex].second,

                duration:
                    readings[endIndex].second -
                    readings[startIndex].second,

                average:
                    round(average(values)),

                standardDeviation:
                    round(deviation)
            });
        }
    }

    return periods;
}


function findRecovery(
    readings,
    biggestDrop
) {
    if (!biggestDrop) {
        return null;
    }

    const dropSize =
        biggestDrop.from - biggestDrop.to;

    if (dropSize <= 0) {
        return null;
    }

    const readingsAfterDrop = readings.filter(
        reading =>
            reading.second > biggestDrop.endSecond
    );

    if (readingsAfterDrop.length === 0) {
        return null;
    }

    let bestRecovery = readingsAfterDrop[0];

    for (const reading of readingsAfterDrop) {
        if (
            reading.attention >
            bestRecovery.attention
        ) {
            bestRecovery = reading;
        }
    }

    const recoveredPoints =
        bestRecovery.attention -
        biggestDrop.to;

    if (recoveredPoints <= 0) {
        return null;
    }

    const recoveryPercentage =
        Math.min(
            100,
            (
                recoveredPoints /
                dropSize
            ) * 100
        );

    return {
        startSecond: biggestDrop.endSecond,
        endSecond: bestRecovery.second,

        from: biggestDrop.to,
        to: round(bestRecovery.attention),

        recoveredPoints:
            round(recoveredPoints),

        percentage:
            round(recoveryPercentage)
    };
}


function calculateLessonMetrics(readings) {
    const config = feedbackConfig.lesson;

    const normalized =
        normalizeReadings(readings);

    if (normalized.length === 0) {
        return {
            amountOfReadings: 0,
            duration: 0,
            average: null,
            min: null,
            max: null,
            standardDeviation: null,
            biggestDrop: null,
            biggestRise: null,
            recovery: null,
            lowPeriods: [],
            highPeriods: [],
            stablePeriods: [],
            smoothedReadings: []
        };
    }

    const rawValues = normalized.map(
        reading => reading.attention
    );

    const smoothed = smoothReadings(
        normalized,
        config.smoothingWindowSeconds
    );

    const {
        biggestDrop,
        biggestRise
    } = findBiggestVariations(
        smoothed,
        config.variationWindowSeconds ?? 180
    );

    const lowPeriods = findThresholdPeriods(
        smoothed,
        config.lowAttentionThreshold,
        config.minimumLowPeriodSeconds,
        (value, threshold) =>
            value < threshold
    );

    const highPeriods = findThresholdPeriods(
        smoothed,
        config.highAttentionThreshold,
        config.minimumHighPeriodSeconds,
        (value, threshold) =>
            value > threshold
    );

    const stablePeriods = findStablePeriods(
        smoothed,
        config.minimumStablePeriodSeconds,
        config.stabilityMaxStandardDeviation
    );

    const recovery = findRecovery(
        smoothed,
        biggestDrop
    );

    return {
        amountOfReadings: normalized.length,

        duration:
            normalized[normalized.length - 1].second -
            normalized[0].second,

        average:
            round(average(rawValues)),

        min:
            findMin(smoothed),

        max:
            findMax(smoothed),

        standardDeviation:
            round(
                standardDeviation(rawValues)
            ),

        biggestDrop,
        biggestRise,
        recovery,

        lowPeriods,
        highPeriods,
        stablePeriods,

        smoothedReadings:
            smoothed.map(reading => ({
                second: reading.second,
                attention:
                    round(reading.attention)
            }))
    };
}


module.exports = {
    calculateLessonMetrics,

    /*
     * Exportados também para facilitar testes
     * unitários no futuro.
     */
    normalizeReadings,
    smoothReadings,
    findBiggestVariations,
    findThresholdPeriods,
    findStablePeriods,
    findRecovery
};
