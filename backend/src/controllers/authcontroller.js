import prisma from '../db/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const saltRounds = 10;


// User Registration
const registerUser = async (req,res)=>{
  const {email,password} = req.body;
  const existingUser = await prisma.users.findunique({
    where:{email}
  })
  if(existingUser){
    return res.status(409).json({message:'User already exists'});
  }
  const hashedPassword = await bcrypt.hash(password,saltRounds);
  const Newuser = await prisma.user.create({
    data:{
      email:email,
      password:hashedPassword
    }
  })
  const token = jwt.sign({userId:Newuser.id},process.env.JWT_SECRET,{expiresIn:'1h'})
  return res.status(201).json({message:'user registered successfully',user:Newuser, token});

}

// User Login
const loginUser = async (req,res)=>{
  const {email,password} = req.body;
  const user = await prisma.users.findunique({
    where:{email}
  })
  if(!user){
    return res.status(404).json({message: 'User not found'})
  }
  const isPasswordValid = await bcrypt.compare(password,user.password)
  if (!isPasswordValid){
    return res.status(401).json({message:"Invalid password"})
  }
  const token = jwt.sign({userId:user.id},process.env.JWT_SECRET,{expiresIn:'1h'})
  return res.status(200).json({message:"login successful", token})
}


export default {
  registerUser,
  loginUser
}