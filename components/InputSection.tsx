
import React from 'react';

interface InputSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}

const InputSection: React.FC<InputSectionProps> = ({ title, icon, children }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center mb-4">
                {icon}
                <h2 className="text-xl font-semibold text-gray-700 ml-3">{title}</h2>
            </div>
            <div>
                {children}
            </div>
        </div>
    );
};

export default InputSection;
