"use client"
import { SummeryApi } from "@/app/common/SummeryApi";
import Axios from "./Axios";
import AxiosToastError from "./AxiosToastError";




const fetchUserDetails = async () => {
    try {
        const accessToken = localStorage.getItem("accessToken");
        const response = await Axios({
            ...SummeryApi.getUserDetails,
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            withCredentials: true,
        })
        return response?.data;
    } catch (error) {
        AxiosToastError(error);
        throw error;
    }
};



export default fetchUserDetails;