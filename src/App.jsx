import React, { useState } from 'react';
import { Container, Row, Col, Navbar, Nav } from 'react-bootstrap';
import DataInput from './components/DataInput';
import ForecastModel from './components/ForecastModel';
import ResultsCharts from './components/ResultsCharts';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

function App() {
  const [data, setData] = useState([]);
  const [model, setModel] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingLogs, setTrainingLogs] = useState([]);

  const [showFullData, setShowFullData] = useState(false);

  const handleDataLoad = (newData) => {
    setData(newData);
    setForecast(null); // Reset forecast on new data
    setTrainingLogs([]);
    setShowFullData(false); // Reset view on new data
  };

  const handleTrainAndPredict = async () => {
    if (data.length === 0) return;
    setIsTraining(true);
    setTrainingLogs([]);

    try {
      const targets = ['total', 'cbc', 'urine', 'fecal'];
      const results = {};

      // We need to generate dates for the forecast (next 12 months)
      // Base off the last date in data
      let lastDate = new Date(data[data.length - 1].timestamp);
      const forecastDates = [];
      for (let i = 0; i < 12; i++) {
        lastDate.setMonth(lastDate.getMonth() + 1);
        forecastDates.push(lastDate.toLocaleString('default', { month: 'short', year: 'numeric' }));
      }

      // Initialize results structure
      const forecastData = forecastDates.map(date => ({ date, total: 0, cbc: 0, urine: 0, fecal: 0 }));

      // Train a separate model for each metric
      for (const target of targets) {
        setTrainingLogs(prev => [...prev, `Starting training for: ${target.toUpperCase()}...`]);

        const forecaster = new ForecastModel();
        await forecaster.train(data, target, (epoch, logs) => {
          // Only log every 50 epochs to avoid spamming the UI since we run 4 models
          if (epoch % 50 === 0) {
            setTrainingLogs(prev => [...prev, `[${target.toUpperCase()}] Epoch ${epoch}: Loss = ${logs.loss.toFixed(4)}`]);
          }
        });

        const predictions = forecaster.predict(data); // Returns array of numbers

        // Map predictions to the forecastData array
        predictions.forEach((val, idx) => {
          if (forecastData[idx]) {
            forecastData[idx][target] = val;
          }
        });
      }

      setForecast(forecastData);
      setTrainingLogs(prev => [...prev, "All models trained successfully!"]);

    } catch (error) {
      console.error("Training failed", error);
      setTrainingLogs(prev => [...prev, `Error: ${error.message}`]);
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar bg="white" expand="lg" className="mb-4 border-bottom">
        <Container>
          <Navbar.Brand href="#">
            MamatayHealthyLab <span className="text-muted fw-light fs-6">| Forecasting System</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
            <Nav>
              <Nav.Link href="#" className="active fw-bold text-primary">Dashboard</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="py-2">
        <Row>
          <Col lg={4}>
            <div className="card shadow-sm">
              <div className="card-header">
                Data Management
              </div>
              <div className="card-body">
                <DataInput onDataLoad={handleDataLoad} />
              </div>
            </div>

            <div className="card shadow-sm">
              <div className="card-header">
                Model Controls
              </div>
              <div className="card-body">
                <p className="text-muted small">
                  {data.length > 0
                    ? `${data.length} records loaded.`
                    : "Please load data to begin."}
                </p>
                <button
                  className="btn btn-primary w-100 mb-3"
                  onClick={handleTrainAndPredict}
                  disabled={data.length === 0 || isTraining}
                >
                  {isTraining ? 'Training Model...' : 'Train & Predict'}
                </button>

                {isTraining && (
                  <div className="mt-3 text-center">
                    <div className="loading-spinner mx-auto mb-2"></div>
                    <div className="small text-muted">Optimizing parameters...</div>
                  </div>
                )}

                {trainingLogs.length > 0 && (
                  <div className="mt-3 p-2 bg-light border rounded small text-monospace" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {trainingLogs.slice(-5).map((log, i) => <div key={i} className="text-secondary">{log}</div>)}
                  </div>
                )}
              </div>
            </div>
          </Col>

          <Col lg={8}>
            <div className="card shadow-sm">
              <div className="card-header">
                {forecast ? 'Forecast Results' : 'Historical Overview'}
              </div>
              <div className="card-body">
                <ResultsCharts history={data} forecast={forecast} />
              </div>
            </div>

            {data.length > 0 && (
              <div className="card shadow-sm">
                <div className="card-header d-flex justify-content-between align-items-center bg-white">
                  <span>Dataset Preview</span>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setShowFullData(!showFullData)}
                  >
                    {showFullData ? 'Collapse' : 'Expand'}
                  </button>
                </div>
                <div className="table-responsive" style={{ maxHeight: showFullData ? '500px' : 'auto', overflowY: 'auto' }}>
                  <table className="table table-hover mb-0">
                    <thead className="table-light full-width-header" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                      <tr>
                        <th>Date</th>
                        <th>Total</th>
                        <th>CBC</th>
                        <th>Urinalysis</th>
                        <th>Fecalysis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(showFullData ? data : data.slice(0, 5)).map((row, idx) => (
                        <tr key={idx}>
                          <td className="fw-bold text-muted">{row.date}</td>
                          <td><span className="badge bg-primary rounded-pill">{row.total}</span></td>
                          <td>{row.cbc}</td>
                          <td>{row.urine}</td>
                          <td>{row.fecal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!showFullData && data.length > 5 && (
                    <div className="p-2 text-center border-top bg-light">
                      <small className="text-muted">Showing 5 of {data.length} records</small>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Col>
        </Row>
      </Container>

      <footer className="text-center py-4 text-muted border-top mt-5 bg-white">
        <small>© 2026 MamatayHealthyLab Diagnostics Center. All Rights Reserved.</small>
      </footer>
    </div>
  );
}

export default App;
