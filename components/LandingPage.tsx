import React, { useState, useEffect } from 'react';
import { User, Session } from '../types';
import { Leaf, Mail, User as UserIcon, History, Trash2 } from 'lucide-react';

interface LandingPageProps {
    onStart: (data: User | Session) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [history, setHistory] = useState<Session[]>([]);

    useEffect(() => {
        try {
            const savedHistoryRaw = localStorage.getItem('carbonTrackerHistory');
            if (savedHistoryRaw) {
                const savedHistory = JSON.parse(savedHistoryRaw);
                // Add validation to filter out malformed entries from older versions
                if (Array.isArray(savedHistory)) {
                    const validHistory = savedHistory.filter(item => 
                        item && typeof item === 'object' && 
                        item.id && 
                        item.user && typeof item.user.name === 'string' &&
                        item.results && typeof item.results.totalAnnual === 'number' &&
                        item.timestamp
                    );
                    setHistory(validHistory);
                    // Optional: update localStorage with cleaned data if any invalid entries were found
                    if (validHistory.length !== savedHistory.length) {
                        localStorage.setItem('carbonTrackerHistory', JSON.stringify(validHistory));
                    }
                }
            }
        } catch (e) {
            console.error("Failed to parse history from localStorage", e);
            localStorage.removeItem('carbonTrackerHistory');
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email) {
            setError('Please enter both your name and email.');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        setError('');
        onStart({ name, email });
    };

    const handleClearHistory = () => {
        if (window.confirm("Are you sure you want to clear all previous calculations? This cannot be undone.")) {
            localStorage.removeItem('carbonTrackerHistory');
            setHistory([]);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-green-50">
            <main className="flex-grow flex items-center justify-center p-4">
                <div className="w-full max-w-lg space-y-8">
                    <div className="p-8 bg-white rounded-2xl shadow-xl animate-fade-in">
                        <div className="text-center">
                            <Leaf className="w-16 h-16 mx-auto text-green-600" />
                            <h1 className="mt-4 text-3xl font-bold text-gray-800">Welcome!</h1>
                            <p className="mt-2 text-gray-600">Enter your details to start a new calculation or reload a previous one.</p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Your Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                    aria-label="Your Name"
                                />
                            </div>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    placeholder="Your Email ID"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                    aria-label="Your Email ID"
                                />
                            </div>
                            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                            <div>
                                <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-green-700 disabled:bg-gray-400 transition-transform transform hover:scale-105">
                                    Start New Calculation
                                </button>
                            </div>
                        </form>
                    </div>

                    {history.length > 0 && (
                        <div className="p-8 bg-white rounded-2xl shadow-xl animate-fade-in">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center">
                                    <History className="w-6 h-6 mr-2 text-green-600"/>
                                    <h2 className="text-2xl font-bold text-gray-800">Calculation History</h2>
                                </div>
                                <button onClick={handleClearHistory} title="Clear History" className="flex items-center text-sm text-red-500 hover:text-red-700 transition p-2 rounded-md hover:bg-red-50">
                                    <Trash2 className="w-4 h-4 mr-1"/> Clear
                                </button>
                            </div>
                            <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                {history.map(session => (
                                    <li key={session.id} className="p-4 border border-gray-200 rounded-lg flex justify-between items-center hover:bg-green-50 transition">
                                        <div>
                                            <p className="font-semibold text-gray-800">{session.user.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(session.timestamp).toLocaleString()}
                                            </p>
                                            <p className="text-sm text-gray-600 font-medium mt-1">
                                                Annual Footprint: {session.results.totalAnnual} kg CO2e
                                            </p>
                                        </div>
                                        <button onClick={() => onStart(session)} className="bg-green-100 text-green-700 font-semibold py-2 px-4 rounded-lg hover:bg-green-200 transition">
                                            Reload
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </main>
            <footer className="text-center p-4 text-gray-500 text-sm">
                Copyright @ Subhadip Chandra
            </footer>
        </div>
    );
};

export default LandingPage;