import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";
import { FormState, EmissionResults, User, HeatingType } from '../types.js';

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

        if (!formData || !results || !user) {
            return response.status(400).json({ error: 'Missing required payload data.' });
        }

        const highestEmissionCategory = results.breakdown.reduce((max, item) => item.value > max.value ? item : max, results.breakdown[0]);
        const heatingUnit = getHeatingUnit(formData.heating.type);

        const prompt = `
            You are an expert environmental advisor named 'Eco' for an Indian user. A user has calculated their personal carbon footprint and needs personalized, actionable advice relevant to India.
            The user's name is ${user.name}.
            Analyze the following data and provide a friendly, encouraging, and helpful response. Structure the response in markdown with clear headings.

            **User's Data (${user.name} - Indian Context):**
            - **Monthly Electricity Consumption:** ${formData.electricity} kWh
            - **Primary Heating Source:** ${formData.heating.type}
            - **Monthly Heating Consumption:** ${formData.heating.value} ${heatingUnit}
            - **Transportation:** ${formData.transport.vehicleType} (${formData.transport.fuelType || 'N/A'}), ${formData.transport.distance} km/month
            - **Weekly Diet (servings per week):**
                - Red Meat: ${formData.diet.redMeat}
                - Poultry: ${formData.diet.poultry}
                - Fish: ${formData.diet.fish}
                - Dairy: ${formData.diet.dairy}
                - Plant-Based: ${formData.diet.plantBased}
            - **Monthly Spending (in ₹):**
                - Clothing: ₹${formData.spending.clothing}
                - Electronics: ₹${formData.spending.electronics}
                - Furniture: ₹${formData.spending.furniture}
                - Entertainment: ₹${formData.spending.entertainment}
                - Other Goods: ₹${formData.spending.other}
            - **Monthly Waste:** ${formData.waste} kg

            **Calculated Footprint:**
            - **Total Annual Emissions:** ${results.totalAnnual} kg CO2e
            - **Highest Emission Category:** ${highestEmissionCategory.name} (${highestEmissionCategory.value.toFixed(2)} kg CO2e)
            - **Trees to Plant Annually to Offset:** ${results.treesToPlant}

            **Your Task:**
            Generate a response with the following structure using markdown:

            ### Hi ${user.name}, Here's Your Footprint Summary!
            Start with a positive and encouraging summary. Mention their annual footprint in kg CO2e and what it's equivalent to in simple terms (e.g., "equivalent to driving a car for X km").

            ### Your Biggest Opportunity: ${highestEmissionCategory.name}
            Explain briefly why this is their highest emission category based on their data. Keep it simple and non-judgmental.

            ### Your Personal Action Plan
            Provide a list of 3-4 specific, actionable, and easy-to-implement tips to reduce emissions.
            - Focus primarily on their highest category (${highestEmissionCategory.name}).
            - Make the tips highly relevant to India (e.g., mention specific Indian brands, government schemes like BEE star ratings for appliances, local food alternatives, or FAME India scheme for EVs).
            - For each tip, use a bolded title.

            ### Quick Wins in Other Areas
            Offer one or two general tips for other categories. Frame them as easy changes they can make. Again, keep the Indian context.

            ### The Bigger Picture
            Conclude with an inspiring message about the positive impact of their actions. Reiterate the significance of planting ${results.treesToPlant} trees and how it contributes to a greener India.

            **Tone:** Be very supportive, friendly, and motivational. Address the user by their name, ${user.name}, at least twice.
        `;
        
        const genAIResponse = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
        });

        const adviceText = genAIResponse.text;

        return response.status(200).json({ advice: adviceText });

    } catch (error: any) {
        console.error("Error in Vercel function:", error);
        return response.status(500).json({ error: "An internal error occurred while generating advice." });
    }
}