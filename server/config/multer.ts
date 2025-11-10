import { log } from "console";
import multer from "multer";
import path from "path";
import { Express,Request } from "express";
import { CustomError } from "../utils/customError";


const storage = multer.memoryStorage();

const fileFilter = (req :Request, file:any, cb:any) => {
  const fileTypes: any = {
    image: /jpeg|jpg|png|gif/,
    resume: /pdf|doc|docx|txt|rtf/,
  };
  const fieldType = file.fieldname;
  const allowedTypes = fileTypes[fieldType];
  // console.log(allowedTypes);
  
  if (!allowedTypes) {
     return cb(new CustomError("Unsupported field type",400), false);
  }
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);
  // console.log(mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new CustomError(`${fieldType} file type not supported`,400));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

export default upload;
