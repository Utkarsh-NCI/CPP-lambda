const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB();

const IMAGES_BUCKET = process.env.IMAGES_BUCKET;
const TABLE = process.env.TABLE;

exports.handler = async (event) => {
  let fileName;
  if (event.body && event.body !== "") {
    const _parse = JSON.parse(event.body);
    fileName = _parse.fileName;
    await deleteFileS3(fileName);
    await deleteMetadataDB(fileName);
  }
  const response = {
    statusCode: 200,
  };
  return response;
};

const deleteFileS3 = async (fileName) => {
  const params = {
    Bucket: IMAGES_BUCKET,
    Key: fileName,
  };
  await s3.deleteObject(params).promise();
};
const deleteMetadataDB = async (fileName) => {
  const params = {
    Key: {
      Key: {
        S: fileName,
      },
    },
    TableName: TABLE,
  };
  await dynamodb.deleteItem(params).promise();
};
