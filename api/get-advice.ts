import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";
import { FormState, EmissionResults, User, HeatingType } from '../types';

const getHeatingUnit = (heatingType: HeatingType): string => {
    switch (heatingType) {
        case HeatingType.GAS:
        case HeatingType.BIOMASS:
            return 'kg';
        case HeatingType.OIL:
            return 'Liters';
        case HeatingType.ELECTRIC:
            return 'kWh';
        default:
            return '';
    }
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API_KEY environment variable is not set in Vercel.");
        return response.status(500).json({ error: "Server configuration error: API key not found." });
    }
    const ai = new GoogleGenAI({ apiKey });

    try {
        const { formData, results, user } = request.body as {
            formData: FormState;
            results: EmissionResults;
            user: User;
        };

        if (!formData || !results || !user?.name) {
            return response.status(400).json({ error: 'Missing required payload data.' });
        }

        const highestEmissionCategory = results.breakdown.reduce((max, item) => item.value > max.value ? item : max, results.breakdown[0]);
        const heatingUnit = getHeatingUnit(formData.heating.type);

        const systemInstruction = `You are an expert environmental advisor named 'Eco'. Your goal is to provide personalized, actionable advice to Indian users about their carbon footprint. Your tone should be friendly, encouraging, helpful, supportive, and motivational. Always structure your responses in clear markdown as requested.`;
        
        const userPrompt = `
My name is ${user.name}, and I'm from India. I've calculated my personal carbon footprint and need a personalized action plan. Please analyze my data and generate a response based on the required structure.

**My Data:**
- **Monthly Electricity Consumption:** ${formData.electricity} kWh
- **Primary Heating Source:** ${formData.heating.type} (${formData.heating.value} ${heatingUnit}/month)
- **Transportation:** ${formData.transport.vehicleType} (${formData.transport.fuelType || 'N/A'}), ${formData.transport.distance} km/month
- **Weekly Diet (servings):** Red Meat: ${formData.diet.redMeat}, Poultry: ${formData.diet.poultry}, Fish: ${formData.diet.fish}, Dairy: ${formData.diet.dairy}, Plant-Based: ${formData.diet.plantBased}
- **Monthly Spending (in ₹):** Clothing: ₹${formData.spending.clothing}, Electronics: ₹${formData.spending.electronics}, Furniture: ₹${formData.spending.furniture}, Entertainment: ₹${formData.spending.entertainment}, Other: ₹${formData.spending.other}
- **Monthly Waste:** ${formData.waste} kg

**My Calculated Footprint:**
- **Total Annual Emissions:** ${results.totalAnnual} kg CO2e
- **Highest Emission Category:** ${highestEmissionCategory.name} (${highestEmissionCategory.value.toFixed(2)} kg CO2e)
- **Trees to Plant Annually to Offset:** ${results.treesToPlant}

**Required Response Structure:**
Generate a response with the following exact markdown structure:

### Hi ${user.name}, Here's Your Footprint Summary!
(A positive summary of my annual footprint, with a simple real-world equivalence.)

### Your Biggest Opportunity: ${highestEmissionCategory.name}
(A brief, non-judgmental explanation of why this is my highest emission category.)

### Your Personal Action Plan
(A list of 3-4 specific, actionable tips for my highest category, tailored to India.)

### Quick Wins in Other Areas
(One or two easy tips for other categories, with an Indian context.)

### The Bigger Picture
(An inspiring conclusion about my positive impact and the significance of planting ${results.treesToPlant} trees.)
        `;
        
        const genAIResponse = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
            },
        });

        const adviceText = genAIResponse.text;

        return response.status(200).json({ advice: adviceText });

    } catch (error: any) {
        console.error("Error in Vercel function:", error);
        return response.status(500).json({ error: "An internal error occurred while generating advice." });
    }
}