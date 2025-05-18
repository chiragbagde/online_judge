const dotenv = require("dotenv");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

dotenv.config();

const { B2_TEST_APPLICATION_KEY, B2_TEST_ACCOUNT_ID, B2_TEST_BUCKET_ID } =
  process.env;
const B2_ACCOUNT_ID = B2_TEST_ACCOUNT_ID;
const B2_APP_KEY = B2_TEST_APPLICATION_KEY;
const B2_BUCKET_ID = B2_TEST_BUCKET_ID;

const calculateSHA1 = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const hash = crypto.createHash("sha1");
  hash.update(fileBuffer);
  return hash.digest("hex");
};

const getAuthToken = async () => {
  const credentials = `${B2_ACCOUNT_ID}:${B2_APP_KEY}`;
  const base64 = Buffer.from(credentials).toString("base64");
  const res = await axios.get(
    "https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
    { headers: { Authorization: `Basic ${base64}` } }
  );
  return res.data;
};

const getUploadUrl = async (authToken, apiUrl, bucketId) => {
  const res = await axios.post(
    `${apiUrl}/b2api/v2/b2_get_upload_url`,
    { bucketId },
    { headers: { Authorization: authToken } }
  );
  return res.data;
};

const uploadFileToB2 = async (filePath) => {
  const authDetails = await getAuthToken();
  const { authorizationToken, apiUrl } = authDetails;
  const { uploadUrl, authorizationToken: uploadAuth } = await getUploadUrl(
    authorizationToken,
    apiUrl,
    B2_BUCKET_ID
  );
  const filename = path.basename(filePath);
  const fileData = fs.readFileSync(filePath);
  const sha1 = calculateSHA1(filePath);
  const fileSize = fileData.length;
  const headers = {
    Authorization: uploadAuth,
    "X-Bz-File-Name": encodeURIComponent(filename),
    "Content-Type": "b2/x-auto",
    "Content-Length": fileSize,
    "X-Bz-Content-Sha1": sha1,
  };
  const res = await axios.post(uploadUrl, fileData, { headers });
  return res.data;
};

const downloadFileFromB2 = async (fileName, savePath) => {
  const authDetails = await getAuthToken();
  const { authorizationToken } = authDetails;
  const fileUrl = `https://f003.backblazeb2.com/file/cloud-testing/${fileName}`; // Adjust bucket name if needed
  const res = await axios.get(fileUrl, {
    headers: { Authorization: authorizationToken },
    responseType: "stream",
  });
  const writer = fs.createWriteStream(savePath);
  res.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
};

module.exports = { uploadFileToB2, downloadFileFromB2 };
