import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const ResultsCharts = ({ history, forecast }) => {
    if (!history || history.length === 0) return null;

    // Combine labels
    const historyLabels = history.map(d => d.date);
    const forecastLabels = forecast ? forecast.map(d => d.date) : [];
    const allLabels = [...historyLabels, ...forecastLabels];

    // Data arrays padded with nulls so they align
    const historyData = history.map(d => d.total);
    const forecastData = forecast
        ? new Array(history.length).fill(null).concat(forecast.map(d => d.total))
        : [];

    // Connect the lines visually: add the last history point to forecast
    if (forecast && history.length > 0) {
        forecastData[history.length - 1] = history[history.length - 1].total;
    }

    const data = {
        labels: allLabels,
        datasets: [
            {
                label: 'Historical Data',
                data: historyData,
                borderColor: '#0d6efd', // Bootstrap Primary Blue
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                tension: 0.3,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#0d6efd'
            },
            {
                label: 'Forecast',
                data: forecastData,
                borderColor: '#198754', // Bootstrap Success Green
                backgroundColor: 'rgba(25, 135, 84, 0.1)',
                borderDash: [5, 5],
                tension: 0.3,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#198754'
            }
        ]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#495057' }
            },
            title: {
                display: true,
                text: 'Laboratory Test Volume: History & Forecast',
                color: '#212529',
                font: { size: 16, weight: 'bold' }
            },
        },
        scales: {
            y: {
                grid: { color: '#e9ecef' },
                ticks: { color: '#6c757d' }
            },
            x: {
                grid: { color: '#e9ecef' },
                ticks: { color: '#6c757d' }
            }
        }
    };

    return (
        <div style={{ height: '400px' }}>
            <Line data={data} options={options} />
        </div>
    );
};

export default ResultsCharts;
