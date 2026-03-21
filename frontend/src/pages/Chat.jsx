// src/pages/Chat.jsx
import { useEffect, useRef, useState } from 'react';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const CHANNELS = [
  { id: 'general', label: 'general', desc: 'Company-wide updates' },
  { id: 'engineering', label: 'engineering', desc: 'Tech discussions' },
  { id: 'design', label: 'design', desc: 'Design reviews' },
  { id: 'product', label: 'product', desc: 'Roadmap & features' },
  { id: 'random', label: 'random', desc: 'Off-topic fun 🎉' },
];

const AV = ['from-blue-500 to-indigo-600','from-violet-500 to-pink-600','from-amber-500 to-orange-600','from-emerald-500 to-teal-600','from-rose-500 to-red-600'];

export default function Chat() {
  const { user, workspace } = useAuth();
  const { socket, joinChannel, emitMessage, emitTyping } = useSocket();
  const [channel, setChannel] = useState('general');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  // Load messages when channel changes
  useEffect(() => {
    setLoading(true);
    api.get(`/chat/${channel}`)
      .then(r => setMessages(r.data.data || []))
      .finally(() => setLoading(false));

    if (workspace?._id) joinChannel(workspace._id, channel);
  }, [channel, workspace]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const onMsg = (msg) => {
      if (msg.channel === channel) setMessages(prev => [...prev, msg]);
    };
    const onTyping = ({ user: u, channel: ch, isTyping }) => {
      if (ch !== channel || u.name === user?.name) return;
      setTyping(prev => isTyping
        ? [...prev.filter(t => t !== u.name), u.name]
        : prev.filter(t => t !== u.name)
      );
    };
    const onReaction = ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
    };

    socket.on('chat:message', onMsg);
    socket.on('typing:update', onTyping);
    socket.on('chat:reaction', onReaction);
    return () => {
      socket.off('chat:message', onMsg);
      socket.off('typing:update', onTyping);
      socket.off('chat:reaction', onReaction);
    };
  }, [socket, channel, user]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!workspace?._id) return;
    emitTyping(workspace._id, channel, true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(workspace._id, channel, false), 1500);
  };

  const send = async () => {
    if (!text.trim()) return;
    const t = text; setText('');
    emitMessage(workspace?._id, channel, t);
    // Also save via REST as fallback
    try { await api.post(`/chat/${channel}`, { text: t }); } catch {}
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const react = async (msgId, emoji) => {
    try { await api.post(`/chat/messages/${msgId}/react`, { emoji }); } catch {}
  };

  return (
    <div className="flex h-[calc(100vh-130px)] bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden">
      {/* Sidebar */}
      <div className="w-56 border-r border-white/[0.06] flex flex-col flex-shrink-0">
        <div className="px-4 py-3.5 border-b border-white/[0.06] font-display font-bold text-sm">Channels</div>
        <div className="flex-1 overflow-y-auto py-2 px-2">
          {CHANNELS.map(ch => (
            <button key={ch.id} onClick={() => setChannel(ch.id)}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-[13px] transition-all mb-0.5 ${channel === ch.id ? 'bg-blue-500/[0.12] text-blue-300' : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]'}`}>
              <span className="text-gray-600">#</span>
              <span className="flex-1 truncate">{ch.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-2">
          <span className="text-gray-500 font-bold">#</span>
          <span className="font-display font-bold text-sm">{channel}</span>
          <span className="text-xs text-gray-600 ml-1">{CHANNELS.find(c => c.id === channel)?.desc}</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading && <div className="text-center text-gray-600 text-sm py-8">Loading…</div>}
          {!loading && messages.length === 0 && (
            <div className="text-center py-16 text-gray-600">
              <div className="text-4xl mb-3 opacity-40">💬</div>
              <div className="font-display font-bold text-gray-500 mb-1">#{channel}</div>
              <div className="text-sm">First message in this channel — say hello!</div>
            </div>
          )}
          {messages.map((msg, i) => {
            const isMe = msg.author?.name === user?.name || msg.author === user?._id;
            const grad = AV[i % AV.length];
            return (
              <div key={msg._id || i} className="flex gap-3 group">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5`}>
                  {msg.author?.initials || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-[13px] font-semibold">{msg.author?.name || 'Unknown'}</span>
                    {isMe && <span className="text-[10px] text-blue-400 font-medium">You</span>}
                    <span className="text-[11px] text-gray-600">{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                  <div className="text-[13.5px] text-gray-300 leading-relaxed break-words">{msg.text}</div>
                  {/* Reactions */}
                  {msg.reactions?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {msg.reactions.map(r => (
                        <button key={r.emoji} onClick={() => react(msg._id, r.emoji)}
                          className="flex items-center gap-1 px-2 py-0.5 bg-white/[0.05] border border-white/[0.08] rounded-full text-xs hover:bg-white/[0.09] transition-all">
                          {r.emoji} <span className="text-gray-400">{r.users?.length || 0}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Quick react (hover) */}
                  <div className="flex gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {['👍','🎉','🔥','❤️','😄'].map(e => (
                      <button key={e} onClick={() => react(msg._id, e)}
                        className="text-xs px-1.5 py-0.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all">
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          {/* Typing indicator */}
          {typing.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="flex gap-0.5">
                {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
              </div>
              {typing.join(', ')} {typing.length === 1 ? 'is' : 'are'} typing…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 pb-5">
          <div className="flex items-end gap-2 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 focus-within:border-blue-500/40 transition-all">
            <textarea value={text} onChange={handleTyping} onKeyDown={handleKey}
              placeholder={`Message #${channel}…`} rows={1}
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-600 resize-none max-h-32" />
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {['😊', '📎', '@'].map(ic => (
                <button key={ic} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-300 rounded-lg hover:bg-white/[0.06] transition-all text-sm">{ic}</button>
              ))}
              <button onClick={send}
                className="w-8 h-8 bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg flex items-center justify-center text-white text-sm hover:shadow-[0_0_16px_rgba(59,130,246,0.4)] transition-all">
                ➤
              </button>
            </div>
          </div>
          <p className="text-[11px] text-gray-700 mt-1.5 px-1">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
