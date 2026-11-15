import {user} from '../models/user.model.js';
import httpStatus from 'http-status';
import bcrypt from 'bcrypt';
import crypto from 'crypto';


const login = async(req,res)=>{
    const username = req.body?.username?.trim();
    const password = req.body?.password;

    if(!username || !password){
        return res.status(400).json({message:"Username and password are required"});
    }
    try{
        const userexist = await user.findOne({username});
        if(!userexist){
            return res.status(httpStatus.NOT_FOUND).json({message:"User not found"});
        }

        let isPassword = await bcrypt.compare(password,userexist.password);

        if(isPassword){
            let token =crypto.randomBytes(20).toString('hex');

            userexist.token = token;
            await userexist.save();
            return res.status(httpStatus.OK).json({message:"Login successful",token:token});
        }else{
            return res.status(httpStatus.UNAUTHORIZED).json({
            message: "Invalid Username or password"})
        }

    }catch(error){
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message:"Error logging in"});
    }
}

const register = async(req,res)=>{
    const name = req.body?.name?.trim();
    const username = req.body?.username?.trim();
    const password = req.body?.password;

    if(!name || !username || !password){
        return res.status(httpStatus.BAD_REQUEST).json({message:"Name, username and password are required"});
    }

    try{
        const existingUser = await user.findOne({username});
        if(existingUser){
            return res.status(httpStatus.FOUND).json({message:"username already exists"});
        }

        const hashedPassword =  await bcrypt.hash(password,10);

        const newUser = new user({
            name:name,
            username:username,
            password:hashedPassword
        });

        await newUser.save();
        return res.status(httpStatus.CREATED).json({message:"User registered successfully"});
    }catch(error){
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message:"Error registering user"});
    }
}

export {login,register};