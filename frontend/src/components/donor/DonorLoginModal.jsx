import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Mail, User, Phone, MapPin, Heart, Shield, Building2, Droplet } from 'lucide-react';

const cities = [
  'Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tirunelveli','Vellore','Erode','Thoothukudi',
  'Dindigul','Thanjavur','Ranipet','Sivakasi','Karur','Udhagamandalam','Hosur','Nagercoil','Kanchipuram',
  'Kumbakonam','Cuddalore','Kovilpatti','Tiruvannamalai','Pollachi','Rajapalayam','Pudukkottai','Ramanathapuram',
  'Namakkal','Krishnagiri','Dharmapuri','Tiruppur','Ariyalur','Perambalur','Kallakurichi','Tenkasi',
  'Chengalpattu','Mayiladuthurai','Thiruvarur','Nagapattinam','Theni','Villupuram','Tirupathur','Nilgiris'
];

const DonorLoginModal = ({ isOpen, onClose, targetRole = 'donor', onLoginSuccess }) => {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState(targetRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O-');
  const [weight, setWeight] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [hospLat, setHospLat] = useState(13.0827);
  const [hospLng, setHospLng] = useState(80.2707);
  const [cityInput, setCityInput] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const cityRef = useRef(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    setRole(targetRole);
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setAddress('');
    setCity('');
    setCityInput('');
    setCity('');
    setWeight('');
    setMessage('');
  }, [targetRole, isOpen]);

  useEffect(() => {
    const handle = (e) => {
      if (cityRef.current && !cityRef.current.contains(e.target)) setShowCitySuggestions(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleCityInput = (value) => {
    setCityInput(value);
    setCity('');
    setName('');
    if (value.length < 1) { setCitySuggestions([]); setShowCitySuggestions(false); return; }
    const filtered = cities.filter(c => c.toLowerCase().includes(value.toLowerCase()));
    setCitySuggestions(filtered);
    setShowCitySuggestions(true);
  };

  const selectCity = (cityName) => {
    setCityInput(cityName);
    setCity(cityName);
    setShowCitySuggestions(false);
    setName('');
    setAddress('');
  };

  const handleQuickDemo = async () => {
    const demoCredentials = role === 'hospital'
      ? { email: 'bloodbank@apollo.com', password: 'password123', role: 'hospital' }
      : role === 'admin'
      ? { email: 'admin@lifeflow.org', password: 'password123', role: 'admin' }
      : { email: 'rahul@lifeflow.org', password: 'password123', role: 'donor' };
    setEmail(demoCredentials.email);
    setPassword(demoCredentials.password);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoCredentials)
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess(data.user);
        onClose();
      } else {
        setMessage(data.message || 'Demo account not found. Please register first.');
      }
    } catch (err) {
      setMessage('Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Role-specific configuration & field labels
  const roleConfig = {
    donor: {
      title: mode === 'register' ? 'Register as Blood Donor' : 'Donor Portal Login',
      subtitle: mode === 'register' ? 'Create a donor profile to receive nearby emergency blood alerts' : 'Sign in to access your donor profile & rewards',
      badge: '👤 BLOOD DONOR',
      icon: Heart,
      color: 'from-red-600 to-rose-600',
      border: 'border-red-500/40',
      nameLabel: 'Donor Full Name',
      namePlaceholder: 'Enter donor full name'
    },
    hospital: {
      title: mode === 'register' ? 'Register Partner Hospital' : 'Hospital Desk Login',
      subtitle: mode === 'register' ? 'Register hospital blood bank desk to request blood & verify donors' : 'Sign in to manage blood bank stock & emergency requests',
      badge: '🏥 HOSPITAL BLOOD BANK DESK',
      icon: Building2,
      color: 'from-amber-600 to-red-600',
      border: 'border-amber-500/40',
      nameLabel: 'Hospital Name',
      namePlaceholder: 'e.g. Apollo Speciality Hospital'
    },
    admin: {
      title: mode === 'register' ? 'Register Administrator' : 'Admin Command Console Login',
      subtitle: mode === 'register' ? 'Create administrative credentials for platform oversight' : 'Sign in for system oversight & risk audit',
      badge: '👨‍💻 SYSTEM ADMINISTRATOR',
      icon: Shield,
      color: 'from-purple-600 to-indigo-600',
      border: 'border-purple-500/40',
      nameLabel: 'Administrator Name',
      namePlaceholder: 'Enter admin full name'
    }
  };

  const currentConfig = roleConfig[role] || roleConfig.donor;
  const RoleIcon = currentConfig.icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const endpoint = mode === 'register' 
        ? '/api/auth/register' 
        : mode === 'forgot'
        ? '/api/auth/forgot-password'
        : '/api/auth/login';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          phone,
          blood_group: role === 'donor' ? bloodGroup : undefined,
          weight: role === 'donor' && weight ? Number(weight) : undefined,
          role,
          city,
          address: role === 'hospital' ? address : undefined,
          latitude: role === 'hospital' ? hospLat : undefined,
          longitude: role === 'hospital' ? hospLng : undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage(data.message || 'Authenticated successfully!');
        setTimeout(() => {
          onLoginSuccess(data.user);
          onClose();
        }, 500);
      } else {
        setMessage(data.message || 'Invalid registration or login details.');
      }
    } catch (err) {
      setMessage('Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[9999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden">
      <div className={`glass-panel w-full max-w-md p-6 relative rounded-2xl border ${currentConfig.border} shadow-2xl bg-slate-950/90 max-h-[90vh] overflow-y-auto`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/50 hover:bg-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Role Selector Tabs */}
        <div className="flex items-center justify-center gap-2 mb-6 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            onClick={() => setRole('donor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${role === 'donor' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            👤 Donor
          </button>
          <button
            onClick={() => setRole('hospital')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${role === 'hospital' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            🏥 Hospital
          </button>
          <button
            onClick={() => setRole('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${role === 'admin' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            👨‍💻 Admin
          </button>
        </div>

        {/* Header Branding */}
        <div className="text-center mb-6 space-y-2">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${currentConfig.color} flex items-center justify-center mx-auto shadow-lg text-white`}>
            <RoleIcon className="w-7 h-7" />
          </div>

          <span className="inline-block bg-slate-900 border border-slate-700 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-amber-400 tracking-wider">
            {currentConfig.badge}
          </span>

          <h2 className="text-2xl font-bold text-white font-heading">
            {currentConfig.title}
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
            {currentConfig.subtitle}
          </p>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-xl border text-xs font-semibold text-center ${message.toLowerCase().includes('success') ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-red-500/20 border-red-500/40 text-red-300'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              {/* Name Field (Adapts for Donor / Hospital / Admin) */}
              {role === 'hospital' ? (
                <>
                  <div className="form-group relative" ref={cityRef}>
                    <label>City / District</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input type="text" required value={cityInput} onChange={e => handleCityInput(e.target.value)} placeholder="Type city name..." className="form-control pl-10" />
                    </div>
                    {showCitySuggestions && citySuggestions.length > 0 && (
                      <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                        {citySuggestions.map((c) => (
                          <button key={c} type="button" onClick={() => selectCity(c)} className="w-full text-left px-4 py-3 text-xs text-slate-200 hover:bg-slate-800 border-b border-slate-800 last:border-0 flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="font-semibold text-white">{c}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>{currentConfig.nameLabel}</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Enter hospital name" className="form-control pl-10" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label>{currentConfig.nameLabel}</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder={currentConfig.namePlaceholder} className="form-control pl-10" />
                  </div>
                </div>
              )}

              {/* Phone & Role-Specific Extra Field */}
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label>{role === 'hospital' ? 'Hospital Phone' : 'Phone Number'}</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="form-control"
                  />
                </div>

                {/* Only Donors ask for Blood Group & Weight */}
                {role === 'donor' && (
                  <>
                    <div className="form-group">
                      <label>Blood Group</label>
                      <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="form-control bg-slate-900">
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Weight (kg)</label>
                      <input
                        type="number"
                        min="30"
                        max="200"
                        value={weight}
                        onChange={e => setWeight(e.target.value)}
                        placeholder="e.g. 70"
                        className="form-control"
                      />
                    </div>
                  </>
                )}

                {/* Hospitals ask for Address */}
                {role === 'hospital' && (
                  <div className="form-group">
                    <label>Hospital Address</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Hospital address"
                      className="form-control"
                    />
                  </div>
                )}

                {/* Admin asks for Department */}
                {role === 'admin' && (
                  <div className="form-group">
                    <label>City / Dept</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="e.g. Chennai"
                      className="form-control"
                    />
                  </div>
                )}
              </div>

              {role !== 'admin' && role !== 'hospital' && (
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Enter city name"
                    className="form-control"
                  />
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label>{role === 'hospital' ? 'Hospital Email Address' : 'Email Address'}</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={role === 'hospital' ? 'official@hospital.com' : 'Enter email address'}
                className="form-control pl-10"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="form-group">
              <label>Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="form-control pl-10"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full btn-primary justify-center py-3 text-xs font-bold rounded-xl shadow-lg bg-gradient-to-r ${currentConfig.color}`}
          >
            {loading ? 'Authenticating...' : mode === 'login' ? `Sign In as ${role.toUpperCase()}` : `Create ${role.toUpperCase()} Account`}
          </button>

        </form>

        <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-3 border-t border-slate-800">
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="hover:text-red-400 underline">
            {mode === 'login' ? `Don't have an account? Register as ${role}` : "Already registered? Sign In"}
          </button>
          {mode === 'login' && (
            <button onClick={() => setMode('forgot')} className="hover:text-red-400 underline">
              Forgot password?
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonorLoginModal;
