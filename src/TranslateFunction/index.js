const AWS = require('aws-sdk');
const cldrSegmentation = require('cldr-segmentation');
const s3 = new AWS.S3();
const translate = new AWS.Translate();

exports.handler = async event => {
  // Log the event argument for debugging and for use in local development.
  console.log('Event: ', JSON.stringify(event, undefined, 2));
  console.log(`Bucket Name: ${event.Records[0].s3.bucket.name}`);
  console.log(`Bucket Key: ${event.Records[0].s3.object.key}`);

  const originalBucketName = event.Records[0].s3.bucket.name;
  const Key = event.Records[0].s3.object.key;
  const SourceLanguageCode = Key.split('/')[0];
  const TargetLanguageCode = Key.split('/')[1];

  try {
    const bucketContents = await s3.getObject({
      Bucket: originalBucketName,
      Key
    }).promise();

    const Text = bucketContents.Body.toString();
    console.log(`Original text: ${Text}`);

    const TranslateParams = {
      SourceLanguageCode,
      TargetLanguageCode,
      Text
    };

    const translatedText = await translate.translateText(TranslateParams).promise();
    console.log(`Translated text: ${JSON.stringify(translatedText, null, '\t')}`);

    const putObjectParams = {
      Bucket: process.env.BUCKET_NAME,
      Key,
      Body: translatedText.TranslatedText
    };

    const putObjectResult = await s3.putObject(putObjectParams).promise();
    console.log(`Put object result: ${JSON.stringify(putObjectResult, null, '\t')}`);
  } catch (error) {
    console.log(`An error ocurred: ${JSON.stringify(error, null, '\t')}`);
  }
};
