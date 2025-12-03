import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Loader, AlertCircle, CheckCircle, Leaf, Bug, Droplet, ShieldAlert, MapPin, WifiOff, Users, FileText, TrendingUp, Zap } from 'lucide-react';
import logo from './assets/logo.png';
import Picture1 from './assets/Picture1.png';
import Picture2 from './assets/Picture2.png';
import Picture3 from './assets/Picture3.png';

const PestDetectionSystemGemini = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    const link = document.querySelector("link[rel='icon']");
    if (link) link.href = logo;
    const apple = document.querySelector("link[rel='apple-touch-icon']");
    if (apple) apple.href = logo;
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
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

    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (!apiKey) {
      setError('Missing API key. Set REACT_APP_GEMINI_API_KEY in .env');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const base64Image = imagePreview.split(',')[1];
      const endpoints = [
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-latest:generateContent?key=${apiKey}`,
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`,
      ];
      const prompt = `You are an expert agricultural pest and plant disease specialist AI. Carefully examine the attached image and return ONLY a single JSON object (no extra text, no markdown, nothing else) matching this schema: \n \n { \n   "pest_name": "name or null", \n   "disease_name": "name or null", \n   "severity": "Low/Medium/High", \n   "symptoms": ["symptom1", "symptom2"], \n   "cause": "brief cause description or null", \n   "organic_solution": { \n     "pesticide": "common/trade name or null", \n     "dosage": "metric amount per liter (and optional US gal) or null", \n     "application": "short treatment steps" \n   }, \n   "chemical_solution": { \n     "pesticide": "common/trade name or null", \n     "dosage": "metric amount per liter (and optional US gal) or null", \n     "application": "short treatment steps" \n   }, \n   "prevention": ["concise tip1", "concise tip2", "concise tip3"], \n   "image_quality": "clear/unclear" \n } \n \n Rules: 1) If image unclear set image_quality to "unclear" and other fields null/empty; 2) Only diagnose with clear visual signs; 3) Keep fields concise; 4) Use real pesticide names and metric dosages; 5) Return valid JSON only.`;

      let data = null;
      let lastErr = null;
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    { text: prompt },
                    {
                      inline_data: {
                        mime_type: selectedImage.type,
                        data: base64Image,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                response_mime_type: 'application/json',
              },
            }),
          });
          data = await response.json();
          if (data && !data.error) break;
          lastErr = data.error?.message || 'Unknown error';
          if (!(lastErr.includes('not found') || lastErr.includes('not supported'))) break;
        } catch (e) {
          lastErr = e?.message || String(e);
        }
      }
      if (!data || data.error) {
        setError(`Gemini error: ${lastErr || 'request failed'}`);
        return;
      }

      const candidate = Array.isArray(data.candidates) && data.candidates[0];
      let textBlock = null;
      if (candidate && candidate.content && Array.isArray(candidate.content.parts)) {
        for (const part of candidate.content.parts) {
          if (typeof part.text === 'string') {
            textBlock = part.text;
            break;
          }
        }
      }

      if (textBlock) {
        const jsonText = textBlock.replace(/```json\n?|\n?```/g, '').trim();
        const diagnosis = JSON.parse(jsonText);
        if (diagnosis.image_quality === 'unclear') {
          setError('Image quality is unclear. Upload a clear, well-lit photo.');
        } else {
          setResult(diagnosis);
        }
      } else {
        setError('Unable to analyze the image. Check key, billing, or image size.');
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
              <img src={logo} alt="AgriScan AI" className="w-10 h-10 rounded-xl shadow-lg" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AgriScan AI</h1>
                <p className="text-sm text-gray-600">Intelligent Pest & Disease Detection</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">98% Accuracy</span>
              <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">200+ Diseases</span>
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
              <div className="mb-6 h-64 bg-white rounded-xl shadow-md overflow-hidden flex items-center justify-center">
                <img src={imagePreview} alt="Selected plant" className="w-full h-full object-contain" />
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
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg">
                <Upload className="w-5 h-5" />
                <span>Upload File</span>
              </button>
              <button onClick={() => cameraInputRef.current?.click()} className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg">
                <Camera className="w-5 h-5" />
                <span>Capture</span>
              </button>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />

            <button onClick={analyzeImage} disabled={!selectedImage || analyzing} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
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
                  <p className="text-2xl font-bold text-green-700">{result.pest_name || result.disease_name || 'No significant issue detected'}</p>
                  <div className="mt-3 flex items-center space-x-2">
                    <span className="text-sm text-gray-600 font-semibold">Severity:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${getSeverityColor(result.severity)}`}>{result.severity}</span>
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
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900">AI Pest & Disease Detection</h2>
            <p className="text-gray-600 max-w-3xl mx-auto mt-4">Fermata is a data science company developing computer vision solutions for both controlled environment agriculture and outdoor.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-2">
                <Bug className="w-6 h-6 text-emerald-600" />
                <h3 className="text-xl font-bold text-gray-900">Pests</h3>
              </div>
              <p className="text-gray-700 font-semibold">Automatically Detect Pests</p>
              <p className="text-gray-600 mt-2">Our AgriScan AI platform watches your crop 24/7, detecting a wide range of pesky critters.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-2">
                <ShieldAlert className="w-6 h-6 text-red-600" />
                <h3 className="text-xl font-bold text-gray-900">Disease</h3>
              </div>
              <p className="text-gray-700 font-semibold">Automatically Detect Disease</p>
              <p className="text-gray-600 mt-2">From powdery mildew to bud rot, mosaic and more, AgriScan AI finds them all... automatically!</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-2">
                <Zap className="w-6 h-6 text-yellow-600" />
                <h3 className="text-xl font-bold text-gray-900">Time</h3>
              </div>
              <p className="text-gray-700 font-semibold">Reduce Scouting Time</p>
              <p className="text-gray-600 mt-2">Why waste your time finding problems when you can instead be solving them?</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-2">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-bold text-gray-900">Crop loss</h3>
              </div>
              <p className="text-gray-700 font-semibold">Reduce Crop Loss</p>
              <p className="text-gray-600 mt-2">Don't let a good plant go to waste! Increase your yield with AgriScan AI automated scouting.</p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="bg-green-50 border border-green-200 rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-green-800">Sustainability is Key at Fermata</h2>
            <p className="text-gray-700 mt-4 leading-relaxed">Our solutions use image data captured from cameras to automate scouting, providing the earliest pest & disease detection and identification, track pests & pathogens over time so you can evaluate your mitigation efforts, and monitor plant growth. Our AgriScan AI platform reduces crop losses and significantly decreases the need for pesticide and chemical usage. So, not only are you saving on crop losses and remediation for the crop you ultimately harvest, but you are also saving all the energy, labour, and crop inputs associated with crops you would have otherwise lost — great for the grower's bottom line, and the planet!</p>
          </div>
        </section>
      
        <section className="mb-16">
          <div className="space-y-14">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="md:order-1">
                <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden bg-white shadow">
                  <img src={Picture1} alt="AgriScan AI Has Your Back" className="w-full h-full object-contain" />
                </div>
              </div>
              <div className="md:order-2">
                <h3 className="text-3xl font-bold text-gray-900">AgriScan AI Has Your Back</h3>
                <p className="text-gray-600 mt-4 leading-relaxed">Wasting precious time on scouting? AgriScan AI stands watch over your crop, so you don't have to. Using advanced machine learning, our computer vision system finds pests and disease well in advance of human scouts — saving growers both time and money.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="md:order-2">
                <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden bg-white shadow">
                  <img src={Picture2} alt="See a 360° View of Your Crop" className="w-full h-full object-contain" />
                </div>
              </div>
              <div className="md:order-1">
                <h3 className="text-3xl font-bold text-gray-900">See a 360° View of Your Crop</h3>
                <p className="text-gray-600 mt-4 leading-relaxed">While AgriScan AI does indeed include 2D mapping of pest and disease incidents within your facility, it's often far easier to just take a look at the canopy yourself. AgriScan AI makes grower's lives easier by overlaying incident icons right on top of your crop. Simply click and drag to see a 360º view of your crop and click on the icons to drill down to see all the details — how cool is that?!</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="md:order-1">
                <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden bg-white shadow">
                  <img src={Picture3} alt="Find Persistent Problems" className="w-full h-full object-contain" />
                </div>
              </div>
              <div className="md:order-2">
                <h3 className="text-3xl font-bold text-gray-900">Find Persistent Problems</h3>
                <p className="text-gray-600 mt-4 leading-relaxed">With AgriScan AI heat maps, you're never left wondering where the source of the problems lie. Track the spread of pests or disease over time and even discover where there may be problems with your growing area itself.</p>
              </div>
            </div>
          </div>
        </section>


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


        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">AgriScan AI Data Science for Growers</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-2xl p-8 shadow">
              <div className="text-5xl font-extrabold mb-2">25%</div>
              <div className="text-lg font-semibold">Savings on</div>
              <div className="text-lg">Crop Inputs</div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-2xl p-8 shadow">
              <div className="text-5xl font-extrabold mb-2">30%</div>
              <div className="text-lg font-semibold">Savings on</div>
              <div className="text-lg">Crop Loss</div>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl p-8 shadow">
              <div className="text-5xl font-extrabold mb-2">50%</div>
              <div className="text-lg font-semibold">Savings on</div>
              <div className="text-lg">Scouting</div>
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

export default PestDetectionSystemGemini;
