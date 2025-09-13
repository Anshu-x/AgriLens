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

const center = { lat: 20.2961, lng: 85.8245 }; // Bhubaneswar default center

const AddPlotPage: React.FC = () => {
  const [polygonPath, setPolygonPath] = useState<google.maps.LatLngLiteral[]>([]);
  const [formData, setFormData] = useState({
    plotName: "",
    cropType: "",
    soilType: "",
    irrigation: "",
    notes: "",
  });

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
    libraries: ["drawing", "places"],
  });

  const onPolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    const path = polygon
      .getPath()
      .getArray()
      .map((latlng) => ({ lat: latlng.lat(), lng: latlng.lng() }));
    const closedPath = [...path, path[0]];
    setPolygonPath(closedPath);
    polygon.setMap(null); // remove drawn polygon after capturing
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Plot Details:", formData);
    console.log("Polygon Coordinates:", polygonPath);
    alert("Plot details submitted!");
  };

  const handleDownloadGeoJSON = () => {
    if (polygonPath.length === 0) {
      alert("Please draw a polygon first.");
      return;
    }

    // Close the polygon by adding the first coordinate to the end
    const closedPath = [...polygonPath, polygonPath[0]];

    const geoJson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [closedPath.map(coord => [coord.lng, coord.lat])],
          },
        },
      ],
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(geoJson));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "plot.geojson");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="p-6 space-y-6">
      {/* MAP SECTION */}
      <section className="rounded-2xl shadow-lg border border-gray-200 bg-white p-4">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">Draw Your Plot</h2>
        {isLoaded ? (
          <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={14}>
            <DrawingManager
              onPolygonComplete={onPolygonComplete}
              options={{
                drawingControl: true,
                drawingControlOptions: {
                  position: google.maps.ControlPosition.TOP_CENTER,
                  drawingModes: [google.maps.drawing.OverlayType.POLYGON],
                },
                polygonOptions: {
                  fillColor: "#3B82F6",
                  fillOpacity: 0.3,
                  strokeColor: "#1D4ED8",
                  strokeWeight: 2,
                  clickable: false,
                  editable: false,
                  zIndex: 1,
                },
              }}
            />
            {polygonPath.length > 0 && (
              <Polygon
                paths={polygonPath}
                options={{
                  fillColor: "#22C55E",
                  fillOpacity: 0.4,
                  strokeColor: "#16A34A",
                  strokeWeight: 2,
                }}
              />
            )}
          </GoogleMap>
        ) : (
          <div className="skeleton-rect w-full h-[400px] bg-gray-200 rounded-lg animate-pulse" />
        )}
      </section>

      {/* PLOT DETAILS SECTION */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl shadow-xl border border-gray-300 p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Plot Details</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="plotName"
              value={formData.plotName}
              onChange={handleChange}
              placeholder="Plot Name"
              className="w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              required
            />
            <input
              type="text"
              name="cropType"
              value={formData.cropType}
              onChange={handleChange}
              placeholder="Crop Type"
              className="w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-green-400 focus:outline-none"
              required
            />
            <input
              type="text"
              name="soilType"
              value={formData.soilType}
              onChange={handleChange}
              placeholder="Soil Type"
              className="w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
            />
            <input
              type="text"
              name="irrigation"
              value={formData.irrigation}
              onChange={handleChange}
              placeholder="Irrigation Source"
              className="w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-teal-400 focus:outline-none"
            />
          </div>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Additional Notes..."
            rows={3}
            className="w-full rounded-xl border border-gray-300 p-3 focus:ring-2 focus:ring-purple-400 focus:outline-none"
          />

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold py-3 rounded-xl shadow-md hover:opacity-90 transition"
          >
            Save Plot
          </button>

          <button
            type="button"
            onClick={handleDownloadGeoJSON}
            className="w-full bg-gradient-to-r from-gray-500 to-gray-700 text-white font-semibold py-3 rounded-xl shadow-md hover:opacity-90 transition"
          >
            Download GeoJSON
          </button>
        </form>
      </section>
    </div>
  );
};

export default AddPlotPage;
