import { FormState, EmissionResults, User } from '../types';

export const getPersonalizedAdvice = async (formData: FormState, results: EmissionResults, user: User): Promise<string> => {
    try {
        const response = await fetch('/.netlify/functions/get-advice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ formData, results, user }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response from server.' }));
            throw new Error(errorData.error || 'An unknown error occurred on the server.');
        }

        const data = await response.json();
        return data.advice;

    } catch (error) {
        console.error("Error calling serverless function:", error);
        const highestEmissionCategory = results.breakdown.reduce((max, item) => item.value > max.value ? item : max, results.breakdown[0]);
        return "Sorry, I couldn't generate personalized advice at the moment. However, a great first step is to focus on reducing your largest emission source: " + highestEmissionCategory.name + ".";
    }
};
