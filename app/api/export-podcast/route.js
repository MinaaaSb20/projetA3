import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import PodcastExport from '@/models/PodcastExport';
import mongoose from 'mongoose';

const execAsync = promisify(exec);

// Define FFmpeg path - adjust this to your FFmpeg installation path
const FFMPEG_PATH = process.platform === 'win32' 
  ? 'C:\\Users\\DELL\\Desktop\\ffmpeg\\bin\\ffmpeg.exe'  // Updated Windows path
  : 'ffmpeg';  // Unix-like systems

export async function POST(req) {
  try {
    const { audioData, format, quality, title, userId, podcastId } = await req.json();
    let podcastExport = null; // Declare this at the top level of try block

    // Validate required fields
    if (!audioData) {
      return NextResponse.json(
        { error: 'Audio data is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    if (!format || !['mp3', 'aac', 'mp4'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format specified' },
        { status: 400 }
      );
    }

    // Generate unique ID for this export
    const exportId = uuidv4();
    
    // Create directories with absolute paths
    const projectRoot = process.cwd();
    const exportDir = path.join(projectRoot, 'public', 'exports');
    const tempDir = path.join(projectRoot, 'temp');

    // Ensure directories exist
    await Promise.all([
      fs.mkdir(exportDir, { recursive: true }),
      fs.mkdir(tempDir, { recursive: true })
    ]);

    // Generate filenames
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const outputFilename = `${sanitizedTitle}_${exportId}.${format}`;
    const outputPath = path.join(exportDir, outputFilename);
    const tempInputPath = path.join(tempDir, `temp_input_${exportId}.wav`);

    console.log('Export request:', { userId, format, podcastId });

    try {
      // Validate base64 string
      if (!audioData.includes('base64,')) {
        throw new Error('Invalid audio data format');
      }

      // Extract the actual base64 data after the comma
      const base64Data = audioData.split('base64,')[1];
      
      // Save base64 audio to temp file
      const buffer = Buffer.from(base64Data, 'base64');
      await fs.writeFile(tempInputPath, buffer);

      // Verify files exist
      await fs.access(tempInputPath);
      
      // Prepare FFmpeg command
      const qualityValue = typeof quality === 'string' && quality.toLowerCase() === 'high' 
        ? '320k' 
        : quality;

      // Use normalized paths
      const normalizedInputPath = tempInputPath.replace(/\\/g, '/');
      const normalizedOutputPath = outputPath.replace(/\\/g, '/');
      const normalizedFfmpegPath = FFMPEG_PATH.replace(/\\/g, '/');

      let ffmpegCommand = '';
      switch (format) {
        case 'mp3':
          ffmpegCommand = `"${normalizedFfmpegPath}" -y -i "${normalizedInputPath}" -c:a libmp3lame -b:a ${qualityValue} "${normalizedOutputPath}"`;
          break;
        case 'aac':
          ffmpegCommand = `"${normalizedFfmpegPath}" -y -i "${normalizedInputPath}" -c:a aac -b:a ${qualityValue} "${normalizedOutputPath}"`;
          break;
        case 'mp4':
          ffmpegCommand = `"${normalizedFfmpegPath}" -y -i "${normalizedInputPath}" -c:a aac -b:a ${qualityValue} "${normalizedOutputPath}"`;
          break;
        default:
          throw new Error('Unsupported format');
      }

      console.log('Executing FFmpeg command:', ffmpegCommand);

      const { stdout, stderr } = await execAsync(ffmpegCommand);
      console.log('FFmpeg stdout:', stdout);
      if (stderr) console.error('FFmpeg stderr:', stderr);

      // Verify output file was created
      await fs.access(outputPath);

      // Generate URLs
      const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/share/${exportId}`;
      const downloadUrl = `/exports/${outputFilename}`;

      // Create PodcastExport record with actual user data
      podcastExport = new PodcastExport({
        podcastId: podcastId || new mongoose.Types.ObjectId(), // Fallback if podcastId is not provided
        userId,
        format,
        processedAudioUrl: downloadUrl,
        shareableLink: shareUrl,
        status: 'completed'
      });

      await podcastExport.save();

      console.log('Saved export:', podcastExport);

      return NextResponse.json({
        success: true,
        shareUrl,
        downloadUrl,
        format,
        quality,
        exportId: podcastExport._id
      });

    } catch (error) {
      // Update status to error if we created a PodcastExport
      if (podcastExport) {
        podcastExport.status = 'error';
        await podcastExport.save();
      }

      console.error('Processing error:', error);
      throw new Error(`Processing failed: ${error.message}`);
    } finally {
      // Clean up temp file
      try {
        if (await fs.access(tempInputPath).then(() => true).catch(() => false)) {
          await fs.unlink(tempInputPath);
        }
      } catch (error) {
        console.error('Failed to clean up temp file:', error);
      }
    }

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: `Failed to export podcast: ${error.message}` },
      { status: 500 }
    );
  }
}
