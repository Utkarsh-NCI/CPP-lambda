const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const BUCKET = process.env.BUCKET;

exports.handler = async (event) => {
  let res = [];
  event.Records.forEach((record) => {
    const { body } = record;
    let data = JSON.parse(body);
    const { Message } = data;
    res.push(Message);
  });

  const params = {
    Bucket: BUCKET,
    Key: "lambda_log",
    Body: JSON.stringify(res),
  };
  await s3.putObject(params).promise();

  const response = {
    statusCode: 200,
  };
  return response;
};
