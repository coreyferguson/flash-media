
const AWS = require('aws-sdk')
const sharp = require('sharp');
const stream = require('stream')

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

module.exports = {};

module.exports.resize = event => {
  console.log('handler called');

  const BUCKET = 'overattribution-flash-dev-media';
  const URL = `http://${BUCKET}.s3-website.us-west-2.amazonaws.com`;

  try {
    const inputObjectKey = module.exports.getObjectKey(event);
    const outputObjectKey = module.exports.getTargetObjectKey(inputObjectKey);
    const readStream = module.exports.readStreamFromS3({ Bucket: BUCKET, Key: inputObjectKey });
    const width = 500, height = 300;
    const resizeStream = module.exports.streamToSharp({
      width: 500,
      height: 300,
      fit: sharp.fit.inside
    });
    const { writeStream, uploadFinished } = module.exports.writeStreamToS3({ Bucket: BUCKET, Key: outputObjectKey });
    readStream.pipe(resizeStream).pipe(writeStream);

    uploadFinished.then(() => {
      console.log('finished uploading');
      if (inputObjectKey !== outputObjectKey)
        module.exports.deleteObject({ Bucket: BUCKET, Key: inputObjectKey })
    });
  } catch (err) {
    console.error(err)
  }
}

module.exports.readStreamFromS3 = ({ Bucket, Key }) => {
  return s3.getObject({ Bucket, Key }).createReadStream();
};

module.exports.writeStreamToS3 = ({ Bucket, Key }) => {
  const pass = new stream.PassThrough();
  return {
    writeStream: pass,
    uploadFinished: s3.upload({
      Body: pass,
      Bucket,
      ContentType: 'image/jpeg',
      Key
    }).promise()
  };
};

module.exports.streamToSharp = ({ width, height, fit }) => {
  return sharp().resize({ width, height, fit }).toFormat('jpeg');
};

module.exports.getObjectKey = event => {
  return decodeURIComponent(event.Records[0].s3.object.key);
};

module.exports.getTargetObjectKey = objectKey => {
  return objectKey.replace(/\.\w+$/, '.jpg');
};

module.exports.deleteObject = ({ Bucket, Key }) => {
  return s3.deleteObject({ Bucket, Key }, function(err, data) {
    if (err) console.error(err, err.stack);
    else console.error(data);
  }).promise();
};

// module.exports.resize();
