# MamatayHealthyLab Forecasting System 🧪📈

A browser-based forecasting tool that predicts a diagnostic lab's **monthly test volume for the next 12 months** (total tests, CBC, urinalysis and fecalysis). Everything, including training, runs **client-side with TensorFlow.js**, so there's no server and no data leaves the browser.

---

## ✨ Features

- **Two data sources**
  - **Upload a CSV** of historical monthly volumes
  - **Generate a sample dataset** from real Manila weather history ([Open-Meteo archive API](https://open-meteo.com/)): monthly rainfall and temperature are mapped to test demand (rainy-season spikes in CBC, heat-related urinalysis, and so on) so the model has realistic seasonality to learn
- **One neural network per metric:** four models are trained back-to-back, with live epoch/loss logs in the UI
- **12-month recursive forecast:** each prediction feeds the next input window
- **Charts:** historical vs. forecast lines per test type (Chart.js)
- **Data table:** preview or expand the full loaded dataset

## 🧠 The model

| | |
|---|---|
| Approach | Sliding-window regression: the previous **3 months** predict the next |
| Architecture | Dense(64, ReLU) → Dense(32, ReLU) → Dense(1) |
| Training | Adam (lr 0.01), mean-squared error, 150 epochs |
| Preprocessing | Min–max normalisation per metric, denormalised for display |

The code is in [`src/components/ForecastModel.js`](src/components/ForecastModel.js) and is commented step by step.

## 📄 CSV format

```csv
Month/Year,Total Tests,CBC,Urinalysis,Fecalysis
Jan 2023,1200,720,300,180
Feb 2023,1150,690,290,170
```

## 🛠️ Tech stack

React · Vite · TensorFlow.js · Chart.js (react-chartjs-2) · PapaParse · React-Bootstrap

## 🚀 Running locally

```bash
git clone https://github.com/Valloiced/MamatayHealthyLab-Forecasting-System.git
cd MamatayHealthyLab-Forecasting-System
npm install
npm run dev
```

Open http://localhost:5173, load data, then click **Train & Predict**.

## 🔭 Possible next steps

- Hold out the last N months and report MAE/MAPE so forecast accuracy is measurable
- Compare against a seasonal-naive baseline
- Try an LSTM layer to capture longer seasonality

---

Made by [Vince Sualog](https://github.com/Valloiced)
