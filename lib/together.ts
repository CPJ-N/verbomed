import Together from 'together-ai';

export const together = new Together({
    apiKey: process.env.TOGETHER_API_KEY,
    baseURL: "https://together.helicone.ai/v1",
    defaultHeaders: {
        "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    },
});