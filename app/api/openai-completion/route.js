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
    const apiVersion = '2024-05-01-preview';

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
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt }
        ],
        max_tokens: 500
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