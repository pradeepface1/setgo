import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { aiService } from '../services/api';

const AIChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { text: "Hello! I'm your AI Admin Assistant. How can I help you manage SetGo today?", sender: 'ai' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
        setIsLoading(true);

        try {
            // Call AI Service
            const response = await aiService.query(userMessage, "User is asking about general platform usage.");

            // Add AI Response
            setMessages(prev => [...prev, { text: response.response, sender: 'ai' }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { text: "I'm having trouble connecting to the AI brain right now. Please try again later.", sender: 'ai' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[2000] flex flex-col items-end font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 md:w-96 h-[500px] max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white/20 rounded-full">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">AI Admin Assistant</h3>
                                <p className="text-xs text-blue-100 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    Online
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-indigo-100' : 'bg-blue-100'
                                    }`}>
                                    {msg.sender === 'user' ? <User size={14} className="text-indigo-600" /> : <Bot size={14} className="text-blue-600" />}
                                </div>
                                <div className={`p-3 rounded-2xl text-sm ${msg.sender === 'user'
                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                    : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-2 self-start max-w-[85%]">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                    <Bot size={14} className="text-blue-600" />
                                </div>
                                <div className="p-3 rounded-2xl rounded-tl-none bg-white border border-gray-100 shadow-sm flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything..."
                            className="flex-1 bg-gray-50 text-sm border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </form>
                </div>
            )}

            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105 ${isOpen
                    ? 'bg-gray-100 text-gray-600 rotate-90'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white animate-bounce-slow'
                    }`}
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </button>
        </div>
    );
};

export default AIChatWidget;
