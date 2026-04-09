import { v2 as cloudinary } from "cloudinary"; // Ensure cloudinary library is up-to-date

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
if (!process.env.CLOUDINARY_API_KEY) { throw new Error('CLOUDINARY_API_KEY environment variable is not set'); } const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "";

export function configureCloudinary() {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });

  console.log("[Cloudinary] Configuration loaded");
}

export { cloudinary };
