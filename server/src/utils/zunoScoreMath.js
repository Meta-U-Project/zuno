function calculateEMA(values, alpha = 0.4) {
    if (!values || values.length === 0) return 0;

    let ema = values[0];
    for (let i = 1; i < values.length; i++) {
        ema = alpha * values[i] + (1 - alpha) * ema;
    }
    return ema;
}

function calculateRegressionSlope(y, x) {
    if (y.length !== x.length || y.length === 0) return 0;

    const n = y.length;
    const xMean = x.reduce((a, b) => a + b) / n;
    const yMean = y.reduce((a, b) => a + b) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
        numerator += (x[i] - xMean) * (y[i] - yMean);
        denominator += (x[i] - xMean) ** 2;
    }

    return denominator === 0 ? 0 : numerator / denominator;
}

module.exports = {
    calculateEMA,
    calculateRegressionSlope
};
