import prisma from '../db/prisma.js';

// Fetch all hotels
const getAllHotels = async (req,res)=>{
  const hotels = await prisma.hotel.findmany();
  return res.status(200).json({message: "Hotels fetched sucessfully", hotels})
}

// fetch hotel by Id

const getHotelbyId = async (req,res)=>{
  const {id} = req.params;
  const hotelbyId = await prisma.hotel.findunique({
    where :{id: parseInt(id)}
  })
  return res.status(200).json({message: "Hotel fetched sucessfully", hotelbyId})

}

export default {
  getAllHotels,
  getHotelbyId
}