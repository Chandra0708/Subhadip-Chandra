import React, { useRef, useState } from 'react';
import { EmissionResults, User } from '../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Sprout, Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ResultsSectionProps {
    results: EmissionResults;
    advice: string;
    isLoadingAdvice: boolean;
    user: User;
}

const COLORS = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6', '#6B7280'];

// A custom component for markdown-like rendering
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    return (
        <div className="prose prose-green max-w-none">
            {text.split('\n').map((paragraph, index) => {
                if (paragraph.startsWith('### ')) {
                    return <h3 key={index} className="text-lg font-semibold mt-4 mb-2">{paragraph.substring(4)}</h3>;
                }
                if (paragraph.startsWith('## ')) {
                    return <h2 key={index} className="text-xl font-bold mt-6 mb-3">{paragraph.substring(3)}</h2>;
                }
                if (paragraph.startsWith('# ')) {
                    return <h1 key={index} className="text-2xl font-bold mt-8 mb-4">{paragraph.substring(2)}</h1>;
                }
                if (paragraph.startsWith('* ')) {
                    return <li key={index} className="ml-5 list-disc">{paragraph.substring(2)}</li>;
                }
                if (paragraph.trim() === '') {
                    return <br key={index} />;
                }
                // Bold text handling
                const parts = paragraph.split('**');
                return (
                    <p key={index} className="my-2">
                        {parts.map((part, i) =>
                            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                        )}
                    </p>
                );
            })}
        </div>
    );
};


const ResultsSection: React.FC<ResultsSectionProps> = ({ results, advice, isLoadingAdvice, user }) => {
    const resultsContentRef = useRef<HTMLDivElement>(null);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    const handleDownloadPDF = async () => {
        const input = resultsContentRef.current;
        if (!input) {
            return;
        }

        setIsDownloadingPdf(true);
        try {
            const canvas = await html2canvas(input, {
                scale: 2, // Higher scale for better quality
                backgroundColor: '#ffffff', // Ensure background is white for the canvas
                useCORS: true,
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const imgProps = pdf.getImageProperties(imgData);
            const imgWidth = pdfWidth;
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
            
            let heightLeft = imgHeight;
            let position = 0;
            
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
            
            while (heightLeft > 0) {
                position -= pdfHeight; // Move the image up by the height of one page
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;
            }
            
            pdf.save(`${user.name}-CarbonFootprint.pdf`);

        } catch (error) {
            console.error("Error generating PDF:", error);
            // Optionally, show an error to the user
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    return (
        <section className="mt-12 bg-white rounded-2xl shadow-xl animate-fade-in">
            <div ref={resultsContentRef} className="p-8">
                <h2 className="text-3xl font-bold text-center text-green-700">Your Footprint Results</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mt-8">
                    {/* Stats and Chart */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                            <div className="bg-green-100 p-4 rounded-lg">
                                <p className="text-lg text-gray-600">Monthly Emissions</p>
                                <p className="text-3xl font-bold text-green-800">{results.totalMonthly} <span className="text-base font-normal">kg CO2e</span></p>
                            </div>
                            <div className="bg-green-100 p-4 rounded-lg">
                                <p className="text-lg text-gray-600">Annual Emissions</p>
                                <p className="text-3xl font-bold text-green-800">{results.totalAnnual} <span className="text-base font-normal">kg CO2e</span></p>
                            </div>
                        </div>

                        <div className="h-80 w-full">
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={results.breakdown as any}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={110}
                                        fill="#8884d8"
                                        dataKey="value"
                                        nameKey="name"
                                    >
                                        {results.breakdown.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `${value} kg CO2e`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-6 rounded-lg text-center">
                             <div className="flex items-center justify-center">
                                <Sprout className="w-12 h-12 text-green-600 mr-4"/>
                                <div>
                                    <p className="text-lg">To offset your annual emissions, you should plant approximately</p>
                                    <p className="text-5xl font-extrabold text-green-700 mt-1">{results.treesToPlant}</p>
                                    <p className="text-lg">trees this year.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Advice Section */}
                    <div className="bg-gray-50 p-6 rounded-lg h-full">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Personalized Advice from Gemini</h3>
                        {isLoadingAdvice ? (
                            <div className="flex items-center justify-center h-full">
                                 <div className="flex items-center space-x-2 text-gray-500">
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Generating your personal plan...</span>
                                </div>
                            </div>
                        ) : (
                            <SimpleMarkdown text={advice} />
                        )}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="px-8 pb-8 pt-0">
                <div className="pt-6 border-t border-gray-200 flex items-center justify-center">
                    <button onClick={handleDownloadPDF} disabled={isDownloadingPdf} className="inline-flex items-center justify-center w-full sm:w-auto bg-gray-700 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-gray-800 disabled:bg-gray-500 disabled:cursor-wait transition-all transform hover:scale-105">
                         {isDownloadingPdf ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Downloading...
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5 mr-2" />
                                Download as PDF
                            </>
                        )}
                    </button>
                </div>
            </div>
        </section>
    );
};

export default ResultsSection;