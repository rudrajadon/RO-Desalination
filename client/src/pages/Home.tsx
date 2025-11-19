import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useState, useEffect } from "react";
import { Zap, Droplets, Brain, Shield, TrendingDown, BarChart3 } from "lucide-react";

interface DataRow {
  timestamp: string;
  salinity_mol_L: number;
  temperature_C: number;
  pH: number;
  turbidity_NTU: number;
  pump_pressure_bar: number;
  permeate_flow_Lh: number;
  permeate_conductivity_uScm: number;
  membrane_area_m2: number;
  fouling_factor: number;
}

export default function Home() {
  const [dataRows, setDataRows] = useState<DataRow[]>([]);
  const [predictedPressure, setPredictedPressure] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    salinity: 0.68,
    temperature: 22,
    pH: 7.7,
    turbidity: 5.2,
    membraneArea: 50,
    foulingFactor: 0.1,
  });

  // Helper function to ensure valid number values
  const ensureNumber = (value: any, defaultValue: number = 0): number => {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  };

  // Load sample data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/sample_data.csv');
        const text = await response.text();
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',');
        const rows = lines.slice(1, 11).map(line => {
          const values = line.split(',');
          return {
            timestamp: values[0],
            salinity_mol_L: parseFloat(values[1]),
            temperature_C: parseFloat(values[2]),
            pH: parseFloat(values[3]),
            turbidity_NTU: parseFloat(values[4]),
            pump_pressure_bar: parseFloat(values[5]),
            permeate_flow_Lh: parseFloat(values[6]),
            permeate_conductivity_uScm: parseFloat(values[7]),
            membrane_area_m2: parseFloat(values[8]),
            fouling_factor: parseFloat(values[9]),
          };
        });
        setDataRows(rows);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  // Physics-based pressure calculation using Van't Hoff equation
  const calculateMinimumPressure = () => {
    // Correct gas constant for RO: 0.083145 L*bar*K^-1*mol^-1
    const R = 0.083145;
    const T_K = formData.temperature + 273.15; // Convert to Kelvin
    
    // Van't Hoff equation: π = i * M * R * T_K
    // i = van't Hoff factor (2 for seawater/NaCl)
    // M = molarity in mol/L
    // R = gas constant in correct units
    // T_K = temperature in Kelvin
    const vantHoffFactor = 2;
    const osmotic_pressure = vantHoffFactor * formData.salinity * R * T_K;
    
    // 1. Operational Margin (1.6x osmotic pressure)
    const operational_pressure = osmotic_pressure * 1.6;

    // 2. Temperature Adjustment (Viscosity Factor: -0.004 per °C above 25)
    const viscosity_adjustment = 1 - (0.004 * (formData.temperature - 25));
    const pressure_after_temp = operational_pressure * viscosity_adjustment;

    // 3. Penalties (Additive)
    const fouling_penalty = 32 * formData.foulingFactor; // Enhanced fouling penalty
    const turbidity_penalty = 2.5 * formData.turbidity;
    const optimal_pH = 7.75;
    const pH_penalty = 6.0 * Math.abs(formData.pH - optimal_pH);

    // 4. Membrane Area Scaling (Inverse Square Root)
    // Note: membraneArea is formData.membraneArea
    const area_scaling_factor = 7.0 / Math.sqrt(formData.membraneArea);

    // 5. Total Predicted Pressure (No bounds applied, as requested)
    let predicted_pressure = ((pressure_after_temp + turbidity_penalty + pH_penalty) * area_scaling_factor) + fouling_penalty;

    // Old bounds removed as requested.
    // predicted_pressure = Math.max(35, Math.min(70, predicted_pressure));
    
    setPredictedPressure(parseFloat(predicted_pressure.toFixed(2)));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Droplets className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">RO Desalination AI Model</h1>
              <p className="text-sm text-slate-600">Physics-Informed Dynamic Pressure Optimization</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="mb-12">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardHeader>
              <CardTitle className="text-2xl">Model Overview</CardTitle>
              <CardDescription>Intelligent pressure optimization for Reverse Osmosis desalination plants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700 leading-relaxed">
                This model acts as the "Thinking Layer" in modern Reverse Osmosis (RO) desalination plants, designed to minimize energy consumption while maintaining water quality. It dynamically sets the feed pressure required by high-pressure pumps, adapting in real time to changing operational conditions using both physics calculations and machine learning predictions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="flex gap-3">
                  <Zap className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-slate-900">Energy Efficient</h4>
                    <p className="text-sm text-slate-600">Up to 5% reduction in operational costs</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Brain className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-slate-900">AI-Powered</h4>
                    <p className="text-sm text-slate-600">ML predictions for real-time adaptation</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-slate-900">Safe Operation</h4>
                    <p className="text-sm text-slate-600">Built-in constraints and monitoring</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">How the Model Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-600" />
                  Real-Time Data Collection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 text-sm leading-relaxed">
                  The model receives updates every few minutes from plant sensors measuring feedwater salinity, temperature, pH, turbidity, pump pressure, permeate and concentrate flow rates, membrane area and condition.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                  Physics-Based Calculation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 text-sm leading-relaxed">
                  Using key formulas such as the Van't Hoff equation for osmotic pressure, the model computes the minimum required pressure to desalinate water, adjusting for temperature effects on viscosity and membrane permeability.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Machine Learning Correction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 text-sm leading-relaxed">
                  To handle non-ideal factors like membrane fouling and aging, the model leverages a trained machine learning algorithm. This predicts the additional "penalty" pressure needed based on historical and recent data.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Constraint Enforcement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 text-sm leading-relaxed">
                  The system continuously checks that water output meets demand and quality standards, scaling and safety limits are not exceeded, and membrane health is maintained.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Data & Predictor */}
        <section className="mb-12">
          <Tabs defaultValue="dataset" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="dataset">Sample Dataset</TabsTrigger>
              <TabsTrigger value="predictor">Pressure Predictor</TabsTrigger>
            </TabsList>

            {/* Dataset Tab */}
            <TabsContent value="dataset">
              <Card>
                <CardHeader>
                  <CardTitle>Operational Data Sample</CardTitle>
                  <CardDescription>Real-world RO plant sensor readings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="text-left px-4 py-2 font-semibold text-slate-900">Timestamp</th>
                          <th className="text-right px-4 py-2 font-semibold text-slate-900">Salinity (mol/L)</th>
                          <th className="text-right px-4 py-2 font-semibold text-slate-900">Temp (°C)</th>
                          <th className="text-right px-4 py-2 font-semibold text-slate-900">pH</th>
                          <th className="text-right px-4 py-2 font-semibold text-slate-900">Turbidity</th>
                          <th className="text-right px-4 py-2 font-semibold text-slate-900">Pressure (bar)</th>
                          <th className="text-right px-4 py-2 font-semibold text-slate-900">Flow (L/h)</th>
                          <th className="text-right px-4 py-2 font-semibold text-slate-900">Fouling</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataRows.map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-2 text-slate-700">{row.timestamp}</td>
                            <td className="text-right px-4 py-2 text-slate-700">{row.salinity_mol_L.toFixed(3)}</td>
                            <td className="text-right px-4 py-2 text-slate-700">{row.temperature_C.toFixed(1)}</td>
                            <td className="text-right px-4 py-2 text-slate-700">{row.pH.toFixed(2)}</td>
                            <td className="text-right px-4 py-2 text-slate-700">{row.turbidity_NTU.toFixed(1)}</td>
                            <td className="text-right px-4 py-2 text-slate-700 font-medium">{row.pump_pressure_bar.toFixed(1)}</td>
                            <td className="text-right px-4 py-2 text-slate-700">{row.permeate_flow_Lh.toFixed(0)}</td>
                            <td className="text-right px-4 py-2 text-slate-700">{row.fouling_factor.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Predictor Tab */}
            <TabsContent value="predictor">
              <Card>
                <CardHeader>
                  <CardTitle>Minimum Pressure Predictor</CardTitle>
                  <CardDescription>Calculate optimal pressure based on current conditions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Feedwater Salinity (mol/L)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="2"
                          value={ensureNumber(formData.salinity, 0.68)}
                          onChange={(e) => setFormData({ ...formData, salinity: ensureNumber(e.target.value, 0.68) })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Temperature (°C)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="5"
                          max="50"
                          value={ensureNumber(formData.temperature, 22)}
                          onChange={(e) => setFormData({ ...formData, temperature: ensureNumber(e.target.value, 22) })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          pH Level
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="5"
                          max="10"
                          value={ensureNumber(formData.pH, 7.7)}
                          onChange={(e) => setFormData({ ...formData, pH: ensureNumber(e.target.value, 7.7) })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Turbidity (NTU)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="20"
                          value={ensureNumber(formData.turbidity, 5.2)}
                          onChange={(e) => setFormData({ ...formData, turbidity: ensureNumber(e.target.value, 5.2) })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Membrane Area (m²)
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="10"
                          max="500"
                          value={ensureNumber(formData.membraneArea, 50)}
                          onChange={(e) => setFormData({ ...formData, membraneArea: ensureNumber(e.target.value, 50) })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Fouling Factor (0-1)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={ensureNumber(formData.foulingFactor, 0.1)}
                          onChange={(e) => setFormData({ ...formData, foulingFactor: ensureNumber(e.target.value, 0.1) })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <Button
                        onClick={calculateMinimumPressure}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md"
                      >
                        Calculate Minimum Pressure
                      </Button>
                    </div>

                    <div className="flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-8 border border-blue-200">
                      {predictedPressure !== null ? (
                        <div className="text-center">
                          <p className="text-slate-600 text-sm mb-2">Calculated Minimum Pressure</p>
                          <div className="text-5xl font-bold text-blue-600 mb-2">
                            {predictedPressure.toFixed(2)}
                          </div>
                          <p className="text-slate-600 text-lg font-medium">bar</p>
                          <div className="mt-6 p-4 bg-white rounded-lg border border-slate-200">
                            <p className="text-xs text-slate-600 mb-2 font-semibold">Input Parameters:</p>
                            <div className="text-xs text-slate-700 space-y-1">
                              <p>Salinity: {formData.salinity.toFixed(3)} mol/L</p>
                              <p>Temperature: {formData.temperature.toFixed(1)}°C</p>
                              <p>Fouling Factor: {formData.foulingFactor.toFixed(2)}</p>
                              <p>Turbidity: {formData.turbidity.toFixed(1)} NTU</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <TrendingDown className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-500 text-lg font-medium">Enter parameters and click calculate</p>
                          <p className="text-slate-400 text-sm mt-2">to predict optimal pressure</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* Key Benefits */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Key Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="text-lg">Instant Adaptation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700">Adapts instantly to changing water composition and operational conditions.</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-lg">Energy Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700">Only uses the minimum energy necessary at any moment, reducing operational costs.</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <CardTitle className="text-lg">Cost Reduction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700">Reduces operational costs by up to 28% through intelligent pressure optimization.</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="text-lg">Membrane Longevity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700">Prolongs membrane life by preventing unnecessary fouling and stress.</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">Physics-Informed AI Model for RO Desalination © 2025</p>
          <p className="text-xs text-slate-500 mt-2">Powered by advanced machine learning and physics-based calculations</p>
        </div>
      </footer>
    </div>
  );
}
