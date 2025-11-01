import { FormState, EmissionResults, User } from '../types';

export const getPersonalizedAdvice = async (formData: FormState, results: EmissionResults, user: User): Promise<string> => {
    try {
        // This will call the serverless function (Vercel or Netlify) which securely handles the API key.
        const response = await fetch('/api/get-advice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ formData, results, user }),
        });

        if (!response.ok) {
            let errorMessage = `API request failed with status ${response.status}`;
            try {
                const errorBody = await response.json();
                if (errorBody.error) {
                    errorMessage = errorBody.error;
                }
            } catch {
                // The response body was not JSON, ignore and use the status-based message.
            }
            throw new Error(errorMessage);
        }

        const data = await response.json() as { advice?: string };
        
        if (!data.advice) {
            throw new Error("Received an empty 'advice' field from the API.");
        }
        
        return data.advice;

    } catch (error) {
        console.error("Error getting personalized advice:", error);
        const highestEmissionCategory = results.breakdown.reduce((max, item) => item.value > max.value ? item : max, results.breakdown[0]);
        return "Sorry, I couldn't generate personalized advice at the moment. However, a great first step is to focus on reducing your largest emission source: " + highestEmissionCategory.name + ".";
    }
};