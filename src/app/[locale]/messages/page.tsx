'use client';

import { useTranslations } from 'next-intl';
import { Search, Send, ChevronLeft, MapPin, Clock } from 'lucide-react';
import { useState } from 'react';

// Mock data
const mockConversations = [
  {
    id: '1',
    user: { id: 'u1', firstName: 'Luc', lastName: 'Gagnon', profileImage: null },
    lastMessage: { content: 'Parfait, je serai au métro Berri à 8h!', createdAt: '2026-05-12T10:30:00', isRead: false },
    trip: { originCity: 'Montréal', destinationCity: 'Québec' },
    unread: 2,
  },
  {
    id: '2',
    user: { id: 'u2', firstName: 'Sophie', lastName: 'Bergeron', profileImage: null },
    lastMessage: { content: 'Merci pour le trajet, c\'était super!', createdAt: '2026-05-11T18:00:00', isRead: true },
    trip: { originCity: 'Ottawa', destinationCity: 'Montréal' },
    unread: 0,
  },
  {
    id: '3',
    user: { id: 'u3', firstName: 'Ahmed', lastName: 'Hassan', profileImage: null },
    lastMessage: { content: 'Est-ce que vous avez de la place pour un bagage moyen?', createdAt: '2026-05-10T14:20:00', isRead: true },
    trip: { originCity: 'Toronto', destinationCity: 'Ottawa' },
    unread: 0,
  },
];

const mockMessages = [
  { id: 'm1', senderId: 'u1', content: 'Bonjour! Est-ce que le trajet Montréal-Québec de demain est toujours dispo?', createdAt: '2026-05-12T09:00:00' },
  { id: 'm2', senderId: 'me', content: 'Oui, il reste 2 places! Vous voulez réserver?', createdAt: '2026-05-12T09:15:00' },
  { id: 'm3', senderId: 'u1', content: 'Oui, pour 1 place svp. Où est le point de rendez-vous?', createdAt: '2026-05-12T09:30:00' },
  { id: 'm4', senderId: 'me', content: 'Je passe au métro Berri-UQAM, sortie Saint-Denis, à 8h00 pile.', createdAt: '2026-05-12T10:00:00' },
  { id: 'm5', senderId: 'u1', content: 'Parfait, je serai au métro Berri à 8h!', createdAt: '2026-05-12T10:30:00' },
];

export default function MessagesPage() {
  const t = useTranslations('messages');
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const getInitials = (first: string, last: string) =>
    `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = diff / (1000 * 60 * 60);
    if (hours < 24) return d.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
    if (hours < 48) return 'Hier';
    return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
  };

  const selected = mockConversations.find((c) => c.id === selectedConvo);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: '70vh' }}>
        <div className="flex h-full">
          {/* Conversation List */}
          <div className={`w-full md:w-96 border-r border-gray-100 flex flex-col ${selectedConvo ? 'hidden md:flex' : 'flex'}`}>
            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {mockConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
                  <Send className="w-12 h-12 mb-3 opacity-30" />
                  <p>{t('noConversations')}</p>
                </div>
              ) : (
                mockConversations.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => setSelectedConvo(convo.id)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 ${
                      selectedConvo === convo.id ? 'bg-brand-50' : ''
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold">
                        {getInitials(convo.user.firstName, convo.user.lastName)}
                      </div>
                      {convo.unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-maple-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                          {convo.unread}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`font-medium ${convo.unread > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                          {convo.user.firstName} {convo.user.lastName}
                        </p>
                        <span className="text-xs text-gray-400 shrink-0">{formatTime(convo.lastMessage.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {convo.trip.originCity} → {convo.trip.destinationCity}
                      </p>
                      <p className={`text-sm mt-1 truncate ${convo.unread > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                        {convo.lastMessage.content}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${selectedConvo ? 'flex' : 'hidden md:flex'}`}>
            {selected ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                  <button onClick={() => setSelectedConvo(null)} className="md:hidden p-1 hover:bg-gray-100 rounded-lg">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold">
                    {getInitials(selected.user.firstName, selected.user.lastName)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selected.user.firstName} {selected.user.lastName}</p>
                    <p className="text-xs text-gray-400">{selected.trip.originCity} → {selected.trip.destinationCity}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {mockMessages.map((msg) => {
                    const isMine = msg.senderId === 'me';
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                          isMine
                            ? 'bg-brand-600 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${isMine ? 'text-brand-200' : 'text-gray-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t('typeMessage')}
                      className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      onKeyDown={(e) => e.key === 'Enter' && newMessage.trim() && setNewMessage('')}
                    />
                    <button
                      className="px-4 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50"
                      disabled={!newMessage.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <Send className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg">{t('conversations')}</p>
                <p className="text-sm mt-1">{t('noMessages')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
