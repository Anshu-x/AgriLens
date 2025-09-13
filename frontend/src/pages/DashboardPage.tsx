import React, { useEffect, useMemo, useState } from 'react';
import './pages.css';
import heatmapImg from '../images/heatmap.jpeg';

// CNN+LSTM Types
interface CNNLSTMAnalysis {
  crop_health: number;
  water_stress: number;
  pest_risk: "low" | "medium" | "high";
  pest_confidence: number;
  yield_prediction: number;
  model_type: string;
  architecture: {
    cnn_features: string;
    lstm_features: string;
    fusion_method: string;
    total_parameters: number;
  };
  recommendations: string[];
  processing_date: string;
}

interface AgriLensPlot {
  plotName: string;
  cropType: string;
  soilType: string;
  irrigation: string;
  temperature: number;
  rainfall: number;
  polygonPath: any[];
  cnnLstmAnalysis?: CNNLSTMAnalysis;
  createdAt: string;
  notes: string;
}

type TrendPoint = { x: number; y: number };

// CNN+LSTM API Configuration
const CNN_LSTM_API = "https://agrilens-real-cnn-lstm-361194337063.us-central1.run.app";

const DashboardPage: React.FC = () => {
  const [now, setNow] = useState(() => new Date());
  const [agriPlots, setAgriPlots] = useState<AgriLensPlot[]>([]);
  const [cnnLstmAnalysis, setCnnLstmAnalysis] = useState<CNNLSTMAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [viewMode, setViewMode] = useState<'satellite' | 'ndvi'>('satellite');
  
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  // Load saved plots from AddPlotPage
  useEffect(() => {
    const savedPlots = JSON.parse(localStorage.getItem('agrilens_plots') || '[]');
    setAgriPlots(savedPlots);
    
    // If plots exist, use the first plot's analysis
    if (savedPlots.length > 0 && savedPlots[0].cnnLstmAnalysis) {
      setCnnLstmAnalysis(savedPlots[0].cnnLstmAnalysis);
    }
  }, []);

  // Utility Functions for Satellite Imagery
  const getPlotSatelliteImage = (polygonPath: any[], plotName: string) => {
    if (!polygonPath.length) return null;

    // Calculate bounds of the polygon
    const lats = polygonPath.map((p: any) => p.lat);
    const lngs = polygonPath.map((p: any) => p.lng);
    
    const bounds = {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs), 
      west: Math.min(...lngs)
    };

    // Calculate center and zoom level
    const center = {
      lat: (bounds.north + bounds.south) / 2,
      lng: (bounds.east + bounds.west) / 2
    };

    // Calculate appropriate zoom level based on polygon size
    const latDiff = bounds.north - bounds.south;
    const lngDiff = bounds.east - bounds.west;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    let zoom = 18; // Default high zoom for field-level detail
    if (maxDiff > 0.01) zoom = 16;      // Large field
    if (maxDiff > 0.02) zoom = 15;      // Very large field
    if (maxDiff > 0.05) zoom = 14;      // Huge field

    // Create polygon path string for Google Maps Static API
    const pathString = polygonPath
      .map((p: any) => `${p.lat},${p.lng}`)
      .join('|');

    // Google Maps Static API URL for satellite view with polygon overlay
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?` +
      `center=${center.lat},${center.lng}&` +
      `zoom=${zoom}&` +
      `size=600x400&` +
      `maptype=satellite&` +
      `path=color:0x00FF00|weight:3|fillcolor:0x00FF0050|${pathString}&` +
      `key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`;

    return {
      url: staticMapUrl,
      bounds,
      center,
      plotName,
      zoom
    };
  };

  const calculatePolygonArea = (polygonPath: any[]) => {
    if (polygonPath.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < polygonPath.length; i++) {
      const j = (i + 1) % polygonPath.length;
      area += polygonPath[i].lat * polygonPath[j].lng;
      area -= polygonPath[j].lat * polygonPath[i].lng;
    }
    area = Math.abs(area) / 2;
    
    // Convert to hectares (rough approximation)
    const hectares = area * 111000 * 111000 / 10000;
    return Math.min(hectares, 1000); // Cap at reasonable maximum
  };

  // Generate NDVI visualization canvas
  const generateNDVICanvas = (analysis: CNNLSTMAnalysis) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    const healthFactor = analysis.crop_health / 100;
    const stressFactor = (100 - analysis.water_stress) / 100;
    
    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % canvas.width;
      const y = Math.floor((i / 4) / canvas.width);
      
      // Create field-like patterns
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2) / Math.sqrt(centerX ** 2 + centerY ** 2);
      
      // Generate NDVI value based on CNN+LSTM analysis
      let ndvi = healthFactor * stressFactor * (0.8 - distanceFromCenter * 0.2);
      ndvi += (Math.random() - 0.5) * 0.15; // Add realistic variation
      ndvi = Math.max(0.1, Math.min(0.9, ndvi));
      
      // Convert NDVI to color (red=low, yellow=medium, green=high)
      let r, g, b;
      if (ndvi < 0.3) {
        r = 255;
        g = Math.floor(ndvi * 3.33 * 255);
        b = 0;
      } else if (ndvi < 0.6) {
        r = Math.floor((0.6 - ndvi) * 3.33 * 255);
        g = 255;
        b = 0;
      } else {
        r = 0;
        g = 255;
        b = Math.floor((ndvi - 0.6) * 2.5 * 128);
      }
      
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 180; // Semi-transparent
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  };

  // Generate realistic data based on CNN+LSTM analysis or defaults
  const chiSeries = useMemo<TrendPoint[]>(() => {
    const healthFactor = cnnLstmAnalysis ? cnnLstmAnalysis.crop_health / 100 : 0.6;
    const stressFactor = cnnLstmAnalysis ? (100 - cnnLstmAnalysis.water_stress) / 100 : 0.7;
    
    return Array.from({ length: 30 }, (_, i) => ({
      x: i + 1,
      y: healthFactor * stressFactor * (0.55 + Math.sin(i / 5) * 0.08) + (Math.random() - 0.5) * 0.04
    }));
  }, [cnnLstmAnalysis]);

  const latestChi = chiSeries[chiSeries.length - 1]?.y ?? 0.6;
  
  // Enhanced KPIs based on CNN+LSTM analysis
  const kpis = useMemo(() => {
    if (cnnLstmAnalysis) {
      return {
        chi: +(latestChi * 100).toFixed(1),
        cropHealth: cnnLstmAnalysis.crop_health,
        waterStress: cnnLstmAnalysis.water_stress,
        pestRisk: cnnLstmAnalysis.pest_risk,
        yieldPrediction: cnnLstmAnalysis.yield_prediction,
        npk: 'N:40 P:22 K:35 kg/ha',
        ph: 6.4,
        soilTemp: 23.8,
        moisture: Math.max(0, 100 - cnnLstmAnalysis.water_stress),
        humidity: 61,
        modelParams: cnnLstmAnalysis.architecture.total_parameters,
      };
    }
    return {
      chi: +(latestChi * 100).toFixed(1),
      cropHealth: 75,
      waterStress: 30,
      pestRisk: 'medium' as const,
      yieldPrediction: 85,
      npk: 'N:40 P:22 K:35 kg/ha',
      ph: 6.4,
      soilTemp: 23.8,
      moisture: 70,
      humidity: 61,
      modelParams: 1350726,
    };
  }, [cnnLstmAnalysis, latestChi]);

  // Plot management with real data
  const plotNames = agriPlots.length > 0 
    ? agriPlots.map(p => p.plotName)
    : ['Plot A', 'Plot B', 'Plot C', 'North Field', 'South Field'];
    
  const [selectedPlot, setSelectedPlot] = useState<string>(plotNames[0]);
  const [plotMenuOpen, setPlotMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get current plot data
  const currentPlotData = useMemo(() => {
    return agriPlots.find(p => p.plotName === selectedPlot) || null;
  }, [selectedPlot, agriPlots]);

  // Refresh CNN+LSTM analysis for selected plot
  const refreshAnalysis = async () => {
    const plotData = currentPlotData;
    if (!plotData || !plotData.polygonPath.length) return;

    setIsAnalyzing(true);
    
    try {
      // Calculate center of polygon
      const center = plotData.polygonPath.reduce(
        (acc, point) => ({
          lat: acc.lat + point.lat,
          lng: acc.lng + point.lng
        }), 
        { lat: 0, lng: 0 }
      );
      
      center.lat /= plotData.polygonPath.length;
      center.lng /= plotData.polygonPath.length;

      const response = await fetch(`${CNN_LSTM_API}/analyze/field`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: center.lat,
          longitude: center.lng,
          temperature: plotData.temperature || 25,
          rainfall: plotData.rainfall || 500,
        }),
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const result = await response.json();
      const newAnalysis = result.analysis;
      
      // Update analysis state
      setCnnLstmAnalysis(newAnalysis);
      
      // Update plot data in localStorage
      const updatedPlots = agriPlots.map(p => 
        p.plotName === selectedPlot 
          ? { ...p, cnnLstmAnalysis: newAnalysis }
          : p
      );
      setAgriPlots(updatedPlots);
      localStorage.setItem('agrilens_plots', JSON.stringify(updatedPlots));
      
    } catch (error) {
      console.error('Analysis refresh failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectPlot = (p: string) => {
    setPlotMenuOpen(false);
    if (p === selectedPlot) return;
    setSelectedPlot(p);
    setIsLoading(true);
    
    // Update analysis for selected plot
    const plotData = agriPlots.find(plot => plot.plotName === p);
    if (plotData?.cnnLstmAnalysis) {
      setCnnLstmAnalysis(plotData.cnnLstmAnalysis);
    }
    
    window.setTimeout(() => setIsLoading(false), 900);
  };

  // Generate smart risks based on CNN+LSTM analysis
  const generateRisksFromAnalysis = () => {
    if (!cnnLstmAnalysis) {
      return [
        {
          title: "Aphid risk spike",
          meta: "Cause: Warm, humid nights with leaf chlorosis pattern",
          solution: "Solution: Scout rows 5–8 and apply biocontrol if confirmed",
          icon: "🐛",
          level: "high" as const
        },
        {
          title: "Soil moisture deficit", 
          meta: "Cause: VWC under 20% in Zone B for 3h",
          solution: "Solution: 20‑min drip cycle this evening; monitor overnight",
          icon: "💧",
          level: "medium" as const
        }
      ];
    }

    const risks = [];

    // Pest risk from CNN analysis
    if (cnnLstmAnalysis.pest_risk === 'high') {
      risks.push({
        title: "High pest risk detected by CNN",
        meta: `Cause: CNN spatial analysis shows pest indicators (${(cnnLstmAnalysis.pest_confidence * 100).toFixed(1)}% confidence)`,
        solution: "Solution: Schedule immediate field inspection within 24 hours",
        icon: "🐛",
        level: "high" as const
      });
    }

    // Water stress from LSTM analysis
    if (cnnLstmAnalysis.water_stress > 70) {
      risks.push({
        title: "Critical water stress detected",
        meta: `Cause: LSTM temporal analysis shows ${cnnLstmAnalysis.water_stress.toFixed(1)}% water stress`,
        solution: "Solution: Increase irrigation frequency immediately",
        icon: "💧", 
        level: "high" as const
      });
    } else if (cnnLstmAnalysis.water_stress > 40) {
      risks.push({
        title: "Moderate water stress patterns",
        meta: `Cause: LSTM detected ${cnnLstmAnalysis.water_stress.toFixed(1)}% water stress trend`,
        solution: "Solution: Optimize irrigation timing and monitor soil moisture",
        icon: "💧",
        level: "medium" as const
      });
    }

    // Yield prediction risk
    if (cnnLstmAnalysis.yield_prediction < 60) {
      risks.push({
        title: "Below-target yield prediction",
        meta: `Cause: CNN+LSTM fusion predicts ${cnnLstmAnalysis.yield_prediction.toFixed(1)}% of expected yield`,
        solution: "Solution: Implement yield recovery strategies immediately",
        icon: "📉",
        level: "high" as const
      });
    }

    // Health vs stress contradiction
    if (cnnLstmAnalysis.crop_health > 80 && cnnLstmAnalysis.water_stress > 60) {
      risks.push({
        title: "Health-stress contradiction",
        meta: "Cause: Good spatial health but high temporal water stress detected",
        solution: "Solution: Investigate irrigation system efficiency",
        icon: "⚠️",
        level: "medium" as const
      });
    }

    return risks.slice(0, 4); // Limit to 4 risks for UI
  };

  const risks = generateRisksFromAnalysis();

  return (
    <div className="dash-wrap">
      <header className="dash-header">
        <div className="dash-title">
          <span className="logo">🌱</span>
          <div className="t">
            <h1>AgriLens Dashboard</h1>
            <p>{now.toLocaleDateString()} · {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
        <div className="dash-actions">
          <button className="btn ghost">Add Plot</button>
          <button className="btn primary">New Report</button>
          {currentPlotData && (
            <button 
              className="btn secondary" 
              onClick={refreshAnalysis}
              disabled={isAnalyzing}
              style={{ marginLeft: '10px' }}
            >
              {isAnalyzing ? '🔄 Analyzing...' : '🧠 Refresh CNN+LSTM'}
            </button>
          )}
        </div>
      </header>

      <main className="dash-grid" aria-busy={isLoading}>
        {/* ENHANCED MAP SECTION WITH REAL SATELLITE IMAGERY */}
        <section className="card map" aria-label="Real plot satellite imagery">
          <div className="map-head">
            <div className="map-title">
              🛰️ {viewMode === 'satellite' ? 'Satellite View' : 'NDVI Analysis'}: {selectedPlot}
              {currentPlotData && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {currentPlotData.cropType} • {currentPlotData.soilType} soil
                  {cnnLstmAnalysis && (
                    <span style={{ marginLeft: '10px', color: '#4CAF50' }}>
                      🧠 CNN+LSTM: {cnnLstmAnalysis.crop_health.toFixed(1)}% health
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="dropdown" onClick={() => setPlotMenuOpen(v => !v)} role="button" aria-haspopup="listbox" aria-expanded={plotMenuOpen}>
              <span>{selectedPlot}</span>
              <span className="caret">▾</span>
              {plotMenuOpen && (
                <ul className="dropdown-menu" role="listbox">
                  {plotNames.map(p => (
                    <li key={p} role="option" aria-selected={p === selectedPlot} onClick={() => handleSelectPlot(p)}>
                      {p}
                      {agriPlots.find(plot => plot.plotName === p)?.cnnLstmAnalysis && (
                        <span style={{ marginLeft: '8px', fontSize: '11px', color: '#4CAF50' }}>
                          🧠 {agriPlots.find(plot => plot.plotName === p)!.cnnLstmAnalysis!.crop_health.toFixed(0)}%
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          <div className="map-container" style={{ position: 'relative', height: '400px', backgroundColor: '#f5f5f5', borderRadius: '8px', overflow: 'hidden' }}>
            {currentPlotData && currentPlotData.polygonPath.length > 0 ? (
              <>
                {/* Toggle View Button */}
                <button 
                  onClick={() => setViewMode(viewMode === 'satellite' ? 'ndvi' : 'satellite')}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 10,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {viewMode === 'satellite' ? '🌱 Show NDVI' : '🛰️ Show Satellite'}
                </button>

                {/* Satellite/NDVI Image */}
                {viewMode === 'satellite' ? (
                  <img
                    src={getPlotSatelliteImage(currentPlotData.polygonPath, selectedPlot)?.url}
                    alt={`Satellite view of ${selectedPlot}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                    onError={(e) => {
                      console.error('Failed to load satellite image');
                      e.currentTarget.src = heatmapImg; // Fallback to default
                    }}
                    onLoad={() => {
                      console.log('✅ Satellite image loaded successfully');
                    }}
                  />
                ) : (
                  // NDVI Visualization
                  currentPlotData.cnnLstmAnalysis && (
                    <img
                      src={generateNDVICanvas(currentPlotData.cnnLstmAnalysis) || heatmapImg}
                      alt={`NDVI analysis of ${selectedPlot}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                  )
                )}
                
                {/* Analysis Overlay */}
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  maxWidth: '250px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>📍 Plot Analysis</div>
                  <div>Area: {calculatePolygonArea(currentPlotData.polygonPath).toFixed(2)} hectares</div>
                  <div>Crop: {currentPlotData.cropType || 'Unknown'}</div>
                  {currentPlotData.cnnLstmAnalysis && (
                    <>
                      <div style={{ color: '#4CAF50', marginTop: '4px' }}>
                        🧠 Health: {currentPlotData.cnnLstmAnalysis.crop_health.toFixed(1)}%
                      </div>
                      <div style={{ color: '#2196F3' }}>
                        💧 Stress: {currentPlotData.cnnLstmAnalysis.water_stress.toFixed(1)}%
                      </div>
                      <div style={{ 
                        color: currentPlotData.cnnLstmAnalysis.pest_risk === 'high' ? '#FF5722' : 
                              currentPlotData.cnnLstmAnalysis.pest_risk === 'medium' ? '#FF9800' : '#4CAF50' 
                      }}>
                        🐛 Pest: {currentPlotData.cnnLstmAnalysis.pest_risk.toUpperCase()}
                      </div>
                    </>
                  )}
                </div>

                {/* Model Info Overlay */}
                {currentPlotData.cnnLstmAnalysis && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '11px'
                  }}>
                    🧠 CNN+LSTM • {(currentPlotData.cnnLstmAnalysis.architecture.total_parameters / 1000000).toFixed(1)}M params
                  </div>
                )}
              </>
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                flexDirection: 'column',
                color: '#666',
                fontSize: '16px',
                textAlign: 'center'
              }}>
                <div>📍 No Plot Selected</div>
                <div style={{ fontSize: '14px', marginTop: '8px', color: '#999' }}>
                  Select a plot with coordinates to view satellite imagery
                </div>
              </div>
            )}
          </div>
          
          <div className="legend">
            <span>{viewMode === 'satellite' ? 'Natural Color' : 'Low NDVI (Stressed)'}</span>
            <div className="legend-bar" style={{
              background: viewMode === 'satellite' 
                ? 'linear-gradient(to right, #8B4513, #228B22)' 
                : 'linear-gradient(to right, #FF0000, #FFFF00, #00FF00)'
            }} />
            <span>{viewMode === 'satellite' ? 'Healthy Vegetation' : 'High NDVI (Healthy)'}</span>
          </div>
        </section>

        <section className="card chatbot" aria-label="CNN+LSTM Assistant">
          <div className="chatbot-head">
            <h3>🧠 CNN+LSTM Assistant</h3>
            <span className="status online">
              {cnnLstmAnalysis ? `${kpis.modelParams.toLocaleString()} params` : 'Ready'}
            </span>
          </div>
          <div className="chatbot-messages" role="log" aria-live="polite">
            <div className="msg bot">
              <span className="avatar" aria-hidden>🤖</span>
              <div className="bubble">
                {cnnLstmAnalysis ? (
                  <>
                    🧠 <strong>CNN+LSTM Analysis Complete!</strong><br/>
                    • CNN detected {cnnLstmAnalysis.crop_health.toFixed(1)}% spatial health<br/>
                    • LSTM found {cnnLstmAnalysis.water_stress.toFixed(1)}% water stress patterns<br/>
                    • Fusion predicts {cnnLstmAnalysis.yield_prediction.toFixed(1)}% yield<br/>
                    Ask me about crop health, water management, or pest risks!
                  </>
                ) : (
                  "Hi! I'm powered by CNN+LSTM fusion models. Draw plots to get AI analysis of your fields!"
                )}
              </div>
            </div>
          </div>
          <form className="chatbot-input" onSubmit={(e) => e.preventDefault()}>
            <input type="text" placeholder="Ask about CNN analysis..." aria-label="Message input" />
            <button className="btn primary" type="submit">Send</button>
          </form>
        </section>

        <section className="card hero">
          <div className="hero-left">
            <h2>
              CNN+LSTM Field Analysis
              {cnnLstmAnalysis && (
                <div style={{ fontSize: '14px', color: '#666', fontWeight: 'normal', marginTop: '4px' }}>
                  Model: {cnnLstmAnalysis.architecture.cnn_features.split(' ')[0]} spatial + {cnnLstmAnalysis.architecture.lstm_features.split(' ')[0]} temporal
                </div>
              )}
            </h2>
            <p>Real-time AI fusion analysis combining CNN spatial and LSTM temporal intelligence.</p>
            <div className="hero-kpis">
              <div className="metric">
                <span className="label">🌱 Crop Health</span>
                {isLoading ? <span className="value skeleton-text" style={{ width: '60%' }} /> : (
                  <span className={`value ${kpis.cropHealth > 80 ? 'green' : kpis.cropHealth > 60 ? 'orange' : 'red'}`}>
                    {kpis.cropHealth.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="metric">
                <span className="label">💧 Water Stress</span>
                {isLoading ? <span className="value skeleton-text" style={{ width: '60%' }} /> : (
                  <span className={`value ${kpis.waterStress < 30 ? 'green' : kpis.waterStress < 70 ? 'orange' : 'red'}`}>
                    {kpis.waterStress.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="metric">
                <span className="label">🐛 Pest Risk</span>
                {isLoading ? <span className="value skeleton-text" style={{ width: '50%' }} /> : (
                  <span className={`value ${kpis.pestRisk === 'low' ? 'green' : kpis.pestRisk === 'medium' ? 'orange' : 'red'}`}>
                    {kpis.pestRisk.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="metric">
                <span className="label">📈 Yield Pred.</span>
                {isLoading ? <span className="value skeleton-text" style={{ width: '55%' }} /> : (
                  <span className={`value ${kpis.yieldPrediction > 80 ? 'green' : kpis.yieldPrediction > 60 ? 'orange' : 'red'}`}>
                    {kpis.yieldPrediction.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="metric">
                <span className="label">Moisture</span>
                {isLoading ? <span className="value skeleton-text" style={{ width: '55%' }} /> : <span className="value blue">{kpis.moisture.toFixed(0)}%</span>}
              </div>
              <div className="metric">
                <span className="label">Model Params</span>
                {isLoading ? <span className="value skeleton-text" style={{ width: '70%' }} /> : <span className="value purple">{(kpis.modelParams / 1000000).toFixed(1)}M</span>}
              </div>
            </div>
          </div>
          <div className="hero-right chart-paper">
            <div className={`graph-surface ${isLoading ? 'skeleton-rect' : ''}`}>
              {!isLoading && (
              <svg width="100%" height="260" viewBox="0 0 700 260" preserveAspectRatio="none" aria-label="CHI 30-day chart">
                <defs>
                  <linearGradient id="chiStroke" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor={kpis.cropHealth > 70 ? "#22c55e" : "#f59e0b"} />
                    <stop offset="100%" stopColor={kpis.cropHealth > 70 ? "#16a34a" : "#d97706"} />
                  </linearGradient>
                  <linearGradient id="chiFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={kpis.cropHealth > 70 ? "rgba(34,197,94,0.28)" : "rgba(245,158,11,0.28)"} />
                    <stop offset="100%" stopColor={kpis.cropHealth > 70 ? "rgba(34,197,94,0)" : "rgba(245,158,11,0)"} />
                  </linearGradient>
                </defs>
                {/* Axes */}
                <line x1="40" y1="10" x2="40" y2="220" stroke="#94a3b8" strokeWidth="1" />
                <line x1="40" y1="220" x2="680" y2="220" stroke="#94a3b8" strokeWidth="1" />
                {/* Y ticks */}
                {Array.from({ length: 5 }, (_, i) => 0 + i).map(i => {
                  const y = 220 - (i / 4) * 180;
                  const label = (i / 4).toFixed(1);
                  return (
                    <g key={i}>
                      <line x1="40" y1={y} x2="680" y2={y} stroke="#e2e8f0" strokeWidth="1" />
                      <text x="10" y={y + 4} fill="#64748b" fontSize="10">{label}</text>
                    </g>
                  );
                })}
                {/* X ticks every 5 days */}
                {Array.from({ length: 6 }, (_, i) => i * 5).map((d, idx) => {
                  const x = 40 + (d / 30) * 640;
                  return (
                    <g key={idx}>
                      <line x1={x} y1="220" x2={x} y2="224" stroke="#94a3b8" />
                      <text x={x - 6} y="238" fill="#64748b" fontSize="10">{d}</text>
                    </g>
                  );
                })}
                {/* Path and fill */}
                {(() => {
                  const minY = Math.min(...chiSeries.map(p => p.y));
                  const maxY = Math.max(...chiSeries.map(p => p.y));
                  const scaleX = (x: number) => 40 + ((x - 1) / 29) * 640;
                  const scaleY = (y: number) => 220 - ((y - minY) / (maxY - minY || 1)) * 180;
                  const d = chiSeries.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x).toFixed(1)} ${scaleY(p.y).toFixed(1)}`).join(' ');
                  const area = `${d} L 680 220 L 40 220 Z`;
                  return (
                    <g>
                      <path d={area} fill="url(#chiFill)" />
                      <path d={d} fill="none" stroke="url(#chiStroke)" strokeWidth="3" />
                    </g>
                  );
                })()}
              </svg>
              )}
            </div>
            <div className="chart-caption">
              Crop Health Index - {cnnLstmAnalysis ? 'CNN+LSTM Enhanced' : 'Historical Data'}
            </div>
          </div>
        </section>

        <section className="card future">
          <div className="future-head">
            <h3>🧠 CNN+LSTM Risk Analysis</h3>
            <span className={`badge ${kpis.yieldPrediction > 90 ? 'up' : kpis.yieldPrediction > 70 ? 'neutral' : 'down'}`}>
              {kpis.yieldPrediction > 100 ? '+' : ''}{(kpis.yieldPrediction - 85).toFixed(1)}% vs baseline
            </span>
          </div>
          <div className="future-grid">
            {risks.map((risk, index) => (
              <div key={index} className={`fy-card ${risk.level}`}>
                <div className="fy-icon" aria-hidden>{risk.icon}</div>
                <div className="fy-body">
                  <div className="fy-title">{risk.title}</div>
                  <div className="fy-meta">{risk.meta}</div>
                  <div className="fy-solution">{risk.solution}</div>
                </div>
                <span className={`fy-badge ${risk.level}`}>
                  {risk.level === 'high' ? 'High' : risk.level === 'medium' ? 'Medium' : 'Info'}
                </span>
              </div>
            ))}
          </div>
          
          {/* CNN+LSTM Model Status */}
          {cnnLstmAnalysis && (
            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '6px', 
              border: '1px solid #e9ecef'
            }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#495057' }}>
                🧠 Model Architecture Status
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12px' }}>
                <div>
                  <strong>CNN Branch:</strong> {cnnLstmAnalysis.architecture.cnn_features}
                </div>
                <div>
                  <strong>LSTM Branch:</strong> {cnnLstmAnalysis.architecture.lstm_features}
                </div>
                <div>
                  <strong>Fusion:</strong> {cnnLstmAnalysis.architecture.fusion_method}
                </div>
                <div>
                  <strong>Parameters:</strong> {kpis.modelParams.toLocaleString()}
                </div>
              </div>
              <div style={{ marginTop: '10px', fontSize: '11px', color: '#6c757d' }}>
                Last Analysis: {new Date(cnnLstmAnalysis.processing_date).toLocaleString()}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
