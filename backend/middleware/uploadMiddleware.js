import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    const name = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
    
    return {
      folder: 'lms_uploads',
      resource_type: 'auto',
      format: ext,
      public_id: `${name}_${Date.now()}`
    };
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

export default upload;
