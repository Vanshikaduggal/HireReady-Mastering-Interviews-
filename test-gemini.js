// Test script to verify Gemini API key and list available models
const API_KEY = "AIzaSyAKVjdQtIQzOvskW7YZeLgleQwjwqmcLLg";

async function testAPIKey() {
  console.log("🔍 Testing Gemini API Key...\n");

  try {
    // Test with a simple request to gemini-pro
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Say hello",
                },
              ],
            },
          ],
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("✅ API Key is VALID!");
      console.log("📝 Response:", data.candidates[0].content.parts[0].text);
    } else {
      const error = await response.text();
      console.log("❌ API Key test failed:");
      console.log("Status:", response.status);
      console.log("Error:", error);
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }

  console.log("\n---\n");

  // List available models
  try {
    console.log("📋 Listing available models...\n");
    const modelsResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );

    if (modelsResponse.ok) {
      const modelsData = await modelsResponse.json();
      console.log("✅ Available models:");
      modelsData.models
        .filter((model) => model.supportedGenerationMethods.includes("generateContent"))
        .forEach((model) => {
          console.log(`  - ${model.name.replace("models/", "")}`);
        });
    } else {
      const error = await modelsResponse.text();
      console.log("❌ Failed to list models:");
      console.log("Status:", modelsResponse.status);
      console.log("Error:", error);
    }
  } catch (error) {
    console.log("❌ Error listing models:", error.message);
  }
}

testAPIKey();
