const AWS = require("aws-sdk");

const dynamodb = new AWS.DynamoDB();
const tableName = process.env.TABLE;

exports.handler = async (event, context) => {
  try {
    const scannedItems = await getItems();
    const result = scannedItems.map((item) => {
      let _i = {};
      _i.name = item.Key.S;
      _i.src = item.url.S;
      _i.date = item.timestamp.S;
      return _i;
    });

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Error fetching items from DynamoDB:", error);
    return {
      statusCode: 500,
      body: "An error occurred while fetching items.",
    };
  }
};

const getItems = async () => {
  const scannedItems = [];
  let lastEvaluatedKey;
  let params = {
    TableName: tableName,
  };

  do {
    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }

    const response = await dynamodb.scan(params).promise();
    scannedItems.push(...response.Items);
    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return scannedItems;
};
