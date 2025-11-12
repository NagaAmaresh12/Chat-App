import cloudinary from '../config/cloudinary.js';

async function uploadToCloudinary(filePath) {
    const result = await cloudinary.uploader.upload(filePath, {
        folder: 'mucchatlu_chat_uploads',
        resource_type: 'auto',
    });
    return result.secure_url;
}

export default uploadToCloudinary;
