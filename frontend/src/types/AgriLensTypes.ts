export interface CNNLSTMAnalysis {
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

export interface AgriLensPlot {
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
