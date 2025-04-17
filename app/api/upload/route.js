import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from "@azure/storage-blob";

async function uploadFileToStorage(file) {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  
  // Create SharedKeyCredential
  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  
  // Create BlobServiceClient
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  );
  
  // Get container client - no need to set public access
  const containerClient = blobServiceClient.getContainerClient("documents");
  await containerClient.createIfNotExists();
  
  // Create blob name and get client
  const blobName = `${Date.now()}-${file.name}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
  // Upload file
  const arrayBuffer = await file.arrayBuffer();
  await blockBlobClient.upload(arrayBuffer, arrayBuffer.byteLength);
  
  // Generate SAS token with more permissions since container is private
  const sasToken = generateBlobSASQueryParameters({
    containerName: "documents",
    blobName: blobName,
    permissions: BlobSASPermissions.parse("racwd"), // Full permissions for this specific blob
    startsOn: new Date(new Date().valueOf() - 60 * 1000), // Start 1 minute ago to avoid clock skew
    expiresOn: new Date(new Date().valueOf() + 24 * 60 * 60 * 1000), // 24 hours
    protocol: "https",
    version: "2020-08-04",
    cacheControl: "no-cache", // Prevent caching issues
    contentDisposition: "inline", // Allow direct viewing
    contentType: file.type || "application/octet-stream"
  }, sharedKeyCredential).toString();

  // Return the full URL with SAS token
  const sasUrl = `${blockBlobClient.url}?${sasToken}`;
  console.log("Generated SAS URL:", sasUrl); // Debug log
  
  return sasUrl;
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const url = await uploadFileToStorage(file);
    console.log("File uploaded successfully, URL:", url); // Debug log
    
    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to upload file" 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}