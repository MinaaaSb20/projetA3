import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: "OpenAI API is ready. Use POST to send a prompt." });
}

export async function POST(request) {
  try {
    const { prompt, messages = [] } = await request.json();

    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION;

    if (!endpoint || !apiKey || !deploymentName) {
      return NextResponse.json({ error: 'Azure OpenAI credentials are not set' }, { status: 500 });
    }

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
          { 
            role: "system", 
            content: `You are VocalizAI, an expert podcast script writer. Create a clean, professional podcast script with ONLY the spoken content. Follow these critical guidelines:
                  1. DO NOT include any section headers or labels in the final script (no 'Intro:', 'Segment 1:', 'Conclusion:', etc.)
                  2. Write ONLY the exact words to be spoken, as if transcribing a natural conversation
                  3. Ensure the script flows smoothly without any structural markers or bracketed instructions
                  4. Maintain the core storytelling and informative structure, but remove all non-spoken text
                  5. Focus on creating a seamless, conversational narrative that can be directly read or recorded
                  Example Format:
                  Welcome to [Podcast Name], the show that [brief description]. Today, we're diving into [topic]...
                  [Rest of the script follows the same clean, direct speaking format]
                  Deliver a script that contains ONLY the spoken words, without any additional notations or headers.`
          },
          ...messages,
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