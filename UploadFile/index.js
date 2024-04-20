const parser = require("lambda-multipart-parser");
const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB();

const BUCKET = process.env.BUCKET;
const TABLE = process.env.TABLE;

exports.handler = async (event, context) => {
  let s3url = "";

  try {
    const parsed = await parser.parse(event);
    const fileName = parsed.files[0].filename;
    const fileContent = parsed.files[0].content;
    await uploadToS3(fileName, fileContent, BUCKET);
    s3url = await getS3Url(fileName, BUCKET);
    await uploadMetadata(fileName, s3url);
    return {
      statusCode: 200,
      body: s3url,
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: error,
    };
  }
};

const uploadToS3 = async (fileName, fileData, bucketName) => {
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: fileData,
  };
  await s3.putObject(params).promise();
};

const getS3Url = async (fileName, bucketName) => {
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Expires: 31536000,
  };
  const url = await s3.getSignedUrlPromise("getObject", params);
  return url;
};

const uploadMetadata = async (fileName, s3url) => {
  let item = {};
  item.Key = { S: fileName };
  item.timestamp = { S: new Date().toISOString() };
  item.url = { S: s3url };
  const params = {
    TableName: process.env.TABLE,
    Item: item,
  };

  await dynamodb.putItem(params).promise();
};
