import prisma from "../db/prisma.js";

// Fetch all hotels
const getAllHotels = async (req, res) => {
  const hotels = await prisma.hotel.findmany();
  return res
    .status(200)
    .json({ message: "Hotels fetched sucessfully", hotels });
};

// fetch hotel by Id
const getHotelbyId = async (req, res) => {
  const { id } = req.params;
  const hotelbyId = await prisma.hotel.findunique({
    where: { id: parseInt(id) },
  });
  return res
    .status(200)
    .json({ message: "Hotel fetched sucessfully", hotelbyId });
};

// Hotel search by city name
const SearchHotelByCity = async (req,res)=>{
  const {city} = req.query;
  const hotelsByCity = await prisma.hotel.findmany({
    where:{City:city}
  })
  return res.status(200).json({message: "Hotels fetched successfully", hotelsByCity})
}

export default {
  getAllHotels,
  getHotelbyId,
  SearchHotelByCity
};
