/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini SDK with User-Agent header for telemetry as instructed
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Endpoint for AI Configuration Generation
app.post("/api/generate-config", async (req, res) => {
  try {
    const { baseClass, customClass, modPrefix, itemName, category, author } = req.body;

    const systemInstruction = `
You are an expert DayZ mod configurator and script creator.
You build pristine, syntactically correct DayZ "config.cpp" files and RVMAT (.rvmat) descriptions.

Guidelines:
1. Output complete, compilable, syntax-error-free config.cpp code.
2. Ensure you inherit correctly from the appropriate base class based on the chosen category:
   - "clothing": Inherits from standard DayZ items (e.g. "CargoPants_Beige", "GorkaHelmet", "TacticalVest"). Use 'hiddenSelections[]' containing appropriate slots like "zombie", "camoGround", "camoMale", "camoFemale".
   - "weapon": Inherits from vanilla firearms (e.g. "M4A1", "AKM", "SVD"). Ensure 'hiddenSelections[]' is correctly set to "camo" or "zombie" or custom meshes.
   - "vehicle": Inherits from vehicle base classes (e.g. "Offroad_02", "CivilianSedan"). Set textures for doors, hoods, etc.
   - "attachment": Inherits from e.g. "M4_Suppressor", "HuntingOptic".
3. Wrap your answer strictly in clean, copyable code blocks with headings detailing what file the code represents (e.g., config.cpp, custom.rvmat, or config.cpp details). Show the developer how the files are placed relative to their mod's root folder system: "${modPrefix}/data/..."
4. Provide structured, practical advice on converting exported PNGs to Bohemia's proprietary PAA format using "TexView 2" or "Addon Builder" tool.
`;

    const userPrompt = `
Generate a DayZ retexture config for:
- Item Category: ${category}
- Item Name: ${itemName}
- Mod Directory Prefix: ${modPrefix}
- Original Vanilla Parent Class: ${baseClass}
- Custom Desired Class Name: ${customClass}
- Mod Author name: ${author || 'Survivor'}

Please write the complete, clean config.cpp and a sample .rvmat file specifying:
- "${modPrefix}\\data\\${customClass}_co.paa" as the diffuse detail.
- "${modPrefix}\\data\\${customClass}_nohq.paa" as the normal detail.
- "${modPrefix}\\data\\${customClass}_smdi.paa" as the surface material detail index.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.2, // Low temperature for high precision config syntax
      },
    });

    res.json({ configText: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate configuration." });
  }
});

async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
