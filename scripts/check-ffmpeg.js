const { exec } = require('child_process');
const path = require('path');

const FFMPEG_PATH = process.platform === 'win32' 
  ? 'C:\\Users\\DELL\\Desktop\\ffmpeg\\bin\\ffmpeg.exe'
  : 'ffmpeg';

console.log('Checking FFmpeg installation...');
console.log('FFmpeg path:', FFMPEG_PATH);

exec(`"${FFMPEG_PATH}" -version`, (error, stdout, stderr) => {
  if (error) {
    console.error('FFmpeg is not properly installed or accessible:', error);
    console.log('\nPlease verify that FFmpeg exists at:', FFMPEG_PATH);
    console.log('\nIf not, please follow these steps to install FFmpeg:');
    console.log('1. Download FFmpeg from: https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip');
    console.log('2. Extract the zip file');
    console.log('3. Copy the contents of the bin folder to C:\\Users\\DELL\\Desktop\\ffmpeg\\bin');
    console.log('4. Make sure the path contains ffmpeg.exe, ffprobe.exe, and ffplay.exe');
    process.exit(1);
  } else {
    console.log('FFmpeg is properly installed!');
    console.log('\nVersion information:');
    console.log(stdout);
  }
}); 