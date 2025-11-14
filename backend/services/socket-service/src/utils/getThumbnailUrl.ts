function getVideoThumbnailUrl(publicId: string) {
  let CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
  console.log({ CLOUDINARY_CLOUD_NAME });

  // Resize to width=300px, take first frame of the video
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/w_300,so_0/${publicId}.jpg`;
}

export { getVideoThumbnailUrl };
