import { unlink } from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY_TYPE } from 'core/env';
import { InternalServerException, NotFoundException } from 'packages/httpException';
import { logger } from 'packages/logger';
import { cloudinaryUploader } from '../../../config/cloudinary.config';

class Service {
    constructor() {
        this.logger = logger;
    }

    async uploadOne(file, folderName = '') {
        try {
            const response = await cloudinaryUploader.upload(file.path, {
                folder: folderName,
                resource_type: 'auto',
                type: CLOUDINARY_TYPE || 'upload'
            });
            return {
                originalName: response.original_filename,
                url: response.secure_url,
                publicId: response.public_id,
                format: response.format,
                size: response.bytes,
                width: response.width,
                height: response.height,
                createdAt: response.created_at,
            };
        } catch (error) {
            throw new InternalServerException(error.message);
        } finally {
            unlink(file.path, err => {
                if (err) {
                    this.logger.error(err.message);
                }
            });
        }
    }

    async uploadMany(files, folderName = '') {
        const uploadTasks = files.map(file => this.uploadOne(file, folderName));
        return Promise.all(uploadTasks);
    }

    async getOne(publicId) {
        try {
            const response = await cloudinary.api.resource(publicId, { resource_type: 'auto' });
            return {
                publicId: response.public_id,
                url: response.secure_url,
                format: response.format,
                size: response.bytes,
                width: response.width,
                height: response.height,
                createdAt: response.created_at,
            };
        } catch (error) {
            if (error.http_code === 404) {
                throw new NotFoundException(`File with publicId "${publicId}" not found`);
            }
            throw new InternalServerException(error.message);
        }
    }

    async deleteOne(id) {
        try {
            const response = await cloudinaryUploader.destroy(id, { resource_type: 'auto' });
            return {
                id,
                ...response,
            };
        } catch (error) {
            throw new InternalServerException(error.message);
        }
    }

    async deleteMany(ids) {
        const deleteTasks = ids.map(id => this.deleteOne(id));
        return Promise.all(deleteTasks);
    }
}

export const MediaService = new Service();
