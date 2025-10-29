import React, { useState, useMemo } from 'react';
import { FormState, EmissionResults, VehicleType, FuelType, HeatingType, User } from './types';
import { EMISSION_FACTORS, TRANSPORT_OPTIONS } from './constants';
import { getPersonalizedAdvice } from './services/geminiService';
import Header from './components/Header';
import InputSection from './components/InputSection';
import ResultsSection from './components/ResultsSection';
import LandingPage from './components/LandingPage';
import { Leaf, Bolt, Car, UtensilsCrossed, ShoppingCart, Trash2, Sprout, Flame } from 'lucide-react';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<FormState>({
        electricity: '',
        heating: {
            type: HeatingType.ELECTRIC,
            value: ''
        },
        transport: {
            vehicleType: VehicleType.CAR,
            fuelType: FuelType.PETROL,
            distance: ''
        },
        diet: {
            redMeat: '',
            poultry: '',
            fish: '',
            dairy: '',
            plantBased: ''
        },
        spending: {
            clothing: '',
            electronics: '',
            furniture: '',
            entertainment: '',
            other: ''
        },
        waste: ''
    });

    const [results, setResults] = useState<EmissionResults | null>(null);
    const [advice, setAdvice] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleStart = (userDetails: User) => {
        setUser(userDetails);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const keys = name.split('.');

        if (keys.length === 1) {
            setFormData(prev => ({ ...prev, [name]: value }));
        } else {
            setFormData(prev => ({
                ...prev,
                [keys[0]]: {
                    // @ts-ignore
                    ...prev[keys[0]],
                    [keys[1]]: value
                }
            }));
        }
    };

    const isFormValid = useMemo(() => {
        return formData.electricity && formData.heating.value && formData.transport.distance && formData.waste &&
               formData.spending.clothing && formData.spending.electronics &&
               formData.spending.furniture && formData.spending.entertainment && formData.spending.other &&
               formData.diet.redMeat && formData.diet.poultry && formData.diet.fish && formData.diet.dairy && formData.diet.plantBased;
    }, [formData]);

    const calculateEmissions = (): EmissionResults => {
        const electricity = parseFloat(formData.electricity) || 0;
        const distance = parseFloat(formData.transport.distance) || 0;
        const waste = parseFloat(formData.waste) || 0;

        const electricityEmissions = electricity * EMISSION_FACTORS.electricity;
        
        const heatingValue = parseFloat(formData.heating.value) || 0;
        const heatingFactor = EMISSION_FACTORS.heating[formData.heating.type];
        const heatingEmissions = heatingValue * heatingFactor;

        const { vehicleType } = formData.transport;
        let transportEmissions = 0;
        const transportFactorData = EMISSION_FACTORS.transport[vehicleType];
        if (typeof transportFactorData === 'number') {
            transportEmissions = distance * transportFactorData;
        } else if (transportFactorData && typeof transportFactorData === 'object') {
            const { fuelType } = formData.transport;
            // @ts-ignore
            transportEmissions = distance * transportFactorData[fuelType];
        }

        const dietEmissions = 
            ((parseFloat(formData.diet.redMeat) || 0) * EMISSION_FACTORS.diet.redMeat) +
            ((parseFloat(formData.diet.poultry) || 0) * EMISSION_FACTORS.diet.poultry) +
            ((parseFloat(formData.diet.fish) || 0) * EMISSION_FACTORS.diet.fish) +
            ((parseFloat(formData.diet.dairy) || 0) * EMISSION_FACTORS.diet.dairy) +
            ((parseFloat(formData.diet.plantBased) || 0) * EMISSION_FACTORS.diet.plantBased);

        const spendingEmissions =
            (((parseFloat(formData.spending.clothing) || 0) / 100) * EMISSION_FACTORS.spending.clothing) +
            (((parseFloat(formData.spending.electronics) || 0) / 100) * EMISSION_FACTORS.spending.electronics) +
            (((parseFloat(formData.spending.furniture) || 0) / 100) * EMISSION_FACTORS.spending.furniture) +
            (((parseFloat(formData.spending.entertainment) || 0) / 100) * EMISSION_FACTORS.spending.entertainment) +
            (((parseFloat(formData.spending.other) || 0) / 100) * EMISSION_FACTORS.spending.other);

        const wasteEmissions = waste * EMISSION_FACTORS.waste;

        const totalMonthly = electricityEmissions + heatingEmissions + transportEmissions + dietEmissions + spendingEmissions + wasteEmissions;
        const totalAnnual = totalMonthly * 12;
        const treesToPlant = Math.ceil(totalAnnual / EMISSION_FACTORS.treeSequestration);

        return {
            breakdown: [
                { name: 'Electricity', value: parseFloat(electricityEmissions.toFixed(2)) },
                { name: 'Heating', value: parseFloat(heatingEmissions.toFixed(2)) },
                { name: 'Transport', value: parseFloat(transportEmissions.toFixed(2)) },
                { name: 'Diet', value: parseFloat(dietEmissions.toFixed(2)) },
                { name: 'Spending', value: parseFloat(spendingEmissions.toFixed(2)) },
                { name: 'Waste', value: parseFloat(wasteEmissions.toFixed(2)) },
            ],
            totalMonthly: parseFloat(totalMonthly.toFixed(2)),
            totalAnnual: parseFloat(totalAnnual.toFixed(2)),
            treesToPlant,
        };
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!isFormValid) {
            setError('Please fill in all fields.');
            return;
        }
        setError('');
        setIsLoading(true);
        setResults(null);
        setAdvice('');

        try {
            const calculatedResults = calculateEmissions();
            setResults(calculatedResults);

            if (user) {
                const aiAdvice = await getPersonalizedAdvice(formData, calculatedResults, user);
                setAdvice(aiAdvice);
            }

        } catch (err) {
            console.error(err);
            setError('An error occurred while getting advice. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!user) {
        return <LandingPage onStart={handleStart} />;
    }

    const heatingInputDetails = {
        [HeatingType.GAS]: { placeholder: "e.g., 20", unit: "Amount in kg" },
        [HeatingType.OIL]: { placeholder: "e.g., 30", unit: "Amount in Liters" },
        [HeatingType.ELECTRIC]: { placeholder: "e.g., 150", unit: "Consumption in kWh" },
        [HeatingType.BIOMASS]: { placeholder: "e.g., 50", unit: "Amount in kg" },
    };
    const currentHeatingDetails = heatingInputDetails[formData.heating.type];
    const showFuelType = TRANSPORT_OPTIONS[formData.transport.vehicleType].fuels.length > 0;

    return (
        <div className="bg-green-50 min-h-screen font-sans text-gray-800 flex flex-col">
            <Header />
            <main className="container mx-auto p-4 md:p-8 flex-grow">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <InputSection title="Monthly Electricity" icon={<Bolt className="w-6 h-6 text-yellow-500" />}>
                            <input type="number" name="electricity" value={formData.electricity} onChange={handleInputChange} placeholder="e.g., 300" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                            <p className="text-sm text-gray-500 mt-2">Consumption in kWh</p>
                        </InputSection>
                        
                        <InputSection title="Heating Type" icon={<Flame className="w-6 h-6 text-red-500" />}>
                           <div className="space-y-4">
                                <select name="heating.type" value={formData.heating.type} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition">
                                    {Object.values(HeatingType).map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                                <input type="number" name="heating.value" value={formData.heating.value} onChange={handleInputChange} placeholder={currentHeatingDetails.placeholder} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                                <p className="text-sm text-gray-500 mt-2">{currentHeatingDetails.unit}</p>
                           </div>
                        </InputSection>

                        <InputSection title="Monthly Transport" icon={<Car className="w-6 h-6 text-blue-500" />}>
                            <div className="space-y-4">
                                <select name="transport.vehicleType" value={formData.transport.vehicleType} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition">
                                    {Object.values(VehicleType).map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                                {showFuelType && (
                                     <select name="transport.fuelType" value={formData.transport.fuelType} onChange={handleInputChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition">
                                        {TRANSPORT_OPTIONS[formData.transport.vehicleType].fuels.map(f => <option key={f} value={f}>{f}</option>)}
                                     </select>
                                )}
                                <input type="number" name="transport.distance" value={formData.transport.distance} onChange={handleInputChange} placeholder="e.g., 500" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                                <p className="text-sm text-gray-500 mt-2">Distance in km</p>
                            </div>
                        </InputSection>

                        <InputSection title="Weekly Dietary Habits" icon={<UtensilsCrossed className="w-6 h-6 text-orange-500" />}>
                            <div className="space-y-3">
                                <label className="text-sm font-medium">Red Meat Meals</label>
                                <input type="number" name="diet.redMeat" value={formData.diet.redMeat} onChange={handleInputChange} placeholder="Servings per week" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                                <label className="text-sm font-medium">Poultry Meals</label>
                                <input type="number" name="diet.poultry" value={formData.diet.poultry} onChange={handleInputChange} placeholder="Servings per week" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                                <label className="text-sm font-medium">Fish Meals</label>
                                <input type="number" name="diet.fish" value={formData.diet.fish} onChange={handleInputChange} placeholder="Servings per week" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                                <label className="text-sm font-medium">Dairy Meals/Servings</label>
                                <input type="number" name="diet.dairy" value={formData.diet.dairy} onChange={handleInputChange} placeholder="Servings per week" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                                <label className="text-sm font-medium">Plant-Based Meals</label>
                                <input type="number" name="diet.plantBased" value={formData.diet.plantBased} onChange={handleInputChange} placeholder="Servings per week" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                           </div>
                        </InputSection>

                        <InputSection title="Monthly Purchases" icon={<ShoppingCart className="w-6 h-6 text-purple-500" />}>
                           <div className="space-y-3">
                                <label className="text-sm font-medium">Clothing</label>
                                <input type="number" name="spending.clothing" value={formData.spending.clothing} onChange={handleInputChange} placeholder="Avg. monthly cost (₹)" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                                <label className="text-sm font-medium">Electronics</label>
                                <input type="number" name="spending.electronics" value={formData.spending.electronics} onChange={handleInputChange} placeholder="Avg. monthly cost (₹)" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                                <label className="text-sm font-medium">Furniture</label>
                                <input type="number" name="spending.furniture" value={formData.spending.furniture} onChange={handleInputChange} placeholder="Avg. monthly cost (₹)" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                                <label className="text-sm font-medium">Entertainment</label>
                                <input type="number" name="spending.entertainment" value={formData.spending.entertainment} onChange={handleInputChange} placeholder="Avg. monthly cost (₹)" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                                <label className="text-sm font-medium">Other Goods</label>
                                <input type="number" name="spending.other" value={formData.spending.other} onChange={handleInputChange} placeholder="Avg. monthly cost (₹)" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                           </div>
                        </InputSection>

                        <InputSection title="Monthly Waste" icon={<Trash2 className="w-6 h-6 text-gray-500" />}>
                            <input type="number" name="waste" value={formData.waste} onChange={handleInputChange} placeholder="e.g., 15" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                            <p className="text-sm text-gray-500 mt-2">Waste generated in kg</p>
                        </InputSection>
                    </div>

                    <div className="text-center pt-4">
                        {error && <p className="text-red-500 mb-4">{error}</p>}
                        <button type="submit" disabled={!isFormValid || isLoading} className="inline-flex items-center justify-center bg-green-600 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-transform transform hover:scale-105">
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Calculating...
                                </>
                            ) : (
                                <>
                                    <Sprout className="w-6 h-6 mr-2"/>
                                    Calculate My Footprint
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {results && user && (
                    <ResultsSection 
                        results={results} 
                        advice={advice} 
                        isLoadingAdvice={isLoading && !advice}
                        user={user}
                    />
                )}

            </main>
            <footer className="text-center p-4 text-gray-500 text-sm">
                Copyright @ Subhadip Chandra
            </footer>
        </div>
    );
};

export default App;