import { createSlice } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

const userSlice=createSlice({
    name:'user',
    initialState:{
        info:null,
        token:null
    },
    reducers:{
        login:(state,action)=>{
            state.info=action.payload.user;
            state.token=action.payload.token;
        },
        logout:(state)=>{
            state.info=null;
            state.token=null;
            AsyncStorage.removeItem('token');
            AsyncStorage.removeItem('user');

        }
    }
});

export default userSlice.reducer;
export const {login,logout}=userSlice.actions; 