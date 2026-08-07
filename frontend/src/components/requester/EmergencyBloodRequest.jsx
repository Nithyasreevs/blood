import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ShieldAlert, HeartPulse, CheckCircle, Search, X, Building2 } from 'lucide-react';

const cities = [
  'Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tirunelveli','Vellore','Erode','Thoothukudi',
  'Dindigul','Thanjavur','Ranipet','Sivakasi','Karur','Udhagamandalam','Hosur','Nagercoil','Kanchipuram',
  'Kumbakonam','Cuddalore','Kovilpatti','Tiruvannamalai','Pollachi','Rajapalayam','Pudukkottai','Ramanathapuram',
  'Namakkal','Krishnagiri','Dharmapuri','Tiruppur','Ariyalur','Perambalur','Kallakurichi','Tenkasi',
  'Chengalpattu','Mayiladuthurai','Thiruvarur','Nagapattinam','Theni','Villupuram','Tirupathur','Nilgiris'
];

const EmergencyBloodRequest = ({ onRequestSubmitted }) => {
  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O-');
  const [units, setUnits] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [phone, setPhone] = useState('');
  const [priority, setPriority] = useState('Critical');
  const [cityInput, setCityInput] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [location, setLocation] = useState({ lat: 13.0827, lng: 80.2707, text: 'Chennai' });
  const [loading, setLoading] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const cityRef = useRef(null);

  const getAddressFromCoords = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await res.json();
      const addr = data?.address;
      return addr?.city || addr?.town || addr?.village || addr?.county || addr?.state || 'Chennai';
    } catch {
      return 'Chennai';
    }
  };

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const city = await getAddressFromCoords(pos.coords.latitude, pos.coords.longitude);
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, text: city });
        },
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    const handle = (e) => {
      if (cityRef.current && !cityRef.current.contains(e.target)) setShowCitySuggestions(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleCityInput = (value) => {
    setCityInput(value);
    setSelectedCity('');
    setHospitalName('');
    if (value.length < 1) { setCitySuggestions([]); setShowCitySuggestions(false); return; }
    const filtered = cities.filter(c => c.toLowerCase().includes(value.toLowerCase()));
    setCitySuggestions(filtered);
    setShowCitySuggestions(true);
  };

  const selectCity = (city) => {
    setCityInput(city);
    setSelectedCity(city);
    setShowCitySuggestions(false);
    setHospitalName('');
    setLocation(prev => ({ ...prev, text: city }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    if (!patientName || !phone || !units || !hospitalName || !selectedCity) {
      setErrorMsg('Please fill in all patient details before submitting');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/request/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: patientName,
          blood_group: bloodGroup,
          units: Number(units),
          hospital_name: hospitalName,
          priority,
          contact_number: phone,
          city: selectedCity,
          latitude: location.lat,
          longitude: location.lng
        })
      });
      const data = await res.json();
      if (data.success) {
        setSubmittedRequest(data);
        if (onRequestSubmitted) onRequestSubmitted(data);
      } else {
        setErrorMsg(data.message || 'Failed to broadcast emergency request');
      }
    } catch (err) {
      setErrorMsg('Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-l-red-600">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-500/40">
            <HeartPulse className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-heading">Emergency Blood Request</h2>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">Instant Request (No Login Required)</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">Submit patient details. Priority score will be calculated & notifications dispatched immediately.</p>
          </div>
        </div>
      </div>

      {submittedRequest ? (
        <div className="glass-panel p-8 rounded-2xl border-2 border-emerald-500/50 text-center space-y-4 bg-emerald-950/20">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-white font-heading">Emergency Request Broadcasted!</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Your emergency request for <strong className="text-amber-300">{patientName}</strong> has been logged and dispatched to compatible donors.
          </p>
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-left max-w-md mx-auto space-y-2">
            <p className="text-slate-400">Patient: <strong className="text-white">{patientName}</strong></p>
            <p className="text-slate-400">Blood Needed: <strong className="text-red-400">{bloodGroup} ({units} Units)</strong></p>
            <p className="text-slate-400">Hospital: <strong className="text-white">{hospitalName}</strong></p>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-6 md:p-8 rounded-2xl border border-slate-700/80 space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold text-center">{errorMsg}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label>Patient Full Name</label>
                <input type="text" required value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Enter patient full name" className="form-control" />
              </div>
              <div className="form-group">
                <label>Blood Group Required</label>
                <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="form-control bg-slate-900">
                  <option value="O-">O- (Universal Donor)</option>
                  <option value="O+">O+</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
              <div className="form-group">
                <label>Units Required</label>
                <input type="number" min="1" max="10" required value={units} onChange={e => setUnits(e.target.value)} placeholder="Enter number of units" className="form-control" />
              </div>
              <div className="form-group relative" ref={cityRef}>
                <label>City / District</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input type="text" required value={cityInput} onChange={e => handleCityInput(e.target.value)} placeholder="Type city name..." className="form-control pl-10" />
                  {cityInput && selectedCity && (
                    <button type="button" onClick={() => { setCityInput(''); setSelectedCity(''); setHospitalName(''); }} className="absolute right-3 top-3 text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {showCitySuggestions && citySuggestions.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                    {citySuggestions.map((city) => (
                      <button key={city} type="button" onClick={() => selectCity(city)} className="w-full text-left px-4 py-3 text-xs text-slate-200 hover:bg-slate-800 border-b border-slate-800 last:border-0 flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                        <span className="font-semibold text-white">{city}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Hospital Name</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input type="text" required value={hospitalName} onChange={e => setHospitalName(e.target.value)} placeholder="Enter hospital name" className="form-control pl-10" />
                </div>
              </div>
              <div className="form-group">
                <label>Contact Phone Number</label>
                <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter contact phone number" className="form-control" />
              </div>
              <div className="form-group">
                <label>Emergency Priority Level</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="form-control bg-slate-900">
                  <option value="Critical">🔴 Critical (Need within 30 min)</option>
                  <option value="High">🟠 High (Need within 2 hours)</option>
                  <option value="Medium">🟡 Normal (Scheduled Surgery)</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary justify-center py-3.5 text-sm font-extrabold rounded-xl shadow-xl shadow-red-600/40">
              {loading ? 'Dispatching Emergency Alert...' : '🚀 Broadcast Emergency Blood Request Now'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default EmergencyBloodRequest;
