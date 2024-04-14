import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const { ObjectId } = require('mongodb');
const fs = require('fs');
const mime = require('mime-types');
const Bull = require('bull');

class FilesController {
    static async postUpload(request, response) {
        const fileQueue = new Bull('fileQueue');
    
        const token = request.header('X-Token') || null;
        if (!token) return response.status(401).send({ error: 'Unauthorized' });
    
        const redisToken = await RedisClient.get(`auth_${token}`);
        if (!redisToken) return response.status(401).send({ error: 'Unauthorized' });
    
        const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(redisToken) });
        if (!user) return response.status(401).send({ error: 'Unauthorized' });
    
        const fileName = request.body.name;
        if (!fileName) return response.status(400).send({ error: 'Missing name' });
    
        const fileType = request.body.type;
        if (!fileType || !['folder', 'file', 'image'].includes(fileType)) return response.status(400).send({ error: 'Missing type' });
    
        const fileData = request.body.data;
        if (!fileData && ['file', 'image'].includes(fileType)) return response.status(400).send({ error: 'Missing data' });
    
        const fileIsPublic = request.body.isPublic || false;
        let fileParentId = request.body.parentId || 0;
        fileParentId = fileParentId === '0' ? 0 : fileParentId;
        if (fileParentId !== 0) {
          const parentFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileParentId) });
          if (!parentFile) return response.status(400).send({ error: 'Parent not found' });
          if (!['folder'].includes(parentFile.type)) return response.status(400).send({ error: 'Parent is not a folder' });
        }
    
        const fileDataDb = {
          userId: user._id,
          name: fileName,
          type: fileType,
          isPublic: fileIsPublic,
          parentId: fileParentId,
        };
    
        if (['folder'].includes(fileType)) {
          await dbClient.db.collection('files').insertOne(fileDataDb);
          return response.status(201).send({
            id: fileDataDb._id,
            userId: fileDataDb.userId,
            name: fileDataDb.name,
            type: fileDataDb.type,
            isPublic: fileDataDb.isPublic,
            parentId: fileDataDb.parentId,
          });
        }
    
        const pathDir = process.env.FOLDER_PATH || '/tmp/files_manager';
        const fileUuid = uuidv4();
    
        const buff = Buffer.from(fileData, 'base64');
        const pathFile = `${pathDir}/${fileUuid}`;
    
        await fs.mkdir(pathDir, { recursive: true }, (error) => {
          if (error) return response.status(400).send({ error: error.message });
          return true;
        });
    
        await fs.writeFile(pathFile, buff, (error) => {
          if (error) return response.status(400).send({ error: error.message });
          return true;
        });
    
        fileDataDb.localPath = pathFile;
        await dbClient.db.collection('files').insertOne(fileDataDb);
    
        fileQueue.add({
          userId: fileDataDb.userId,
          fileId: fileDataDb._id,
        });
    
        return response.status(201).send({
          id: fileDataDb._id,
          userId: fileDataDb.userId,
          name: fileDataDb.name,
          type: fileDataDb.type,
          isPublic: fileDataDb.isPublic,
          parentId: fileDataDb.parentId,
        });
    }

    static async getShow(request, response) {
        const token = request.header('X-Token') || null;
        if (!token) return response.status(401).send({ error: 'Unauthorized' });
    
        const redisToken = await redisClient.get(`auth_${token}`);
        if (!redisToken) return response.status(401).send({ error: 'Unauthorized' });
    
        const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(redisToken) });
        if (!user) return response.status(401).send({ error: 'Unauthorized' });
    
        const idFile = request.params.id || '';
    
        const fileDocument = await dbClient.db.collection('files').findOne({ _id: ObjectId(idFile), userId: user._id });
        if (!fileDocument) return response.status(404).send({ error: 'Not found' });
    
        return response.send({
          id: fileDocument._id,
          userId: fileDocument.userId,
          name: fileDocument.name,
          type: fileDocument.type,
          isPublic: fileDocument.isPublic,
          parentId: fileDocument.parentId,
        });
    }

    static async getIndex(request, response) {
        const token = request.header('X-Token') || null;
        if (!token) return response.status(401).send({ error: 'Unauthorized' });
    
        const redisToken = await redisClient.get(`auth_${token}`);
        if (!redisToken) return response.status(401).send({ error: 'Unauthorized' });
    
        const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(redisToken) });
        if (!user) return response.status(401).send({ error: 'Unauthorized' });
    
        const parentId = request.query.parentId || 0;

    
        const pagination = request.query.page || 0;
    
        const aggregationMatch = { $and: [{ parentId }] };
        let aggregateData = [{ $match: aggregationMatch }, { $skip: pagination * 20 }, { $limit: 20 }];
        if (parentId === 0) aggregateData = [{ $skip: pagination * 20 }, { $limit: 20 }];
    
        const files = await dbClient.db.collection('files').aggregate(aggregateData);
        const filesArray = [];
        await files.forEach((item) => {
          const fileItem = {
            id: item._id,
            userId: item.userId,
            name: item.name,
            type: item.type,
            isPublic: item.isPublic,
            parentId: item.parentId,
          };
          filesArray.push(fileItem);
        });
    
        return response.send(filesArray);
    }
}


export {FilesController}