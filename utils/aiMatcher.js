const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Initialize Gemini
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

/**
 * Calculates matching percentage between user skills and job requirements.
 * Falls back to local matching if Gemini is not available.
 */
async function calculateMatch(userSkills, jobRequirements) {
    if (!jobRequirements || !userSkills || userSkills.length === 0) return { percentage: 0, reasoning: "No skills or requirements provided." };

    // If Gemini is configured, use it for semantic matching
    if (model) {
        try {
            const prompt = `
                You are an expert HR recruitment AI. 
                Task: Compare the User's Skills with the Job Requirements.
                
                User Skills: ${Array.isArray(userSkills) ? userSkills.join(', ') : userSkills}
                Job Requirements: ${jobRequirements}
                
                Analyze semantic similarities (e.g., "Node.js" matches "JavaScript Backend").
                Provide:
                1. A matching percentage (0-100) based on how well the user fits the role.
                2. A brief 1-sentence reasoning in simple language.
                
                Return ONLY a JSON object in this format:
                { "percentage": 85, "reasoning": "User has strong experience in the core technologies required." }
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            // Extract JSON from response (sometimes Gemini wraps it in code blocks)
            const jsonMatch = text.match(/\{.*\}/s);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                return {
                    percentage: Math.min(Math.max(data.percentage, 0), 100),
                    reasoning: data.reasoning
                };
            }
        } catch (error) {
            console.error("Gemini AI Match Error:", error.message);
            // Fallback to local matching on error
        }
    }

    // Fallback: Local Keyword Matching (Improved)
    return {
        percentage: localMatch(userSkills, jobRequirements),
        reasoning: "Matched based on keyword analysis (AI currently unavailable)."
    };
}

/**
 * Improved keyword matching logic
 */
function localMatch(userSkills, jobRequirements) {
    const reqs = jobRequirements.toLowerCase().split(/[,\n.]/).map(s => s.trim()).filter(s => s.length > 2);
    const user = userSkills.map(s => s.toLowerCase().trim());

    let matchCount = 0;
    reqs.forEach(req => {
        if (user.some(u => u === req)) {
            matchCount += 1;
        } else if (user.some(u => u.includes(req) || req.includes(u))) {
            matchCount += 0.5;
        }
    });

    const percentage = (matchCount / Math.max(reqs.length, 1)) * 100;
    return Math.min(Math.round(percentage), 100);
}

module.exports = { calculateMatch };
