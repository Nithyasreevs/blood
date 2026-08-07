import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, X, Send, HeartPulse, Bot, User, ChevronDown, Mic, Volume2, VolumeX } from 'lucide-react';

// ─── Rule-Based Knowledge Base ───────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: '🩸 How to donate blood?', query: 'how to donate blood' },
  { label: '🆘 Emergency blood request', query: 'emergency blood request' },
  { label: '🏥 Nearby hospitals', query: 'nearby hospitals' },
  { label: '📋 Eligibility criteria', query: 'eligibility' },
  { label: '🔬 Blood types explained', query: 'blood types' },
  { label: '⏱️ Donation process time', query: 'how long does donation take' },
];

const ROLE_QUICK_ACTIONS = {
  donor: [
    { label: 'Nearby requests', query: 'show my nearby emergency requests' },
    { label: 'Donation history', query: 'show my donation history' },
    { label: 'Rewards', query: 'how do my rewards work' },
  ],
  hospital: [
    { label: 'Manage inventory', query: 'how do I manage blood inventory' },
    { label: 'Create request', query: 'how do I create an emergency request' },
    { label: 'Verify donor', query: 'how do I verify a donor' },
  ],
  admin: [
    { label: 'Manage users', query: 'how do I manage users' },
    { label: 'Review requests', query: 'how do I review emergency requests' },
    { label: 'Analytics', query: 'show platform analytics help' },
  ],
};

const ROLE_WELCOME = {
  donor: (name) => `Welcome back${name ? `, ${name}` : ''}! I can help with nearby emergency requests, donation history, rewards, profile, and notifications.`,
  hospital: (name) => `Welcome back${name ? `, ${name}` : ''}! I can help manage inventory, create emergency requests, verify donors, run camps, and view reports.`,
  admin: (name) => `Welcome back${name ? `, ${name}` : ''}! I can help manage users, donors, hospitals, requests, inventory, analytics, and broadcasts.`,
};

const RULES = [
  {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon', 'hii', 'helo'],
    response: "Hello! 👋 Welcome to **LifeFlow** — your AI-powered emergency blood match network.\n\nI can help you with:\n• 🩸 Blood donation process\n• 🆘 Emergency blood requests\n• 🏥 Hospital & blood bank info\n• 📋 Eligibility & health questions\n• 🔬 Blood type compatibility\n\nHow can I assist you today?",
  },
  {
    keywords: ['donate blood', 'how to donate', 'donation process', 'want to donate', 'become a donor', 'register as donor'],
    response: "Great decision to save lives! 🩸 Here's how to donate blood on **LifeFlow**:\n\n**Step 1:** Click **\"Sign In / Register as Donor\"** on the homepage\n**Step 2:** Fill out your donor profile (blood type, location, health info)\n**Step 3:** Set your availability status to **Active**\n**Step 4:** When an emergency request matches your blood type & location, you'll receive an instant alert!\n\n💡 You can also view your **Donation History**, earn **Rewards**, and track your **Leaderboard** rank in the Donor Portal.",
  },
  {
    keywords: ['emergency', 'need blood', 'urgent blood', 'blood request', 'request blood', 'emergency blood'],
    response: "🆘 **Emergency Blood Request — No Login Required!**\n\nLifeFlow allows anyone to request blood instantly:\n\n1️⃣ Go to the **Emergency Patient Module** from the homepage\n2️⃣ Fill in: Patient name, blood type needed, hospital, urgency level\n3️⃣ Submit — our AI engine immediately matches nearby compatible donors\n4️⃣ Track your request status & view **live donor GPS tracking**\n\n⏱️ Our system matches donors within **15 minutes** in most metro areas.\n\n👉 Click **\"Request Blood Immediately\"** on the homepage to start!",
  },
  {
    keywords: ['eligibility', 'eligible', 'can i donate', 'who can donate', 'requirements', 'criteria'],
    response: "📋 **Blood Donation Eligibility Criteria:**\n\n✅ **Age:** 18–65 years old\n✅ **Weight:** Minimum 50 kg (110 lbs)\n✅ **Health:** Generally healthy, no fever or infections\n✅ **Hemoglobin:** At least 12.5 g/dL\n✅ **Last Donation:** At least 56 days (8 weeks) since last whole blood donation\n\n❌ **Cannot Donate If:**\n• Pregnant or recently delivered\n• Had tattoo/piercing in last 6 months\n• On certain medications (blood thinners, antibiotics)\n• Had major surgery in last 6 months\n• Tested positive for blood-borne infections\n\n💡 When in doubt, consult the hospital during verification!",
  },
  {
    keywords: ['blood type', 'blood group', 'types of blood', 'a+', 'b+', 'o+', 'ab+', 'compatibility', 'compatible'],
    response: "🔬 **Blood Type Compatibility Chart:**\n\n| Blood Type | Can Donate To | Can Receive From |\n|:---:|:---:|:---:|\n| **O−** | All types (Universal Donor) | O− only |\n| **O+** | O+, A+, B+, AB+ | O+, O− |\n| **A−** | A−, A+, AB−, AB+ | A−, O− |\n| **A+** | A+, AB+ | A+, A−, O+, O− |\n| **B−** | B−, B+, AB−, AB+ | B−, O− |\n| **B+** | B+, AB+ | B+, B−, O+, O− |\n| **AB−** | AB−, AB+ | AB−, A−, B−, O− |\n| **AB+** | AB+ only | All types (Universal Receiver) |\n\n💡 LifeFlow's AI uses this + Rh factor + antibody data for smart matching!",
  },
  {
    keywords: ['how long', 'time', 'duration', 'how much time', 'minutes'],
    response: "⏱️ **Blood Donation Timeline:**\n\n• **Registration & Check-in:** ~10 minutes\n• **Health screening (vitals, hemoglobin):** ~10 minutes\n• **Actual blood draw:** ~8–12 minutes (1 pint / 450ml)\n• **Rest & refreshments:** ~15 minutes\n\n📍 **Total time: About 45 minutes to 1 hour**\n\nAfter donation, drink plenty of fluids and avoid heavy exercise for 24 hours. Your body replaces the blood volume within 24–48 hours!",
  },
  {
    keywords: ['hospital', 'blood bank', 'nearby', 'find hospital', 'where to donate'],
    response: "🏥 **Finding Hospitals & Blood Banks:**\n\nLifeFlow connects you with registered hospitals in your area:\n\n1️⃣ Your location is detected when you register as a donor\n2️⃣ Emergency requests are matched by **proximity** (nearest first)\n3️⃣ Use the **Live Tracking** feature to navigate to the hospital\n\n📍 Hospitals on LifeFlow can:\n• Manage real-time blood inventory\n• Verify donors via **QR Code**\n• Organize **Blood Donation Camps**\n\n💡 Contact your nearest hospital's blood bank for walk-in donations!",
  },
  {
    keywords: ['reward', 'points', 'leaderboard', 'certificate', 'badge', 'gamification'],
    response: "🏆 **Donor Rewards & Recognition System:**\n\n🎖️ **Badges:** Earn badges for milestones (1st donation, 5th, 10th, 25th...)\n📜 **Certificates:** Download verified donation certificates\n⭐ **Points:** Earn points for each successful donation\n🏅 **Leaderboard:** Compete with other donors in your city/region\n🎁 **Streak Bonuses:** Maintain regular donation schedules for bonus rewards\n\nAccess all of these from the **Donor Portal → Rewards & Leaderboard** section!",
  },
  {
    keywords: ['track', 'tracking', 'live track', 'gps', 'map', 'status', 'where is donor'],
    response: "📍 **Live Tracking & Status Updates:**\n\n**For Patients/Requesters:**\n• After submitting a request, go to **Request Status** page\n• See which donors have been matched & accepted\n• View **real-time GPS location** of the donor en route\n• Get ETA updates and status notifications\n\n**For Donors:**\n• Accept an emergency request from your dashboard\n• Get **turn-by-turn navigation** to the hospital\n• Update your status: En Route → Arrived → Donating → Complete\n\n🗺️ Built with Leaflet maps for accurate real-time tracking!",
  },
  {
    keywords: ['ai', 'artificial intelligence', 'smart', 'algorithm', 'priority', 'scoring'],
    response: "🧠 **LifeFlow AI-Powered Features:**\n\n🔢 **Priority Scoring Engine:** Ranks donors by distance, blood compatibility, health score & availability\n🔬 **Compatibility Matrix:** Cross-matches blood types, Rh factors & antibody profiles\n📡 **Radius Expansion:** If no nearby donors found, AI auto-expands the search radius\n💬 **Chat Assistant:** That's me! Rule-based help for common queries\n📊 **Risk Assessment:** Flags potentially risky situations for admin review\n\nExplore all these in the **Smart Features Hub** module!",
  },
  {
    keywords: ['contact', 'support', 'help', 'phone', 'email', 'complaint'],
    response: "📞 **Need More Help?**\n\n• **Emergency Blood Helpline:** 1800-XXX-XXXX (24/7)\n• **Email:** support@lifeflow.org\n• **Admin Support:** Use the Admin portal for issue escalation\n\n🏥 For immediate medical emergencies, always call **108** (Ambulance) or **112** (Emergency).\n\nYou can also leave feedback through the **Patient Feedback** section after a blood request is fulfilled!",
  },
  {
    keywords: ['thank', 'thanks', 'thank you', 'thx', 'great', 'awesome', 'perfect'],
    response: "You're welcome! 😊❤️\n\nRemember — every blood donation can save up to **3 lives**! \n\nIf you have more questions, feel free to ask anytime. Stay safe and keep saving lives! 🩸💪",
  },
  {
    keywords: ['bye', 'goodbye', 'see you', 'exit', 'quit', 'close'],
    response: "Goodbye! 👋 Thank you for using **LifeFlow**.\n\n🩸 Remember: Donating blood is the gift of life. See you next time!\n\nStay healthy and keep making a difference! ❤️",
  },
];

const DEFAULT_RESPONSE = "I'm sorry, I didn't quite understand that. 🤔\n\nHere are some things I can help you with:\n• **\"How to donate blood\"** — Donation process\n• **\"Emergency blood request\"** — Urgent blood needs\n• **\"Eligibility\"** — Can I donate?\n• **\"Blood types\"** — Compatibility info\n• **\"Track\"** — Live tracking features\n• **\"AI features\"** — Smart engine details\n\nTry asking one of these, or click a quick action below! 👇";

// ─── Match Engine ────────────────────────────────────────────────────────────
function getRoleResponse(message, role) {
  const msg = message.toLowerCase();

  if (role === 'donor') {
    if (msg.includes('nearby') || msg.includes('request') || msg.includes('emergency')) return 'Open **Emergency Requests** to see compatible nearby requests. Accepting one gives you navigation and a hospital verification code.';
    if (msg.includes('history') || msg.includes('certificate')) return 'Open **Donation History** to view verified donations and download available certificates.';
    if (msg.includes('reward') || msg.includes('point') || msg.includes('leaderboard')) return 'Open **Rewards & Leaderboard** to see your points, badges, milestones, and city ranking.';
    if (msg.includes('profile') || msg.includes('availability')) return 'Open **My Profile** to update your details and availability. Keeping availability current helps us alert you only when you can donate.';
  }

  if (role === 'hospital') {
    if (msg.includes('inventory') || msg.includes('stock')) return 'Open **Blood Inventory** to update units by blood group. Accurate stock helps match emergency requests quickly.';
    if (msg.includes('create') || msg.includes('emergency request') || msg.includes('request blood')) return 'Open **Create Emergency Request**, enter the patient blood group, units, priority, and contact details, then submit to begin matching.';
    if (msg.includes('verify') || msg.includes('qr') || msg.includes('donor')) return 'Open **Donor Verification** and enter the donor verification code after donation. This credits the donation and updates the request.';
    if (msg.includes('camp')) return 'Open **Blood Camps** to create and manage donation drives.';
    if (msg.includes('report')) return 'Open **Reports** to review hospital donation and request performance.';
  }

  if (role === 'admin') {
    if (msg.includes('user') || msg.includes('donor') || msg.includes('hospital')) return 'Use **Manage Users**, **Manage Donors**, or **Manage Hospitals** to review profiles, verification status, and account access.';
    if (msg.includes('request') || msg.includes('review') || msg.includes('block')) return 'Open **Manage Requests** to review, verify, or block emergency requests.';
    if (msg.includes('inventory') || msg.includes('stock')) return 'Open **Inventory Monitor** to identify low-stock blood groups across partner hospitals.';
    if (msg.includes('broadcast')) return 'Open **Notification Centre** to send a platform-wide notification or emergency broadcast.';
    if (msg.includes('analytic') || msg.includes('report')) return 'Open **Analytics** to review platform demand, donation, and response trends.';
  }

  return null;
}

function getResponse(userMessage, role) {
  const roleResponse = getRoleResponse(userMessage, role);
  if (roleResponse) return roleResponse;
  const msg = userMessage.toLowerCase().trim();

  for (const rule of RULES) {
    for (const keyword of rule.keywords) {
      if (msg.includes(keyword)) {
        return rule.response;
      }
    }
  }

  return DEFAULT_RESPONSE;
}

async function getBackendResponse(message, role, user, language) {
  const response = await fetch('/api/ai/chatbot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      role: role || 'public',
      user_id: user?.user_id,
      language,
    }),
  });

  if (!response.ok) throw new Error('Chat service unavailable');
  const data = await response.json();
  if (!data.success || !data.reply) throw new Error('Invalid chat response');
  return data.reply;
}

const EMERGENCY_STEPS = [
  { key: 'patient_name', en: 'Emergency request started. Please tell me the patient name.', ta: 'Emergency request start pannalam. Patient peru sollunga.' },
  { key: 'blood_group', en: 'What blood group is needed? For example, O negative or A positive.', ta: 'Entha blood group venum? Example O negative illa A positive sollunga.' },
  { key: 'units', en: 'How many units of blood are needed?', ta: 'Ethana units blood venum?' },
  { key: 'hospital_name', en: 'Which hospital should receive the blood?', ta: 'Entha hospital-ku blood venum?' },
  { key: 'contact_number', en: 'Please say a 10-digit contact number.', ta: '10 digit contact number sollunga.' },
  { key: 'city', en: 'Which city is the hospital in?', ta: 'Hospital entha city-la irukku?' },
];

const normalizeBloodGroup = (value) => {
  const text = value
    .replace(/பாசிட்டிவ்|பாசிடிவ்/gi, ' positive ')
    .replace(/நெகட்டிவ்/gi, ' negative ')
    .replace(/பிளஸ்/gi, ' plus ')
    .replace(/மைனஸ்/gi, ' minus ')
    .toUpperCase().replace(/\s+/g, ' ').trim();
  const match = text.match(/(AB|A|B|O)\s*(POSITIVE|PLUS|NEGATIVE|MINUS|[+-])/);
  if (!match) return null;
  return `${match[1]}${/POSITIVE|PLUS|\+/.test(match[2]) ? '+' : '-'}`;
};

// ─── Component ───────────────────────────────────────────────────────────────
const Chatbot = ({ user, isLoggedIn }) => {
  const role = isLoggedIn ? user?.role : null;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hi there! 👋 I'm **LifeFlow Assistant** — your blood donation helpbot.\n\nAsk me anything about donating blood, emergency requests, eligibility, or how LifeFlow works!\n\nOr pick a quick action below 👇",
      time: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState('en-IN');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [emergencyFlow, setEmergencyFlow] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatBodyRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    setMessages([{
      sender: 'bot',
      text: role
        ? ROLE_WELCOME[role]?.(user?.name) || 'Welcome back! How can I help with your LifeFlow account?'
        : 'Hello! I can help with blood donation, emergency requests, eligibility, blood groups, and LifeFlow features.',
      time: new Date(),
    }]);
  }, [role, user?.user_id]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const speak = (text, onEnd) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*/g, '').replace(/\n/g, ' '));
    // Tanglish prompts are written in English letters, so the Indian English voice reads them naturally.
    utterance.lang = voiceLanguage === 'ta-IN' ? 'en-IN' : voiceLanguage;
    utterance.rate = 0.95;
    utterance.onend = onEnd;
    window.speechSynthesis.speak(utterance);
  };

  const addBotMessage = (text, listenAfter = false) => {
    setMessages((prev) => [...prev, { sender: 'bot', text, time: new Date() }]);
    speak(text, listenAfter ? () => setTimeout(startVoiceInput, 350) : undefined);
  };

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addBotMessage('Voice input is not supported in this browser. Please use Chrome or type your message.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = voiceLanguage;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      addBotMessage('I could not hear that clearly. Please tap the microphone and try again.');
    };
    recognition.onresult = (event) => handleSend(event.results[0][0].transcript);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const startEmergencyFlow = () => {
    const firstQuestion = voiceLanguage === 'ta-IN' ? EMERGENCY_STEPS[0].ta : EMERGENCY_STEPS[0].en;
    setEmergencyFlow({ step: 0, data: {} });
    addBotMessage(firstQuestion, true);
  };

  const continueEmergencyFlow = async (answer) => {
    const current = EMERGENCY_STEPS[emergencyFlow.step];
    let value = answer.trim();
    if (current.key === 'blood_group') value = normalizeBloodGroup(value);
    if (current.key === 'units') value = value.match(/\d+/)?.[0];
    if (current.key === 'contact_number') value = value.replace(/\D/g, '');
    if (!value || (current.key === 'contact_number' && value.length !== 10)) {
      const retry = current.key === 'contact_number'
        ? 'Please say the complete 10-digit contact number again.'
        : `I need the ${current.key.replace('_', ' ')}. Please say it again.`;
      addBotMessage(voiceLanguage === 'ta-IN' && current.key === 'contact_number' ? 'Full 10 digit contact number marubadiyum sollunga.' : retry, true);
      return;
    }

    const data = { ...emergencyFlow.data, [current.key]: value };
    const nextStep = emergencyFlow.step + 1;
    if (nextStep < EMERGENCY_STEPS.length) {
      setEmergencyFlow({ step: nextStep, data });
      addBotMessage(voiceLanguage === 'ta-IN' ? EMERGENCY_STEPS[nextStep].ta : EMERGENCY_STEPS[nextStep].en, true);
      return;
    }

    setEmergencyFlow(null);
    setIsTyping(true);
    try {
      const response = await fetch('/api/request/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, units: Number(data.units), priority: 'Critical' }),
      });
      const result = await response.json();
      addBotMessage(result.success
        ? `Emergency request submitted successfully. Request ID: ${result.request_id}. Nearby compatible donors are being alerted now.`
        : result.message || 'I could not submit the emergency request. Please try again.');
    } catch {
      addBotMessage('I could not connect to the emergency service. Please call 108 or 112 for immediate medical assistance.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (text) => {
    const msgText = (text || input).trim();
    if (!msgText) return;

    // Add user message
    const userMsg = { sender: 'user', text: msgText, time: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setIsTyping(true);
    setTimeout(async () => {
      let botReply;
      try {
        botReply = await getBackendResponse(msgText, role, user, voiceLanguage);
      } catch (error) {
        // Keep basic public help available if the backend is restarting or offline.
        botReply = getResponse(msgText, role);
      }
      addBotMessage(botReply);
      setIsTyping(false);
    }, 350);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Simple markdown-ish rendering (bold, line breaks)
  const renderText = (text) => {
    return text.split('\n').map((line, i) => {
      // Bold
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="font-bold text-white">{part.slice(2, -2)}</strong>;
        }
        return <span key={j}>{part}</span>;
      });
      return (
        <span key={i}>
          {parts}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  return createPortal(
    <>
      {/* ─── Floating Chat Toggle Button ─── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`lifeflow-chat-toggle ${isOpen ? 'lifeflow-chat-toggle--open' : ''} fixed bottom-6 right-6 z-[9998] w-14 h-14 rounded-full flex items-center justify-center
          shadow-2xl transition-all duration-300 transform hover:scale-110 group
          ${isOpen
            ? 'bg-slate-800 border border-slate-600 rotate-0'
            : 'bg-gradient-to-tr from-red-600 to-rose-500 border border-red-400/50 shadow-red-500/50 animate-bounce-slow'
          }`}
        title={isOpen ? 'Close Chat' : 'Chat with LifeFlow Assistant'}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-slate-300" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6 text-white" />
            {/* Notification pulse */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
          </>
        )}
      </button>

      {/* ─── Chat Window ─── */}
      {isOpen && (
        <div
          className="lifeflow-chat-window fixed bottom-24 right-6 z-[9999] w-[380px] max-w-[calc(100vw-2rem)]
            rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-slate-700/80
            flex flex-col"
          style={{
            height: '560px',
            maxHeight: 'calc(100vh - 8rem)',
            animation: 'chatSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* ─── Header ─── */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-3 flex items-center gap-3 border-b border-slate-700 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/30">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                LifeFlow Assistant
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h3>
              <p className="text-[10px] text-slate-400">Blood Donation Helpbot • Always Online</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* ─── Messages Area ─── */}
          <div
            ref={chatBodyRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-950/95 backdrop-blur-xl"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#334155 transparent',
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Bot avatar */}
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shrink-0 mt-1 shadow-md">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white rounded-br-md shadow-lg shadow-red-500/20'
                      : 'bg-slate-800/90 text-slate-200 rounded-bl-md border border-slate-700/50'
                  }`}
                >
                  <div>{renderText(msg.text)}</div>
                  <p className={`text-[9px] mt-1.5 ${msg.sender === 'user' ? 'text-red-200/60 text-right' : 'text-slate-500'}`}>
                    {formatTime(msg.time)}
                  </p>
                </div>

                {/* User avatar */}
                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shrink-0 mt-1 shadow-md">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-800/90 rounded-2xl rounded-bl-md px-4 py-3 border border-slate-700/50">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ─── Quick Actions ─── */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 bg-slate-900/95 border-t border-slate-800 shrink-0">
              <div className="flex flex-wrap gap-1.5">
                {(role ? ROLE_QUICK_ACTIONS[role] || QUICK_ACTIONS : QUICK_ACTIONS).map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(action.query)}
                    className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg
                      bg-slate-800 border border-slate-700 text-slate-300
                      hover:bg-red-500/15 hover:border-red-500/40 hover:text-red-300
                      transition-all duration-150"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Input Area ─── */}
          <div className="px-3 py-3 bg-slate-900/95 border-t border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={role ? `Ask about your ${role} portal...` : 'Ask about blood donation...'}
                className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5
                  text-sm text-white placeholder:text-slate-500 outline-none
                  focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                  ${input.trim()
                    ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[9px] text-slate-600 text-center mt-1.5">
              Powered by LifeFlow • {role ? `${role[0].toUpperCase()}${role.slice(1)} portal assistant` : 'Public help assistant'}
            </p>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

export default Chatbot;
