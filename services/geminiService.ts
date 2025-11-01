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

export const getPersonalizedAdvice = async (formData: FormState, results: EmissionResults, user: User): Promise<string> => {
    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            throw new Error("API_KEY environment variable not configured.");
        }
        const ai = new GoogleGenAI({ apiKey });

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
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
        });

        const advice = response.text;
        if (!advice) {
            throw new Error("Received an empty response from the Gemini API.");
        }
        return advice;

    } catch (error) {
        console.error("Error getting personalized advice from Gemini:", error);
        const highestEmissionCategory = results.breakdown.reduce((max, item) => item.value > max.value ? item : max, results.breakdown[0]);
        return "Sorry, I couldn't generate personalized advice at the moment. However, a great first step is to focus on reducing your largest emission source: " + highestEmissionCategory.name + ".";
    }
};