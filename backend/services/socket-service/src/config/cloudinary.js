import { v2 as cloudinary } from 'cloudinary'
import { config } from 'dotenv'
config()
const CLOUDINARY_CLOUD_NAME = "dalu4afte"
const CLOUDINARY_API_KEY = "321935886561234"
const CLOUDINARY_API_SECRET = "j6DA9hu3Siz_EuAnTsnT3yzQlcU"
cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});
export default cloudinary;