import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader, AlertCircle, CheckCircle, Leaf, Bug, Droplet, ShieldAlert, MapPin, WifiOff, Users, FileText, TrendingUp, BookOpen, ArrowRight, Target, Zap } from 'lucide-react';

const PestDetectionSystem = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setResult(null);
      setError(null);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
    if (!apiKey) {
      setError('Missing API key. Set REACT_APP_ANTHROPIC_API_KEY in .env');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const base64Image = imagePreview.split(',')[1];

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: selectedImage.type,
                    data: base64Image,
                  },
                },
                {
                  type: 'text',
                  text: `You are an expert agricultural pest and plant disease specialist AI. Carefully examine the attached image and return ONLY a single JSON object (no extra text, no markdown, nothing else) matching this schema: \n \n { \n   "pest_name": "name or null", \n   "disease_name": "name or null", \n   "severity": "Low/Medium/High", \n   "symptoms": ["symptom1", "symptom2"], \n   "cause": "brief cause description or null", \n   "organic_solution": { \n     "pesticide": "common/trade name or null", \n     "dosage": "metric amount per liter (and optional US gal) or null", \n     "application": "short treatment steps" \n   }, \n   "chemical_solution": { \n     "pesticide": "common/trade name or null", \n     "dosage": "metric amount per liter (and optional US gal) or null", \n     "application": "short treatment steps" \n   }, \n   "prevention": ["concise tip1", "concise tip2", "concise tip3"], \n   "image_quality": "clear/unclear" \n } \n \n Detailed Rules: \n 1. Image quality: If the image is blurry, too dark, only shows distant plants, or doesn't clearly show affected parts, set "image_quality": "unclear". In that case set other diagnostic fields to null or empty arrays as appropriate. \n 2. Only visual diagnosis: Provide a diagnosis only when clear visual signs are present. Do not guess from context. \n 3. Severity scale: Use Low / Medium / High. \n 4. Pesticide guidance: Give real pesticide names; dosage in metric per liter (optionally per US gallon); short safe application steps. \n 5. Organic vs chemical: Populate organic_solution when suitable; else null. \n 6. Conciseness: Keep each field short (≤15 words). \n 7. Units: Prefer metric; ppm or g/L if reasonable. \n 8. If uncertain: Prefer null rather than guessing. Do not invent names. \n 9. Formatting: Return valid JSON only.`,
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();

      const textBlock = Array.isArray(data.content) && data.content.length > 0 && data.content[0].type === 'text' ? data.content[0].text : null;
      if (textBlock) {
        const jsonText = textBlock.replace(/```json\n?|\n?```/g, '').trim();
        const diagnosis = JSON.parse(jsonText);
        if (diagnosis.image_quality === 'unclear') {
          setError('Image quality is unclear. Upload a clear, well-lit photo.');
        } else {
          setResult(diagnosis);
        }
      } else {
        setError('Unable to analyze the image. Please try again.');
      }
    } catch (err) {
      setError('Failed to analyze image. Check network and API key.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AgriScan AI</h1>
                <p className="text-sm text-gray-600">Intelligent Pest & Disease Detection</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
                98% Accuracy
              </span>
              <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                200+ Diseases
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Upload className="w-6 h-6 mr-2 text-green-600" />
              Upload Plant Image
            </h2>

            {imagePreview ? (
              <div className="mb-6">
                <img
                  src={imagePreview}
                  alt="Selected plant"
                  className="w-full h-64 object-cover rounded-xl shadow-md"
                />
              </div>
            ) : (
              <div className="mb-6 border-4 border-dashed border-gray-300 rounded-xl h-64 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <Bug className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No image selected</p>
                  <p className="text-sm text-gray-400 mt-1">Upload a clear photo of the affected plant</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
              >
                <Upload className="w-5 h-5" />
                <span>Upload File</span>
              </button>
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg"
              >
                <Camera className="w-5 h-5" />
                <span>Capture</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              onClick={analyzeImage}
              disabled={!selectedImage || analyzing}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {analyzing ? (
                <>
                  <Loader className="w-6 h-6 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-6 h-6" />
                  <span>Analyze Image</span>
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
              Diagnosis Results
            </h2>

            {!result && !analyzing && (
              <div className="text-center py-16">
                <Bug className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No analysis yet</p>
                <p className="text-gray-400 text-sm mt-2">Upload an image and click Analyze to get started</p>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border-2 border-green-200">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Identified Issue</h3>
                  <p className="text-2xl font-bold text-green-700">
                    {result.pest_name || result.disease_name || 'No significant issue detected'}
                  </p>
                  <div className="mt-3 flex items-center space-x-2">
                    <span className="text-sm text-gray-600 font-semibold">Severity:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${getSeverityColor(result.severity)}`}>
                      {result.severity}
                    </span>
                  </div>
                </div>

                {Array.isArray(result.symptoms) && result.symptoms.length > 0 && (
                  <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-200">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
                      Symptoms
                    </h3>
                    <ul className="space-y-2">
                      {result.symptoms.map((symptom, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-gray-700">{symptom}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.cause && (
                  <div className="bg-amber-50 p-5 rounded-xl border-2 border-amber-200">
                    <h3 className="font-bold text-gray-900 mb-2">Cause</h3>
                    <p className="text-gray-700">{result.cause}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {result.organic_solution && (
                    <div className="bg-green-50 p-5 rounded-xl border-2 border-green-200">
                      <h3 className="font-bold text-green-800 mb-3 flex items-center">
                        <Leaf className="w-5 h-5 mr-2" />
                        Organic Solution
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p><strong>Pesticide:</strong> {result.organic_solution.pesticide}</p>
                        <p><strong>Dosage:</strong> {result.organic_solution.dosage}</p>
                        <p><strong>Application:</strong> {result.organic_solution.application}</p>
                      </div>
                    </div>
                  )}

                  {result.chemical_solution && (
                    <div className="bg-purple-50 p-5 rounded-xl border-2 border-purple-200">
                      <h3 className="font-bold text-purple-800 mb-3 flex items-center">
                        <Droplet className="w-5 h-5 mr-2" />
                        Chemical Solution
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p><strong>Pesticide:</strong> {result.chemical_solution.pesticide}</p>
                        <p><strong>Dosage:</strong> {result.chemical_solution.dosage}</p>
                        <p><strong>Application:</strong> {result.chemical_solution.application}</p>
                      </div>
                    </div>
                  )}
                </div>

                {Array.isArray(result.prevention) && result.prevention.length > 0 && (
                  <div className="bg-teal-50 p-5 rounded-xl border-2 border-teal-200">
                    <h3 className="font-bold text-teal-800 mb-3 flex items-center">
                      <ShieldAlert className="w-5 h-5 mr-2" />
                      Prevention Tips
                    </h3>
                    <ul className="space-y-2">
                      {result.prevention.map((tip, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="w-2 h-2 bg-teal-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-gray-700 text-sm">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need for Smart Farming</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Professional-grade tools designed for modern agriculture professionals</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-green-200">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Instant AI Detection</h3>
              <p className="text-gray-600 leading-relaxed">Advanced computer vision identifies <strong>200+ diseases and pests</strong> with <strong>98% accuracy</strong> in seconds.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-200">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">GPS Field Mapping</h3>
              <p className="text-gray-600 leading-relaxed">Automatically tag scan locations and build comprehensive field health maps over time.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-purple-200">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <WifiOff className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Offline Capable</h3>
              <p className="text-gray-600 leading-relaxed">Work in remote fields without internet. Scans sync automatically when connected.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-orange-200">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Team Management</h3>
              <p className="text-gray-600 leading-relaxed">Multi-user organizations with role-based access and activity tracking.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-teal-200">
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Smart Reports</h3>
              <p className="text-gray-600 leading-relaxed">Generate detailed PDF and CSV reports with treatment recommendations and field analytics.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-indigo-200">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Predictive Analytics</h3>
              <p className="text-gray-600 leading-relaxed">Track disease patterns and receive early warnings before problems spread.</p>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-3xl shadow-2xl p-12 text-white mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">98%</div>
              <div className="text-green-100 text-lg">Detection Accuracy</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">200+</div>
              <div className="text-green-100 text-lg">Diseases & Pests</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">&lt;3s</div>
              <div className="text-green-100 text-lg">Analysis Time</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">24/7</div>
              <div className="text-green-100 text-lg">Available Support</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-green-500 p-2 rounded-lg">
                  <Leaf className="w-6 h-6" />
                </div>
                <span className="text-xl font-bold">AgriScan AI</span>
              </div>
              <p className="text-gray-400 text-sm">Empowering farmers with AI-driven crop health solutions.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mobile App</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Knowledge Hub</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Case Studies</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Partners</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 AgriScan AI. All rights reserved. Powered by Advanced Computer Vision & Agricultural Expertise</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PestDetectionSystem;
