import { TextAnalyticsClient, AzureKeyCredential } from "@azure/ai-text-analytics";
import DocumentSummary from '@/models/DocumentSummary';
import connectMongo from '@/libs/mongoose';

// Initialize Azure Text Analytics Client
const client = new TextAnalyticsClient(
  process.env.AZURE_LANGUAGE_ENDPOINT,
  new AzureKeyCredential(process.env.AZURE_LANGUAGE_KEY)
);

export async function POST(req) {
  try {
    const { documentUrl, fileName, conversationId } = await req.json();
    
    if (!documentUrl) {
      return new Response(JSON.stringify({ error: "No document URL provided" }), {
        status: 400
      });
    }

    // Fetch document content
    const response = await fetch(documentUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch document: ${response.statusText}`);
    }
    
    const text = await response.text();
    console.log("Document content length:", text.length); // Debug log

    // Call Azure API directly with the correct endpoint
    console.log("Sending request to Azure...");
    const result = await fetch(`${process.env.AZURE_LANGUAGE_ENDPOINT}/language/analyze-text/jobs?api-version=2023-04-01`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_LANGUAGE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        displayName: "Document Summarization",
        analysisInput: {
          documents: [
            {
              id: "1",
              text: text,
              language: "en"
            }
          ]
        },
        tasks: [
          {
            kind: "ExtractiveSummarization",
            taskName: "Document Summary",
            parameters: {
              sentenceCount: 5
            }
          }
        ]
      })
    });

    if (!result.ok) {
      const errorData = await result.json();
      console.error("Azure API error:", errorData);
      throw new Error(errorData.error?.message || "Failed to get summary from Azure");
    }

    // Get the operation location for polling
    const operationLocation = result.headers.get('operation-location');
    if (!operationLocation) {
      throw new Error("No operation location received");
    }

    console.log("Polling operation at:", operationLocation); // Debug log

    // Poll for results
    let summaryResult;
    let attempts = 0;
    const maxAttempts = 30; // Increased max attempts

    while (attempts < maxAttempts) {
      console.log(`Polling attempt ${attempts + 1}/${maxAttempts}`); // Debug log
      
      const pollResponse = await fetch(operationLocation, {
        headers: {
          'Ocp-Apim-Subscription-Key': process.env.AZURE_LANGUAGE_KEY
        }
      });
      
      if (!pollResponse.ok) {
        throw new Error(`Polling failed: ${pollResponse.statusText}`);
      }

      summaryResult = await pollResponse.json();
      console.log("Full summary result:", JSON.stringify(summaryResult, null, 2)); // Add this line
      console.log("Poll result status:", summaryResult.status);
      
      if (summaryResult.status === 'succeeded') {
        break;
      } else if (summaryResult.status === 'failed') {
        throw new Error(summaryResult.errors?.[0]?.message || "Summary generation failed");
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000)); // Increased wait time to 2 seconds
    }

    if (attempts >= maxAttempts) {
      throw new Error("Timeout waiting for summary");
    }

    // Extract summary from the result with better error handling
    if (!summaryResult?.tasks?.items?.[0]?.results?.documents?.[0]?.sentences) {
      console.log("Invalid summary structure:", summaryResult);
      throw new Error("Unexpected response structure from Azure");
    }

    const summary = summaryResult.tasks.items[0].results.documents[0].sentences
      .map(sentence => sentence.text)
      .join(' ');

    console.log("Generated summary length:", summary.length); // Debug log

    // After getting the summary, save to DB
    await connectMongo();
    const documentSummary = await DocumentSummary.create({
      conversationId,
      fileName,
      fileUrl: documentUrl,
      summary
    });

    return new Response(JSON.stringify({ summary, documentSummary }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Summarization error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to summarize document"
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}