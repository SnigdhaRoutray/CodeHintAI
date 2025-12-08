
// Backend server for CodeHintAI- communicates with Ollama to generate hints.

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import { makePrompt } from './prompt_templates.js';
import { postFilter } from './filters.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());


const OLLAMA_URL = "http://localhost:11434/api/generate";

app.post("/generate_hint", async (req, res) => {
    try {
        const { title, text, level, attempt } = req.body;

        const prompt = makePrompt(level, title, text, attempt);

        const response = await fetch(OLLAMA_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "mistral",
                prompt: prompt,
                stream: false
            })
        });

        const data = await response.json();

        let hint = "";
        if (data?.response) hint = data.response;
        else if (Array.isArray(data?.choices) && data.choices[0]?.text) hint = data.choices[0].text;
        else if (data?.output) hint = data.output;
        else hint = JSON.stringify(data).slice(0, 500); 

        hint = postFilter(hint, level);

        res.json({ hint });

    } catch (error) {
        console.error("Error generating hint:", error);
        res.status(500).json({ error: "Failed to generate hint", details: String(error) });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(` CodeHintAI backend running on http://localhost:${PORT}`);
});
