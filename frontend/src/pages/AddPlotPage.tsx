import React, { useState, useCallback } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  DrawingManager,
  Polygon,
} from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const center = { lat: 20.2961, lng: 85.8245 }; // Bhubaneswar

// CNN+LSTM API Configuration
const CNN_LSTM_API = "https://agrilens-real-cnn-lstm-361194337063.us-central1.run.app";

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
}

interface PlotFormData {
  plotName: string;
  cropType: string;
  soilType: string;
  irrigation: string;
  notes: string;
  temperature?: number;
  rainfall?: number;
}

const AddPlotPage: React.FC = () => {
  const [polygonPath, setPolygonPath] = useState<google.maps.LatLngLiteral[]>([]);
  const [cnnLstmAnalysis, setCnnLstmAnalysis] = useState<CNNLSTMAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<PlotFormData>({
    plotName: "",
    cropType: "",
    soilType: "",
    irrigation: "",
    notes: "",
    temperature: 25,
    rainfall: 500,
  });

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
    libraries: ["drawing", "places"],
  });

  // Calculate polygon center for CNN+LSTM analysis
  const getPolygonCenter = (path: google.maps.LatLngLiteral[]) => {
    if (path.length === 0) return { lat: 0, lng: 0 };
    
    const lat = path.reduce((sum, point) => sum + point.lat, 0) / path.length;
    const lng = path.reduce((sum, point) => sum + point.lng, 0) / path.length;
    
    return { lat, lng };
  };

  // Call CNN+LSTM API for plot analysis
  const analyzePlotWithCNNLSTM = async (plotPath: google.maps.LatLngLiteral[]) => {
    if (plotPath.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const center = getPolygonCenter(plotPath);
      
      const response = await fetch(`${CNN_LSTM_API}/analyze/field`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: center.lat,
          longitude: center.lng,
          temperature: formData.temperature || 25,
          rainfall: formData.rainfall || 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      setCnnLstmAnalysis(result.analysis);
      
      console.log("🧠 CNN+LSTM Analysis Result:", result);
      
    } catch (error) {
      console.error("CNN+LSTM Analysis Error:", error);
      setAnalysisError(error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onPolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    const path = polygon
      .getPath()
      .getArray()
      .map((latlng) => ({ lat: latlng.lat(), lng: latlng.lng() }));
    
    setPolygonPath(path);
    polygon.setMap(null);
    
    // Automatically trigger CNN+LSTM analysis when polygon is drawn
    analyzePlotWithCNNLSTM(path);
  }, [formData.temperature, formData.rainfall]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ 
      ...formData, 
      [name]: name === 'temperature' || name === 'rainfall' ? Number(value) : value 
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const plotData = {
      ...formData,
      polygonPath,
      cnnLstmAnalysis,
      createdAt: new Date().toISOString(),
    };
    
    console.log("Complete Plot Data:", plotData);
    
    // Save to localStorage or send to your backend
    const existingPlots = JSON.parse(localStorage.getItem('agrilens_plots') || '[]');
    existingPlots.push(plotData);
    localStorage.setItem('agrilens_plots', JSON.stringify(existingPlots));
    
    alert("Plot saved with CNN+LSTM analysis!");
  };

  const handleDownloadGeoJSON = () => {
    if (polygonPath.length === 0) {
      alert("Please draw a polygon first.");
      return;
    }

    const geoJson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature", 
          properties: {
            plotName: formData.plotName,
            cropType: formData.cropType,
            cnnLstmAnalysis: cnnLstmAnalysis,
            analysisDate: new Date().toISOString(),
          },
          geometry: {
            type: "Polygon",
            coordinates: [polygonPath.map(coord => [coord.lng, coord.lat])],
          },
        },
      ],
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(geoJson, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${formData.plotName || 'plot'}.geojson`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Get health status color for visualization
  const getHealthColor = (health: number) => {
    if (health > 80) return "#4CAF50"; // Green
    if (health > 60) return "#FF9800"; // Orange
    return "#F44336"; // Red
  };

  return (
    <div className="add-plot-container" style={{ padding: '20px' }}>
      {/* MAP SECTION */}
      <div className="map-section">
        <h2>🗺️ Draw Your Agricultural Plot</h2>
        
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={13}
            mapTypeId="satellite" // Show satellite imagery for agriculture
          >
            <DrawingManager
              onPolygonComplete={onPolygonComplete}
              options={{
                drawingControl: true,
                drawingControlOptions: {
                  position: window.google?.maps.ControlPosition.TOP_CENTER,
                  drawingModes: [window.google?.maps.drawing.OverlayType.POLYGON],
                },
                polygonOptions: {
                  fillColor: cnnLstmAnalysis ? getHealthColor(cnnLstmAnalysis.crop_health) : "#FF0000",
                  fillOpacity: 0.3,
                  strokeWeight: 2,
                  clickable: false,
                  editable: true,
                  zIndex: 1,
                },
              }}
            />
            
            {polygonPath.length > 0 && (
              <Polygon
                paths={polygonPath}
                options={{
                  fillColor: cnnLstmAnalysis ? getHealthColor(cnnLstmAnalysis.crop_health) : "#FF0000",
                  fillOpacity: 0.3,
                  strokeColor: "#FF0000",
                  strokeOpacity: 1,
                  strokeWeight: 2,
                }}
              />
            )}
          </GoogleMap>
        ) : (
          <div>Loading Google Maps...</div>
        )}
        
        {/* CNN+LSTM Analysis Status */}
        {isAnalyzing && (
          <div style={{ 
            marginTop: '10px', 
            padding: '10px', 
            backgroundColor: '#E3F2FD', 
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            🧠 Analyzing plot with CNN+LSTM model... Please wait.
          </div>
        )}
        
        {analysisError && (
          <div style={{ 
            marginTop: '10px', 
            padding: '10px', 
            backgroundColor: '#FFEBEE', 
            borderRadius: '4px',
            color: '#C62828'
          }}>
            ❌ Analysis Error: {analysisError}
          </div>
        )}
      </div>

      {/* CNN+LSTM ANALYSIS RESULTS */}
      {cnnLstmAnalysis && (
        <div className="analysis-results" style={{ 
          marginTop: '20px', 
          padding: '20px', 
          backgroundColor: '#F5F5F5', 
          borderRadius: '8px',
          border: '2px solid #4CAF50'
        }}>
          <h3>🧠 CNN+LSTM Analysis Results</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '6px', textAlign: 'center' }}>
              <h4 style={{ color: '#4CAF50', margin: '0 0 10px 0' }}>🌱 Crop Health</h4>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: getHealthColor(cnnLstmAnalysis.crop_health) }}>
                {cnnLstmAnalysis.crop_health.toFixed(1)}%
              </div>
              <small>CNN Spatial Analysis</small>
            </div>
            
            <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '6px', textAlign: 'center' }}>
              <h4 style={{ color: '#2196F3', margin: '0 0 10px 0' }}>💧 Water Stress</h4>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: cnnLstmAnalysis.water_stress > 70 ? '#F44336' : '#4CAF50' }}>
                {cnnLstmAnalysis.water_stress.toFixed(1)}%
              </div>
              <small>LSTM Temporal Analysis</small>
            </div>
            
            <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '6px', textAlign: 'center' }}>
              <h4 style={{ color: '#FF9800', margin: '0 0 10px 0' }}>🐛 Pest Risk</h4>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: cnnLstmAnalysis.pest_risk === 'high' ? '#F44336' : cnnLstmAnalysis.pest_risk === 'medium' ? '#FF9800' : '#4CAF50',
                textTransform: 'uppercase'
              }}>
                {cnnLstmAnalysis.pest_risk}
              </div>
              <small>Confidence: {(cnnLstmAnalysis.pest_confidence * 100).toFixed(1)}%</small>
            </div>
            
            <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '6px', textAlign: 'center' }}>
              <h4 style={{ color: '#9C27B0', margin: '0 0 10px 0' }}>📈 Yield Prediction</h4>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: cnnLstmAnalysis.yield_prediction > 70 ? '#4CAF50' : '#F44336' }}>
                {cnnLstmAnalysis.yield_prediction.toFixed(1)}%
              </div>
              <small>CNN+LSTM Fusion</small>
            </div>
          </div>
          
          {/* Model Architecture Details */}
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '6px' }}>
            <h4>🏗️ Model Architecture</h4>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li><strong>CNN Features:</strong> {cnnLstmAnalysis.architecture.cnn_features}</li>
              <li><strong>LSTM Features:</strong> {cnnLstmAnalysis.architecture.lstm_features}</li>
              <li><strong>Fusion Method:</strong> {cnnLstmAnalysis.architecture.fusion_method}</li>
              <li><strong>Total Parameters:</strong> {cnnLstmAnalysis.architecture.total_parameters.toLocaleString()}</li>
            </ul>
          </div>
          
          {/* AI Recommendations */}
          {cnnLstmAnalysis.recommendations && cnnLstmAnalysis.recommendations.length > 0 && (
            <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '6px' }}>
              <h4>💡 AI Recommendations</h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {cnnLstmAnalysis.recommendations.map((rec, index) => (
                  <li key={index} style={{ marginBottom: '5px' }}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ENHANCED PLOT DETAILS FORM */}
      <div className="form-section" style={{ marginTop: '20px' }}>
        <h2>📋 Plot Details</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label>Plot Name:</label>
              <input
                type="text"
                name="plotName"
                value={formData.plotName}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            
            <div>
              <label>Crop Type:</label>
              <select
                name="cropType"
                value={formData.cropType}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">Select Crop</option>
                <option value="rice">Rice</option>
                <option value="wheat">Wheat</option>
                <option value="corn">Corn</option>
                <option value="sugarcane">Sugarcane</option>
                <option value="cotton">Cotton</option>
                <option value="soybeans">Soybeans</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label>Soil Type:</label>
              <select
                name="soilType"
                value={formData.soilType}
                onChange={handleChange}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">Select Soil Type</option>
                <option value="clay">Clay</option>
                <option value="sandy">Sandy</option>
                <option value="loamy">Loamy</option>
                <option value="silt">Silt</option>
              </select>
            </div>
            
            <div>
              <label>Irrigation:</label>
              <select
                name="irrigation"
                value={formData.irrigation}
                onChange={handleChange}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">Select Irrigation</option>
                <option value="drip">Drip Irrigation</option>
                <option value="sprinkler">Sprinkler</option>
                <option value="flood">Flood Irrigation</option>
                <option value="rainfed">Rain-fed</option>
              </select>
            </div>
          </div>

          {/* Environmental Parameters for CNN+LSTM */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label>Temperature (°C):</label>
              <input
                type="number"
                name="temperature"
                value={formData.temperature}
                onChange={handleChange}
                min="0"
                max="50"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <small style={{ color: '#666' }}>Used for CNN+LSTM analysis</small>
            </div>
            
            <div>
              <label>Annual Rainfall (mm):</label>
              <input
                type="number"
                name="rainfall"
                value={formData.rainfall}
                onChange={handleChange}
                min="0"
                max="3000"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <small style={{ color: '#666' }}>Used for CNN+LSTM analysis</small>
            </div>
          </div>

          <div>
            <label>Notes:</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              placeholder="Additional notes about this plot..."
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              type="submit"
              disabled={polygonPath.length === 0}
              style={{
                padding: '12px 24px',
                backgroundColor: polygonPath.length === 0 ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: polygonPath.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
              }}
            >
              💾 Save Plot with CNN+LSTM Analysis
            </button>
            
            <button
              type="button"
              onClick={handleDownloadGeoJSON}
              disabled={polygonPath.length === 0}
              style={{
                padding: '12px 24px',
                backgroundColor: polygonPath.length === 0 ? '#ccc' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: polygonPath.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
              }}
            >
              📥 Download GeoJSON
            </button>
            
            {polygonPath.length > 0 && (
              <button
                type="button"
                onClick={() => analyzePlotWithCNNLSTM(polygonPath)}
                disabled={isAnalyzing}
                style={{
                  padding: '12px 24px',
                  backgroundColor: isAnalyzing ? '#ccc' : '#FF9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {isAnalyzing ? '🔄 Analyzing...' : '🧠 Re-analyze with CNN+LSTM'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPlotPage;
