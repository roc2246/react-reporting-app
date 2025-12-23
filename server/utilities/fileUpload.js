import multer from "multer";
import admin from "firebase-admin";

export function setMulterStorage() {
  const storage = multer.memoryStorage();
  return multer({ storage }).single("excelFile");
}

export async function handleFileUpload(req, res) {
  if (!req.session) return res.status(401).json({ error: "Unauthorized" });
  const upload = setMulterStorage();
  return new Promise((resolve, reject) => {
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) return res.status(500).json({ error: err.message });
      if (err) return res.status(500).json({ error: "An error occurred while uploading the file." });

      const bucket = admin.storage().bucket("reportingapp---file-uploads.appspot.com");
      const file = req.file;
      if (!file) return res.status(400).json({ error: "No file uploaded." });

      const fileUpload = bucket.file(file.originalname);
      const fileStream = fileUpload.createWriteStream({ metadata: { contentType: file.mimetype } });

      fileStream.on("error", reject);
      fileStream.on("finish", resolve);
      fileStream.end(file.buffer);
    });
  });
}

export async function deleteFiles() {
  try {
    const bucket = admin.storage().bucket("reportingapp---file-uploads.appspot.com");
    const [FBfiles] = await bucket.getFiles();
    if (FBfiles.length > 0) {
      await bucket.file(FBfiles[0].name).delete();
      console.log(`File ${FBfiles[0].name} deleted from Firebase Storage.`);
    }
  } catch (error) {
    console.error("Error deleting files:", error);
  }
}
