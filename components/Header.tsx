
import React from 'react';
import { Leaf } from 'lucide-react';

const Header: React.FC = () => {
    return (
        <header className="bg-white shadow-md">
            <div className="container mx-auto px-4 py-4 flex items-center">
                <Leaf className="w-10 h-10 text-green-600" />
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 ml-3">
                    Personal Carbon Footprint Tracker
                </h1>
            </div>
        </header>
    );
};

export default Header;
