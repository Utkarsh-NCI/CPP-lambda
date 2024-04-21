const parser = require("lambda-multipart-parser");
const AWS = require("aws-sdk");
const s3 = new AWS.S3();

const BUCKET = process.env.CHUNK_BUCKET;

exports.handler = async (event, context) => {
  try {
    const parsed = await parser.parse(event);
    const fileName = parsed.fileName;
    const fileContent = parsed.files[0].content;
    const position = parsed.position;

    await uploadToS3(fileName, fileContent, BUCKET, position);

    return {
      statusCode: 200,
      body: "",
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: error,
    };
  }
};

const uploadToS3 = async (fileName, fileData, bucketName, position) => {
  const params = {
    Bucket: bucketName,
    Key: `${fileName}_${position}`,
    Body: fileData,
  };
  await s3.putObject(params).promise();
};
