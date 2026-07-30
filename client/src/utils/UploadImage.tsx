import { SummeryApi } from "@/app/common/SummeryApi";
import Axios from "./Axios";


const uploadImage = async(image:any)=>{
    try {
        const formData = new FormData()
        formData.append("image",image);
        const response = await Axios({
            ...SummeryApi.uploadImage,
            data:formData,
        });
        return response;

    } catch (error) {
        return error
    }
};

export default uploadImage;