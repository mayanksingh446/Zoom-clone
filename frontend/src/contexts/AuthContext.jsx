import { createContext, useContext } from "react";
import axios, { HttpStatusCode } from "axios";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export const AuthContext = createContext({});

const client = axios.create({
    baseURL: "http://localhost:5000/api/v1/user"
})

export const AuthProvider = ({children})=>{

    const authcontext = useContext(AuthContext);

    const [userData, setUserData] = useState(authcontext);

    const handleRegister = async(name,username,password)=>{  
        try{
            let request = await client.post('/register',{
                   name:name,
                   username:username,
                   password:password
            })

            if(request.status === HttpStatusCode.CREATED){
                return request.data.message;
            }
        }catch(error){
            throw error;
        }
    }

    const handleLogin = async(username,password)=>{
        try{
            let request =  await client.post('/login',{
                username:username,
                password:password
            })

            console.log(request.data);

            if(request.status === HttpStatusCode.OK){
                localStorage.setItem("token",request.data.token);
                return request.data.message || 'Login Successful'
            }
        }catch(error){
            throw error;
        }
    }

    const router = useNavigate();

    const data = {
        userData,setUserData,handleRegister,handleLogin
    }

    return(
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )
}