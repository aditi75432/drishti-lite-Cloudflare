import { getHtml } from './ui.js';
import { extractJson } from './utils.js';

export default {
  async fetch(request, env) {
    if (request.method === "GET") return new Response(getHtml(), { headers: { "Content-Type": "text/html" } });

    if (request.method === "POST") {
      try {
        const { text, source_lang } = await request.json();

        // --- STEP 1: BRIDGE IN (Native -> English) ---
        // We still use AI4Bharat here because it's good at understanding messy input
        let englishText = text;
        const langMap = { 'hindi': 'hin', 'tamil': 'tam', 'telugu': 'tel', 'bengali': 'ben', 'marathi': 'mar', 'kannada': 'kan' };
        const srcCode = langMap[source_lang] || 'eng';

        if (source_lang !== 'english') {
          try {
            const t = await env.AI.run("@cf/ai4bharat/indictrans2-indic-en-1b", {
              text: text, source_lang: srcCode, target_lang: "eng"
            });
            englishText = t.translated_text || text;
          } catch (e) { console.log("Input Bridge Failed"); }
        }

        // --- STEP 2: THE BRAIN (Direct Native Generation) ---
        // Instead of translating later, we force Llama to output the native language NOW.
        
        const systemPrompt = `
          You are an Indian Cyber Safety Expert.
          
          TASK:
          1. Analyze the message for Scams (Urgency/Money/Links) vs Safe (Family/Friends).
          2. Generate a short, urgent warning/advice.
          3. CRITICAL: The 'action' field MUST be written in ${source_lang.toUpperCase()} language.
          
          OUTPUT JSON ONLY:
          {
            "risk_level": "High" or "Low",
            "action": "Advice in ${source_lang} language"
          }
        `;

        const ai = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Message: "${englishText}"` }
          ]
        });

        // Extract the JSON
        const rawData = extractJson(ai.response || JSON.stringify(ai));

        return new Response(JSON.stringify({
          risk_level: rawData.risk_level,
          action_translated: rawData.action // This will now be in Tamil/Hindi directly from Llama
        }));

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }
    return new Response("404");
  }
};


































