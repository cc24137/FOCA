function round(value, decimals = 2) {
    if (!Number.isFinite(value)) {
        return null;
    }

    const factor = 10 ** decimals;

    return Math.round(value * factor) / factor;
}


function average(values) {
    if (!Array.isArray(values) || values.length === 0) {
        return null;
    }

    const sum = values.reduce(
        (total, value) => total + value,
        0
    );

    return sum / values.length;
}


function standardDeviation(values) {
    if (!Array.isArray(values) || values.length === 0) {
        return null;
    }

    const mean = average(values);

    const variance = values.reduce(
        (total, value) => {
            const difference = value - mean;

            return total + (difference ** 2);
        },
        0
    ) / values.length;

    return Math.sqrt(variance);
}


function formatTime(seconds) {
    const totalSeconds = Math.max(
        0,
        Math.floor(Number(seconds) || 0)
    );

    const hours = Math.floor(totalSeconds / 3600);

    const minutes = Math.floor(
        (totalSeconds % 3600) / 60
    );

    const remainingSeconds = totalSeconds % 60;

    if (hours > 0) {
        return [
            hours,
            String(minutes).padStart(2, "0"),
            String(remainingSeconds).padStart(2, "0")
        ].join(":");
    }

    return [
        minutes,
        String(remainingSeconds).padStart(2, "0")
    ].join(":");
}


module.exports = {
    round,
    average,
    standardDeviation,
    formatTime
};
