const { S3Client } = require("@aws-sdk/client-s3");

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

const R2BucketClient = new S3Client({
  region: "auto",
  endpoint: process.env.S3_CLOUD_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEYID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});



module.exports = { r2Client, R2BucketClient };