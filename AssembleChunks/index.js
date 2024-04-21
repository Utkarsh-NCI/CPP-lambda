const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB();

const BUCKET = process.env.CHUNK_BUCKET;
const IMAGES_BUCKET = process.env.IMAGES_BUCKET;

exports.handler = async (event, context) => {
  let fileName;
  let numberOfChunks;
  let s3url;
  if (event.body && event.body !== "") {
    const _parse = JSON.parse(event.body);
    fileName = _parse.fileName;
    numberOfChunks = parseInt(_parse.numberOfChunks);
  }

  let _promises = [];

  for (let i = 0; i < numberOfChunks; i++) {
    const chunkKey = `${fileName}_${i}`;
    const params = {
      Bucket: BUCKET,
      Key: chunkKey,
    };

    _promises.push(s3.getObject(params).promise());
  }
  const chunkDataArray = await Promise.all(_promises);
  const chunks = chunkDataArray.map((chunkData) => chunkData.Body);

  const mergedData = Buffer.concat(chunks);
  if (fileName && mergedData) {
    await uploadToS3(fileName, mergedData, IMAGES_BUCKET);
    s3url = await getS3Url(fileName, IMAGES_BUCKET);
    await uploadMetadata(fileName, s3url);
    await deleteChunks(fileName, numberOfChunks);
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify("Hello from Lambda!"),
  };
  return response;
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

const deleteChunks = async (fileName, numberOfChunks) => {
  let _promises = [];
  for (let i = 0; i < numberOfChunks; i++) {
    const chunkKey = `${fileName}_${i}`;
    const params = {
      Bucket: BUCKET,
      Key: chunkKey,
    };
    _promises.push(s3.deleteObject(params).promise());
  }
  let res = await Promise.all(_promises);
};
