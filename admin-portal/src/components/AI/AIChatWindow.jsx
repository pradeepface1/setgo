import React, { useState } from 'react';
import axios from 'axios';
import { Send, Bot, User, Sparkles } from 'lucide-react';

const AIChatWindow = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'system', content: 'Hello! I am your SetGo AI Assistant. How can I help you manage your fleet today?' }
    ]);
    const [loading, setLoading] = useState(false);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // Get token from localStorage
            const token = localStorage.getItem('token');

            const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai/query`, {
                prompt: input,
                context: "User is an admin on the SetGo platform." // You can expand this with real data later
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const aiMessage = { role: 'system', content: res.data.response };
            setMessages(prev => [...prev, aiMessage]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'system', content: "Sorry, I encountered an error connecting to the AI service." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 flex items-center gap-3 text-white">
                <Sparkles size={24} />
                <div>
                    <h2 className="font-bold text-lg">SetGo AI Assistant</h2>
                    <p className="text-xs text-blue-100 opacity-80">Powered by Gemini Pro</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-300' : 'bg-blue-100 text-blue-600'}`}>
                            {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>
                        <div className={`p-3 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <Bot size={16} className="animate-pulse" />
                        </div>
                        <div className="bg-white p-3 rounded-2xl border border-slate-100">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about trips, drivers, or optimization..."
                    className="flex-1 border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default AIChatWindow;
