import React, { useRef, useState } from 'react';
import Papa from 'papaparse';

const DataInput = ({ onDataLoad }) => {
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);

    const fetchOnlineData = async () => {
        setLoading(true);
        try {
            const today = new Date();
            const endDate = today.toISOString().split('T')[0];
            // Start from 2 years ago to get good history
            const startDate = new Date(today.getFullYear() - 2, 0, 1).toISOString().split('T')[0];

            // Using API for real data
            // Fetch daily weather data (Temperature & Rain) for Manila (Tropical context)
            const response = await fetch(
                `https://archive-api.open-meteo.com/v1/archive?latitude=14.60&longitude=120.98&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_mean,rain_sum&timezone=auto`
            );
            const data = await response.json();

            if (!data.daily) throw new Error("No daily data received");

            // Aggregation Containers
            const monthlyStats = {};

            data.daily.time.forEach((dateStr, index) => {
                const date = new Date(dateStr);
                const monthKey = `${date.getFullYear()}-${date.getMonth()}`; // Group by YYYY-M

                if (!monthlyStats[monthKey]) {
                    monthlyStats[monthKey] = {
                        dateObj: new Date(date.getFullYear(), date.getMonth(), 1),
                        tempSum: 0,
                        rainSum: 0,
                        days: 0
                    };
                }

                // Accumulate
                monthlyStats[monthKey].tempSum += data.daily.temperature_2m_mean[index] || 0;
                monthlyStats[monthKey].rainSum += data.daily.rain_sum[index] || 0;
                monthlyStats[monthKey].days++;
            });

            // Convert to application format
            const formatted = Object.values(monthlyStats)
                .sort((a, b) => a.dateObj - b.dateObj)
                .map(stat => {
                    const avgTemp = stat.tempSum / stat.days;
                    const totalRain = stat.rainSum;

                    // --- LOGIC: Map Weather to Lab Tests ---

                    // Base Volume: 1200 - 1500
                    // Growth Trend: Slight increase over time (simulating business growth)
                    const timeFactor = (stat.dateObj.getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 30); // Months passed
                    const baseVolume = 1200 + (timeFactor * 10) + (Math.random() * 50);

                    // CBC: 
                    // - Higher in Rainy Season (Dengue/Water properties) -> Rain correlation
                    // - Higher in Cold Season (Flu) -> Inverse Temp correlation
                    // Manila Context: Rain is the dominant factor for spikes
                    const rainFactor = Math.min(totalRain, 500) * 0.5; // Cap rain influence
                    const tempFactor = (30 - avgTemp) * 20; // Cooler = more flu
                    const cbc = Math.floor((baseVolume * 0.6) + rainFactor + tempFactor);

                    // Urinalysis: Higher in Hot Season (Dehydration/UTI)
                    const heatFactor = Math.max(0, (avgTemp - 27) * 30);
                    const urine = Math.floor((baseVolume * 0.25) + heatFactor);

                    // Fecalysis: Slightly higher in rainy season (water contamination)
                    const contaminationFactor = Math.min(totalRain, 300) * 0.1;
                    const fecal = Math.floor((baseVolume * 0.15) + contaminationFactor);

                    const total = cbc + urine + fecal;

                    return {
                        date: stat.dateObj.toLocaleString('default', { month: 'short', year: 'numeric' }),
                        total,
                        cbc,
                        urine,
                        fecal,
                        timestamp: stat.dateObj.getTime()
                    };
                });

            onDataLoad(formatted);
        } catch (error) {
            console.error("Failed to fetch online data:", error);
            alert("Failed to fetch online data. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                complete: (results) => {
                    const formatted = results.data
                        .filter(row => row['Month/Year'] && row['Total Tests'])
                        .map(row => ({
                            date: row['Month/Year'],
                            total: row['Total Tests'],
                            cbc: row['CBC'],
                            urine: row['Urinalysis'],
                            fecal: row['Fecalysis'],
                            timestamp: new Date(row['Month/Year']).getTime()
                        }));
                    onDataLoad(formatted);
                }
            });
        }
    };

    return (
        <div className="p-3">
            <div className="mb-3">
                <label className="form-label text-muted small">Upload Historical CSV</label>
                <div className="input-group">
                    <input
                        type="file"
                        className="form-control"
                        ref={fileInputRef}
                        accept=".csv"
                        onChange={handleFileUpload}
                    />
                </div>
                <div className="form-text text-muted">
                    Expected: Month/Year, Total Tests, CBC, Urinalysis, Fecalysis
                </div>
            </div>

            <div className="d-flex align-items-center mb-3">
                <hr className="flex-grow-1 border-secondary" />
                <span className="mx-2 text-muted small">OR</span>
                <hr className="flex-grow-1 border-secondary" />
            </div>

            <div className="d-grid gap-2">
                <button
                    className="btn btn-outline-primary"
                    onClick={fetchOnlineData}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" />
                            Analyzing Weather Patterns...
                        </>
                    ) : '🌍 Fetch Online Data (Open-Meteo API)'}
                </button>
                <div className="text-center text-muted small fst-italic mt-1">
                    Simulates lab volume based on historical temperature & rainfall
                </div>
            </div>
        </div>
    );
};

export default DataInput;
