import cloudinary from '../config/cloudinary.js';

async function uploadToCloudinary(filePath) {
    const result = await cloudinary.uploader.upload(filePath, {
        folder: 'mucchatlu_chat_uploads',
        resource_type: 'auto',
        upload_preset: 'mucchatlu_uploads', // ✅ Add this
        type: 'upload',
        invalidate: true,
    });
    return result;
}

export default uploadToCloudinary;
