'use client';
import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { MessageCircle, X, Send, Bot, User, ChevronDown } from 'lucide-react';

interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

// Knowledge base - maps keywords to FAQ answers
// This is a local rule-based chatbot (no external API needed)
function getKnowledgeBase(t: (key: string) => string, locale: string) {
  const entries: { keywords: string[]; answer: string; category: string }[] = [
    // What / who
    { keywords: ['what is', "c'est quoi", 'cest quoi', 'quest-ce', "qu'est-ce", 'about', 'à propos', 'presentation', 'présentation', 'comment ça marche', 'how does it work', 'how it works'],
      answer: t('kb.whatIsIt'), category: 'general' },
    { keywords: ['who pays', 'qui paie', 'qui paye', 'employee pay', 'employé paie', 'gratuit', 'free', 'employer pay', 'employeur paie'],
      answer: t('kb.whoPays'), category: 'general' },
    // Pricing
    { keywords: ['price', 'prix', 'cost', 'coût', 'cout', 'combien', 'how much', 'pricing', 'tarif', 'fee', 'frais', 'plancher', 'floor', 'participant', 'per participant', 'par participant', 'invoice', 'facture', 'facturation', 'billing'],
      answer: t('kb.pricing'), category: 'employers' },
    // Groups & driving
    { keywords: ['group', 'groupe', 'team up', 'colleagues', 'collègues', 'collegues', '2 to 4', '2 à 4', 'members', 'membres'],
      answer: t('kb.groups'), category: 'employees' },
    { keywords: ['driver', 'conducteur', 'chauffeur', 'who drives', 'qui conduit', 'alternate', 'alterner', 'rotation', 'take turns', 'tour de rôle', 'passenger', 'passager'],
      answer: t('kb.driver'), category: 'employees' },
    { keywords: ['record', 'enregistrer', 'log', 'validate', 'valider', 'validation', 'confirm', 'confirmer', 'carpooled today', 'covoituré', 'covoiture'],
      answer: t('kb.validation'), category: 'employees' },
    // Joining
    { keywords: ['join', 'rejoindre', 'code', 'qr', 'invite', 'invitation', 'lien', 'link', 'connect employer', 'relier'],
      answer: t('kb.joinEmployee'), category: 'account' },
    { keywords: ['employer', 'employeur', 'company', 'entreprise', 'pilot', 'pilote', 'demo', 'démo', 'start', 'démarrer', 'get started', 'commencer'],
      answer: t('kb.employerStart'), category: 'employers' },
    // Safety / insurance / privacy
    { keywords: ['safe', 'safety', 'secure', 'sécurité', 'securite', 'sûr', 'stranger', 'inconnu', 'danger'],
      answer: t('kb.safety'), category: 'safety' },
    { keywords: ['insurance', 'assurance', 'covered', 'couvert', 'accident'],
      answer: t('kb.insurance'), category: 'safety' },
    { keywords: ['delete', 'supprimer', 'data', 'données', 'donnees', 'privacy', 'confidentialité', 'confidentialite', 'pipeda', 'lprpde'],
      answer: t('kb.dataPrivacy'), category: 'account' },
    // Account
    { keywords: ['account', 'compte', 'register', 'inscription', 'sign up', 'créer compte', 'login', 'connexion', 'google', 'email', 'courriel', 'password', 'mot de passe'],
      answer: t('kb.account'), category: 'account' },
    // Support
    { keywords: ['contact', 'support', 'customer service', 'service client', 'help', 'aide', 'report', 'signaler', 'problem', 'problème', 'probleme'],
      answer: t('kb.support'), category: 'support' },
  ];
  return entries;
}

function findBestAnswer(query: string, kb: ReturnType<typeof getKnowledgeBase>, defaultAnswer: string): string {
  const q = query.toLowerCase();
  let bestMatch = { score: 0, answer: defaultAnswer };

  for (const entry of kb) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (q.includes(kw.toLowerCase())) {
        score += kw.length; // longer keyword matches = more relevant
      }
    }
    if (score > bestMatch.score) {
      bestMatch = { score, answer: entry.answer };
    }
  }

  return bestMatch.answer;
}

export default function ChatbotWidget() {
  const t = useTranslations('chatbot');
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const kb = getKnowledgeBase(t, locale);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'bot', content: t('welcome'), timestamp: new Date() }]);
    }
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSendDirect = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: 'user', content: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setTimeout(() => {
      const answer = findBestAnswer(userMsg.content, kb, t('defaultAnswer'));
      setMessages(prev => [...prev, { role: 'bot', content: answer, timestamp: new Date() }]);
      setIsTyping(false);
    }, 600 + Math.random() * 800);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate slight delay for natural feel
    setTimeout(() => {
      const answer = findBestAnswer(userMsg.content, kb, t('defaultAnswer'));
      setMessages(prev => [...prev, { role: 'bot', content: answer, timestamp: new Date() }]);
      setIsTyping(false);
    }, 600 + Math.random() * 800);
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-brand-600 text-white p-4 rounded-full shadow-lg hover:bg-brand-700 transition-all hover:scale-105 group"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-4rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-brand-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">{t('title')}</p>
                <p className="text-xs text-white/70">{t('subtitle')}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick actions */}
          {messages.length <= 1 && (
            <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <p className="text-xs text-gray-500 mb-2">{t('quickQuestions')}</p>
              <div className="flex flex-wrap gap-1.5">
                {[t('quick1'), t('quick2'), t('quick3'), t('quick4')].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendDirect(q)}
                    className="text-xs px-3 py-1.5 bg-brand-50 text-brand-700 rounded-full hover:bg-brand-100 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'bot' && (
                  <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-4 w-4 text-brand-600" />
                  </div>
                )}
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2 items-start">
                <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-brand-600" />
                </div>
                <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
            <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={t('inputPlaceholder')}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="bg-brand-600 text-white p-2 rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
