const cloudinary = require('cloudinary').v2;



cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET_KEY
})


export const uploadImageCloudinary = async (image:any)=>{
    const buffer = image?.buffer || Buffer.from( await image.arrayBuffer());

    const uploadImage = await new Promise((resolve,reject)=>{
        cloudinary.uploader.upload_stream(
            {folder: "healhushop"},(error:any,uploadResult:any)=>{
                if(uploadResult){
                    return resolve(uploadResult);
                }else{
                    return reject(error)
                }
            }
        ).end(buffer);
    });
    return uploadImage;
}