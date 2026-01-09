import * as tf from '@tensorflow/tfjs';

export default class ForecastModel {
    constructor() {
        this.model = null;

        // Number of previous months used as input
        this.windowSize = 3;

        // Stores min/max values used during normalization
        this.normalizationData = {};
    }

    /**
     * Normalizes a specific field in the dataset to a 0–1 range.
     * This helps the model train more effectively.
     */
    normalize(data, key) {
        const values = data.map(d => d[key]);
        const min = Math.min(...values);
        const max = Math.max(...values);

        // Save normalization info for later denormalization
        this.normalizationData = { min, max, key };

        // Avoid division by zero if all values are the same
        const range = max - min === 0 ? 1 : max - min;

        return data.map(d => ({
            ...d,
            normalized: (d[key] - min) / range
        }));
    }

    /**
     * Converts a normalized value back to its original scale.
     */
    denormalize(val) {
        const { min, max } = this.normalizationData;
        const range = max - min === 0 ? 1 : max - min;
        return val * range + min;
    }

    /**
     * Creates and compiles the TensorFlow.js model.
     */
    createModel() {
        const model = tf.sequential();

        // First hidden layer: learns patterns from previous months
        model.add(tf.layers.dense({
            units: 64,
            activation: 'relu',
            inputShape: [this.windowSize]
        }));

        // Second hidden layer: refines learned features
        model.add(tf.layers.dense({
            units: 32,
            activation: 'relu'
        }));

        // Output layer: predicts a single future value
        model.add(tf.layers.dense({
            units: 1
        }));

        model.compile({
            optimizer: tf.train.adam(0.01),
            loss: 'meanSquaredError'
        });

        return model;
    }

    /**
     * Trains the model using historical data.
     */
    async train(data, targetKey, onEpochEnd) {
        const normalized = this.normalize(data, targetKey);
        const inputs = [];
        const labels = [];

        // Create sliding windows of past values
        for (let i = 0; i < normalized.length - this.windowSize; i++) {
            const window = normalized
                .slice(i, i + this.windowSize)
                .map(d => d.normalized);

            inputs.push(window);
            labels.push(normalized[i + this.windowSize].normalized);
        }

        const xs = tf.tensor2d(inputs, [inputs.length, this.windowSize]);
        const ys = tf.tensor2d(labels, [labels.length, 1]);

        this.model = this.createModel();

        // Train the model
        await this.model.fit(xs, ys, {
            epochs: 150,
            shuffle: true,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    if (onEpochEnd) {
                        onEpochEnd(epoch + 1, logs);
                    }
                }
            }
        });

        // Free memory
        xs.dispose();
        ys.dispose();
    }

    /**
     * Generates future predictions based on the trained model.
     */
    predict(data, monthsToPredict = 12) {
        if (!this.model) return [];

        const predictions = [];

        // Normalize input using the same stats from training
        const normalized = this.normalize(data, this.normalizationData.key);

        // Start with the most recent known values
        let currentWindow = normalized
            .slice(-this.windowSize)
            .map(d => d.normalized);

        for (let i = 0; i < monthsToPredict; i++) {
            const input = tf.tensor2d([currentWindow], [1, this.windowSize]);
            const output = this.model.predict(input);
            const predictedValue = output.dataSync()[0];

            // Convert back to original scale
            const actualValue = Math.round(this.denormalize(predictedValue));

            // Prevent negative predictions
            predictions.push(Math.max(0, actualValue));

            // Update the sliding window
            currentWindow.shift();
            currentWindow.push(predictedValue);

            input.dispose();
            output.dispose();
        }

        return predictions;
    }
}
