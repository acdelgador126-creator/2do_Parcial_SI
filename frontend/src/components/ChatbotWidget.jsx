import { useState, useRef, useEffect } from 'react';
import api from '../api/axios';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: '¡Hola! Soy tu asistente virtual del CUP. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { sender: 'user', text }]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot/pregunta', { pregunta: text });
      setMessages((prev) => [...prev, { sender: 'bot', text: res.data.respuesta }]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Lo siento, he tenido problemas para conectar con mi cerebro del servidor.' }]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    { label: 'Requisitos', query: '¿Cuáles son los requisitos documentales?' },
    { label: 'Costo Matrícula', query: '¿Cuánto cuesta la inscripción y cómo pago?' },
    { label: 'Materias', query: '¿Qué materias se evalúan en el CUP?' },
    { label: 'Nota Aprobación', query: '¿Cómo apruebo el CUP y con qué nota?' }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Ventana de Chat */}
      {isOpen && (
        <div className="glass-panel w-80 sm:w-96 h-[480px] rounded-2xl mb-4 border border-slate-800 bg-slate-950/95 flex flex-col overflow-hidden shadow-2xl animate-fade-in">
          {/* Header */}
          <div className="bg-blue-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-white tracking-wider">Asistente Virtual CUP</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white focus:outline-none cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {messages.map((m, i) => (
              <div 
                key={i} 
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl rounded-tl-none px-3 py-2 text-[10px] italic flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                  </span>
                  Escribiendo...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Preguntas Rápidas */}
          <div className="px-3 py-2 border-t border-slate-850 flex flex-wrap gap-1.5 bg-slate-950/40">
            {quickQuestions.map((q) => (
              <button
                key={q.label}
                onClick={() => handleSend(q.query)}
                disabled={loading}
                className="text-[10px] font-semibold text-blue-400 border border-blue-500/25 bg-blue-500/5 hover:bg-blue-500/15 px-2 py-0.5 rounded-full transition-all cursor-pointer disabled:opacity-50"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Formulario envío */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-slate-850 bg-slate-950 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu duda o ingresa tu CI..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-blue-600 text-white shadow-2xl flex items-center justify-center hover:bg-blue-500 transition-all transform hover:scale-105 active:scale-95 border border-blue-500/20 cursor-pointer"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>
    </div>
  );
}
