"use client"
import fetchUserDetails from "@/utils/fetchUserDetaills";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";

interface User {
    id: number,
    email: string,
    name: string,
    mobile: string,
    role:string,
    avatar:any,
}


interface userState {
    user: User | null,
    status: any,
    error: string | null,
}

const initialState: userState = {
    user: null,
    status: "idle",
    error: null,
};


export const fetchUser = createAsyncThunk("/userDetails/fetchUser",
    async () => {
        const response = await fetchUserDetails();
        return response?.data;
    }
);


const userSlice = createSlice({
    name: "userSlice",
    initialState,
    reducers: {
        setUserDetails: (state, action) => {
            state.user = action.payload
        },
        setLogout: (state) => {
            state.user = null;
        }
    },
    extraReducers: (builder) => {
        builder.addCase(fetchUser.pending, (state) => {
            state.status = "loading"
        }).addCase(fetchUser.fulfilled, (state, action) => {
            state.status = "succeeded",
            state.user = action.payload
        }).addCase(fetchUser.rejected, (state, action) => {
            state.status = "failed",
                state.error = action.error.message || "Failed to fetch user details"
        })
    }
})


export const { setUserDetails, setLogout } = userSlice.actions;

export default userSlice.reducer;