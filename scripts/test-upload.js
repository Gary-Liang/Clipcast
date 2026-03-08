#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { nanoid } = require('nanoid');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node test-upload.js <file-path>');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function testUpload() {
  const filename = path.basename(filePath);
  const jobId = nanoid();
  const key = `audio/${jobId}/${filename}`;
  const stats = fs.statSync(filePath);

  console.log('\n📤 Testing upload to R2...');
  console.log(`   File: ${filename}`);
  console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Job ID: ${jobId}`);
  console.log(`   Key: ${key}\n`);

  try {
    const fileStream = fs.createReadStream(filePath);

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: fileStream,
      ContentType: 'audio/mpeg',
      ContentLength: stats.size,
    });

    console.log('⏳ Uploading...');
    const startTime = Date.now();

    await s3Client.send(command);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n✅ Upload successful!`);
    console.log(`   Duration: ${duration}s`);
    console.log(`   Storage key: ${key}`);
    console.log(`\nYou can now use this jobId for transcription: ${jobId}`);

  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testUpload();
