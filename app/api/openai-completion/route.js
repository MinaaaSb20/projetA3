import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: "OpenAI API is ready. Use POST to send a prompt." });
}

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION;

    if (!endpoint || !apiKey || !deploymentName) {
      return NextResponse.json({ error: 'Azure OpenAI credentials are not set' }, { status: 500 });
    }

    // Build the Azure OpenAI API URL
    const url = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
    
    console.log(`Making request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are VocalizAI, an expert podcast script writer with years of experience creating engaging, professional scripts for various formats and audiences. Your goal is to help users create podcast scripts that sound natural, engaging, and professionally structured.\n\nWhen creating scripts, follow these guidelines:\n\n1. FORMAT: Structure the script with clear sections including intro, main content with transitions between topics, and outro. Include appropriate notations for music, sound effects, and delivery instructions in [BRACKETS].\n\n2. TONE: Match the user's requested tone exactly (conversational, educational, humorous, professional, etc.). Ensure the language sounds like natural speech rather than written text.\n\n3. PACING: Create scripts that fit the requested duration. For 5-minute scripts, focus on 1-2 key points. For 15-minute scripts, cover 2-3 points with examples. For 30+ minute scripts, include more detailed explanations and possibly segments.\n\n4. AUDIENCE AWARENESS: Tailor vocabulary, examples, and cultural references to the specified target audience.\n\n5. PODCAST ELEMENTS: Include podcast-specific elements like:\n   - Brief intro and outro with consistent taglines\n   - Transitions between segments\n   - Places to reference listener questions/feedback where appropriate\n   - Call-to-action at the end (subscribe, visit website, etc.)\n\n6. AUTHENTICITY: Write in a way that sounds like someone speaking naturally. Use contractions, occasional sentence fragments, and conversational phrases to maintain authenticity.\n\n7. PRESENTATION: Return the script in a clean, well-formatted structure that's easy for the podcaster to follow while recording.\n\nBased on the user's specified topic, format, length, tone, audience, and key points, create a complete, ready-to-record podcast script that meets their needs and exceeds their expectations." },
          { role: "user", content: prompt }
        ],
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API response error:', response.status, errorText);
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || `Status code: ${response.status}`;
      } catch {
        errorMessage = `Azure OpenAI API returned status ${response.status}`;
      }
      throw new Error(`Azure OpenAI API error: ${errorMessage}`);
    }

    const data = await response.json();
    const completions = data.choices.map(choice => choice.message.content);
    
    return NextResponse.json({ completions });
  } catch (error) {
    console.error('Error in OpenAI request:', error);
    return NextResponse.json({ 
      error: error.message || 'An error occurred while processing your request' 
    }, { status: 500 });
  }
}