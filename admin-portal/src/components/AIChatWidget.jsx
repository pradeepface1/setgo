
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User } from 'lucide-react';

const AIChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hi! I'm your Setgo AI Assistant. Ask me about compliance, reports, or driver status.", sender: 'ai' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMessage = { id: Date.now(), text: inputText, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsTyping(true);

        // Simulate AI response delay
        setTimeout(() => {
            const lowerInput = userMessage.text.toLowerCase();
            let responseText = "I'm still learning! Try asking about 'reports', 'drivers', or 'status'.";

            if (lowerInput.includes('report') || lowerInput.includes('analytics')) {
                responseText = "You can view detailed reports in the 'Reports' section. I can help generate a summary of total KMs and expenses.";
            } else if (lowerInput.includes('driver')) {
                responseText = "To add a new driver, go to the Drivers page and click 'Add Driver'. Need help finding a specific driver?";
            } else if (lowerInput.includes('status') || lowerInput.includes('trip')) {
                responseText = "You can filter trips by status (Pending, Assigned, Completed) on the Dashboard or Trips page.";
            } else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
                responseText = "Hello! How can I assist you with your transport operations today?";
            }

            setMessages(prev => [...prev, { id: Date.now() + 1, text: responseText, sender: 'ai' }]);
            setIsTyping(false);
        }, 1000);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white rounded-2xl shadow-2xl w-80 sm:w-96 mb-4 overflow-hidden border border-gray-100 flex flex-col transition-all duration-300 ease-in-out h-[500px]">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-jubilant-600 to-jubilant-500 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <Bot className="h-6 w-6" />
                            <div>
                                <h3 className="font-semibold text-sm">Setgo AI Assistant</h3>
                                <p className="text-xs text-jubilant-100 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                    Online
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4 scrollbar-thin scrollbar-thumb-gray-200">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex items-end gap-2 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-jubilant-100 text-jubilant-600'
                                        }`}>
                                        {msg.sender === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                                    </div>
                                    <div className={`p-3 rounded-2xl text-sm ${msg.sender === 'user'
                                        ? 'bg-jubilant-600 text-white rounded-br-none'
                                        : 'bg-white border border-gray-100 text-gray-700 shadow-sm rounded-bl-none'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="flex items-end gap-2">
                                    <div className="w-6 h-6 rounded-full bg-jubilant-100 text-jubilant-600 flex items-center justify-center shrink-0">
                                        <Bot className="h-3 w-3" />
                                    </div>
                                    <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-gray-100">
                        <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2 border border-gray-200 focus-within:ring-2 focus-within:ring-jubilant-500 focus-within:border-transparent transition-all">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask me anything..."
                                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputText.trim() || isTyping}
                                className={`p-1.5 rounded-full transition-all ${inputText.trim() && !isTyping
                                    ? 'bg-jubilant-600 text-white hover:scale-105 shadow-md'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="mt-2 text-center">
                            <p className="text-[10px] text-gray-400">AI can make mistakes. Check important info.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* custom AI Capsule Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-full shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 bg-white border-2 border-transparent bg-clip-padding ${isOpen ? 'bg-gray-800 text-white border-gray-800' : ''
                    }`}
                style={!isOpen ? {
                    backgroundImage: 'linear-gradient(white, white), linear-gradient(to right, #06b6d4, #10b981, #eab308)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box'
                } : {}}
            >
                {isOpen ? (
                    <X className="h-6 w-6" />
                ) : (
                    <>
                        <Sparkles className="h-5 w-5 text-gray-900 fill-gray-900" />
                        <span className="text-lg font-bold text-gray-900">AI</span>
                    </>
                )}
            </button>
        </div>
    );
};

export default AIChatWidget;
