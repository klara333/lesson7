import dotenv from 'dotenv';
import express from 'express';
import fileUpload from 'express-fileupload';
import { S3Client, ListBucketsCommand, 
    PutObjectCommand, ListObjectsV2Command, 
    DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

dotenv.config();
const app = express();

app.use(express.urlencoded({ extended: true}));
app.use(express.json());
app.use(fileUpload());

const host = process.env.HOST || '127.0.0.1';
const port = process.env.PORT || 3000;
app.set('json spaces', 5);

const client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: 'local',
    credentials: {
        accessKeyId: process.env.S3_ACCES_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY
    }
});

const errorHandler = (err, res) => {
   console.error(err);
    res.status(500).json({
     error: err.message || 'Internal Server Error',
    });
  };
  app.use(errorHandler);

app.get('/s3/pictures', async (req, res) => {
    const bucketName = 'lesson7';
  
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
    });
  
    try {
      const { Contents } = await client.send(listCommand);
  
      const imageList = Contents.map((object) => ({
        key: object.Key,
        lastModified: object.LastModified,
      }));
  
      res.json({
        images: imageList,
      });
    } catch (err) {
        errorHandler(err, res);
    }
  });

  app.delete('/s3/picture/:key', async (req, res) => {
    const { key } = req.params;
    const bucketName = 'lesson7';
  
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
  
    try {
      await client.send(deleteCommand);
  
      res.json({
        message: 'File deleted successfully',
      });
    } catch (err) {
      errorHandler(err,res);
    }
  });

app.get('/buckets', async (req, res) => {
    const command = new ListBucketsCommand({});
    try{
        const { Owner, Buckets} = await client.send(command);
        res.json({
            owner: Owner.DisplayName,
            buckets: Buckets
        })
    } catch (err){
        errorHandler(err, res);
    }
});

app.post('/s3/picture', async (req, res) => {

    let file = req.files.image;
    const command = new PutObjectCommand({
        Bucket: 'lesson7',
        Key: file.name,
        Body: Buffer.from(file.data, 'binary')
    });

    try{
        const response = await client.send(command);
        res.json({
            response
        })
    
    } catch (err){
        errorHandler(err, res);
    }
});

app.get('/s3/picture/:key', async (req, res) => {
    const { key } = req.params;
    const bucketName = 'lesson7';
  
    const downloadCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
  
    try {
      const { Body } = await client.send(downloadCommand);
  
      res.setHeader('Content-Type', 'image/*');
      res.setHeader('Content-Disposition', `attachment; filename="${key}"`);
  
      res.send(Body);
    } catch (err) {
        errorHandler(err, res);
    }
});

app.listen(port, host, () => {
 console.log(`Server is running om http://${host}:${port}`)
});