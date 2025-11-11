import cloudinary from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import { CustomError } from "../../utils/customError";

interface FileData {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
 
}

export const saveStudyFile = async (file: FileData) => {
  if (!file) throw new CustomError("No file uploaded", 400);

  // Extract original extension
  const ext = file.originalname.split(".").pop();
  const timestampedName = `${Date.now()}-${file.originalname}`;

  // Upload to Cloudinary (raw file)
  const uploadResult = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "raw",
          folder: "study_files",
          public_id: timestampedName.replace(/\.[^/.]+$/, ""), // remove extension
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      )
      .end(file.buffer);
  });

  // Append original extension manually to URL
  const fileUrl = `${uploadResult.secure_url}.${ext}`;

  // Save in DB
  const savedFile = await prisma.file.create({
    data: {
      name: file.originalname,
      path: fileUrl,
     
    },
  });

  return savedFile;
};
