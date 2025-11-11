import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import path from "path";
import { CustomError } from "../utils/customError";

// Memory storage (file.buffer is available)
const storage = multer.memoryStorage();

// Single file filter for study files
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedExtensions = ["pdf", "txt", "docx", "md","pptx","ppt"]; // study files
  const extname = allowedExtensions.includes(path.extname(file.originalname).slice(1).toLowerCase());
  const mimetype = allowedExtensions.some(ext => file.mimetype.includes(ext));

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new CustomError("File type not supported", 400));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
});

export default upload;


// import multer, { FileFilterCallback } from "multer";
// import path from "path";
// import { Request } from "express";
// import { CustomError } from "../utils/customError";

// // ------------------- Memory Storage -------------------
// const storage = multer.memoryStorage();

// // ------------------- Factory function to create uploader -------------------
// export const createUploader = (fieldTypes: Record<string, string[]>, maxFileSizeMB = 100) => {
//   const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
//     const fieldType = file.fieldname;
//     const allowed = fieldTypes[fieldType];

//     if (!allowed) {
//       return cb(new CustomError(`Unsupported field type: ${fieldType}`, 400));
//     }

//     const extname = allowed.some(ext => path.extname(file.originalname).toLowerCase() === `.${ext.toLowerCase()}`);
//     const mimetype = allowed.some(ext => file.mimetype.includes(ext.toLowerCase()));

//     if (extname && mimetype) {
//       cb(null, true);
//     } else {
//       cb(new CustomError(`${fieldType} file type not supported`, 400));
//     }
//   };

//   return multer({
//     storage,
//     fileFilter,
//     limits: {
//       fileSize: maxFileSizeMB * 1024 * 1024, // max size in MB
//     },
//   });
// };
