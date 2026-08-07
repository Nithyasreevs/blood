import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Mic, PhoneCall, Volume2, X } from 'lucide-react';

const QUESTIONS = [
  { key: 'patient_name', en: 'Please tell me the patient name.', ta: 'Patient peru sollunga.' },
  { key: 'blood_group', en: 'What blood group is needed? For example, O negative.', ta: 'Entha blood group venum? Example O negative sollunga.' },
  { key: 'units', en: 'How many units of blood are needed?', ta: 'Ethana units blood venum?' },
  { key: 'hospital_name', en: 'Which hospital should receive the blood?', ta: 'Entha hospital-ku blood venum?' },
  { key: 'contact_number', en: 'Please say the 10 digit contact number.', ta: '10 digit contact number sollunga.' },
  { key: 'city', en: 'Which city is the hospital in?', ta: 'Hospital entha city-la irukku?' },
];

const normalizeBloodGroup = (value) => {
  const text = value.toUpperCase();
  const match = text.match(/(AB|A|B|O)\s*(POSITIVE|PLUS|NEGATIVE|MINUS|[+-])/);
  return match ? `${match[1]}${/POSITIVE|PLUS|\+/.test(match[2]) ? '+' : '-'}` : null;
};

const VoiceEmergencyAssistant = () => {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState('en-IN');
  const [listening, setListening] = useState(false);
  const [step, setStep] = useState(-1);
  const [details, setDetails] = useState({});
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('Tap Start and speak your answers.');
  const recognitionRef = useRef(null);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const speak = (text, listenAfter = false) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Tanglish uses English letters, so en-IN reads it more naturally.
    utterance.lang = language === 'ta-IN' ? 'en-IN' : language;
    utterance.rate = 0.92;
    if (listenAfter) utterance.onend = () => setTimeout(startListening, 350);
    window.speechSynthesis.speak(utterance);
  };

  const askStep = (nextStep) => {
    const question = language === 'ta-IN' ? QUESTIONS[nextStep].ta : QUESTIONS[nextStep].en;
    setStep(nextStep);
    setStatus(question);
    speak(question, true);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus('Voice recognition needs Google Chrome. Please open the site in Chrome.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setStatus('I could not hear that. Please tap the microphone and speak again.');
    recognition.onresult = (event) => handleAnswer(event.results[0][0].transcript);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const submitRequest = async (requestDetails) => {
    setStatus('Submitting your emergency request now.');
    try {
      if (!navigator.geolocation) {
        throw new Error('GPS is not available in this browser.');
      }
      const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true, timeout: 15000, maximumAge: 60000
      }));
      const response = await fetch('/api/request/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...requestDetails,
          units: Number(requestDetails.units),
          priority: 'Critical',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }),
      });
      const result = await response.json();
      const message = result.success
        ? `Your emergency blood request is submitted. Request ID ${result.request_id}. Compatible donors are being alerted.`
        : result.message || 'I could not submit the request. Please try again.';
      setStatus(message);
      speak(message);
    } catch (error) {
      const message = error?.message?.includes('GPS') || error?.code === 1
        ? 'Please allow location permission so I can alert nearby donors.'
        : 'I could not connect to the request service. For immediate danger, please call 108 or 112.';
      setStatus(message);
      speak(message);
    }
  };

  const handleAnswer = (answer) => {
    setTranscript(answer);
    const question = QUESTIONS[step];
    let value = answer.trim();
    if (question.key === 'blood_group') value = normalizeBloodGroup(value);
    if (question.key === 'units') value = value.match(/\d+/)?.[0];
    if (question.key === 'contact_number') value = value.replace(/\D/g, '');
    if (!value || (question.key === 'contact_number' && value.length !== 10)) {
      const retry = question.key === 'contact_number' ? 'Please say the complete 10 digit number again.' : `Please say the ${question.key.replace('_', ' ')} again.`;
      setStatus(retry);
      speak(retry, true);
      return;
    }
    const nextDetails = { ...details, [question.key]: value };
    setDetails(nextDetails);
    if (step === QUESTIONS.length - 1) {
      setStep(QUESTIONS.length);
      submitRequest(nextDetails);
    } else {
      askStep(step + 1);
    }
  };

  const begin = () => {
    setDetails({});
    setTranscript('');
    askStep(0);
  };

  return createPortal(
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-24 z-[2147483645] w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-tr from-violet-600 to-indigo-500 border border-violet-300/50 text-white shadow-xl hover:scale-110 transition-transform"
        title="Voice emergency assistant"
        aria-label="Open voice emergency assistant"
      >
        <Mic className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[2147483647] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <section className="w-full max-w-md rounded-3xl bg-slate-900 border border-violet-400/40 shadow-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 shrink-0 rounded-2xl bg-violet-600 flex items-center justify-center"><Volume2 className="w-6 h-6" /></div>
              <div className="flex-1">
                <h2 className="font-bold text-white">Voice Emergency Assistant</h2>
                <p className="text-xs text-slate-300">I will ask, listen, and fill the request for you.</p>
              </div>
              <button onClick={() => { recognitionRef.current?.stop(); setOpen(false); }} className="text-slate-400 hover:text-white"><X /></button>
            </div>

            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
              <option value="en-IN">English</option>
              <option value="ta-IN">Tamil / Tanglish</option>
            </select>

            <div className="rounded-2xl bg-slate-800/90 p-4 min-h-24 text-sm text-slate-100">
              {status}
              {transcript && <p className="mt-2 text-xs text-violet-300">Heard: “{transcript}”</p>}
            </div>

            {Object.keys(details).length > 0 && (
              <div className="text-xs text-slate-300 grid grid-cols-2 gap-2">
                {Object.entries(details).map(([key, value]) => <span key={key}><b className="text-slate-100">{key.replace('_', ' ')}:</b> {value}</span>)}
              </div>
            )}

            <button onClick={step < 0 ? begin : startListening} className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${listening ? 'bg-red-600 animate-pulse' : 'bg-violet-600 hover:bg-violet-500'} text-white`}>
              <Mic className="w-5 h-5" /> {listening ? 'Listening…' : step < 0 ? 'Start Voice Emergency Request' : 'Tap to Speak Again'}
            </button>
            <p className="text-[11px] text-slate-400 text-center"><PhoneCall className="inline w-3 h-3 mr-1" />For immediate danger, call 108 or 112.</p>
          </section>
        </div>
      )}
    </>,
    document.body
  );
};

export default VoiceEmergencyAssistant;
