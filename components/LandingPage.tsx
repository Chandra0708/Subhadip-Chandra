import React, { useState } from 'react';
import { User } from '../types';
import { Leaf, Mail, User as UserIcon } from 'lucide-react';

interface LandingPageProps {
    onStart: (user: User) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

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

    return (
        <div className="flex flex-col min-h-screen bg-green-50">
            <main className="flex-grow flex items-center justify-center p-4">
                <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl animate-fade-in">
                    <div className="text-center">
                        <Leaf className="w-16 h-16 mx-auto text-green-600" />
                        <h1 className="mt-4 text-3xl font-bold text-gray-800">Welcome!</h1>
                        <p className="mt-2 text-gray-600">Enter your details to start calculating your carbon footprint.</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
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
                                Start Calculating
                            </button>
                        </div>
                    </form>
                </div>
            </main>
            <footer className="text-center p-4 text-gray-500 text-sm">
                Copyright @ Subhadip Chandra
            </footer>
        </div>
    );
};

export default LandingPage;