import * as GAI from "@google/generative-ai"
import config from "../config.js";
import fs from "fs";

const safetySettings = [
    {
        category: GAI.HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: GAI.HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: GAI.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: GAI.HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: GAI.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: GAI.HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: GAI.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: GAI.HarmBlockThreshold.BLOCK_NONE,
    },
];

const genAI = new GAI.GoogleGenerativeAI(config.GEMINI_KEY);

const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro", safetySettings });

let aiCache = {
    sums: {}
}

export function initAI() {
    if (!fs.existsSync("cache2/ai-cache.json")) {
        fs.writeFileSync("cache2/ai-cache.json", JSON.stringify(aiCache))
    } else {
        aiCache = JSON.parse(fs.readFileSync("cache2/ai-cache.json", "utf8"))
    }
}

const delay = (delayInms) => {
    return new Promise(resolve => setTimeout(resolve, delayInms));
};

export function saveCache() {
    fs.writeFile("cache2/ai-cache.json", JSON.stringify(aiCache), () => { })
}

export async function sumTitle(title) {
    let result = ""
    if (aiCache.sums[title]) {
        result = aiCache.sums[title]
    } else {
        try {
            let genResult = await model.generateContent([`Make this shorter and concise, keep it in Thai language: ${title}`])
            result = genResult.response.text()
            aiCache.sums[title] = result
            saveCache()
        } catch (err) {
            console.error(err)
        }

        await delay(2100)

    }

    result = result.trim().replaceAll("\n", "")

    return result
}

// Make this short and concise, keep it in Thai Language