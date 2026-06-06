import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as propertyService from './property.service.js';

// ─── CREATE PROPERTY ───────────────────────────────────
export const createProperty = asyncHandler(async (req, res) => {
  const hostId = req.user.userId;
  const property = await propertyService.createProperty(hostId, req.body);

  res
    .status(201)
    .json(new ApiResponse(201, property, 'Property created successfully'));
});

// ─── GET PROPERTIES ────────────────────────────────────
export const getProperties = asyncHandler(async (req, res) => {
  const properties = await propertyService.getProperties(req.query);

  res
    .status(200)
    .json(new ApiResponse(200, properties, 'Properties fetched successfully'));
});

// ─── GET PROPERTY BY ID ────────────────────────────────
export const getPropertyById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const property = await propertyService.getPropertyById(id);

  res
    .status(200)
    .json(new ApiResponse(200, property, 'Property details retrieved'));
});

// ─── UPDATE PROPERTY ───────────────────────────────────
export const updateProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const userRole = req.user.role;

  const property = await propertyService.updateProperty(id, userId, userRole, req.body);

  res
    .status(200)
    .json(new ApiResponse(200, property, 'Property updated successfully'));
});

// ─── DELETE PROPERTY ───────────────────────────────────
export const deleteProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const userRole = req.user.role;

  const result = await propertyService.deleteProperty(id, userId, userRole);

  res
    .status(200)
    .json(new ApiResponse(200, null, result.message));
});

// ─── ADD ROOM ──────────────────────────────────────────
export const addRoom = asyncHandler(async (req, res) => {
  const { id: propertyId } = req.params;
  const userId = req.user.userId;
  const userRole = req.user.role;

  const room = await propertyService.addRoom(propertyId, userId, userRole, req.body);

  res
    .status(201)
    .json(new ApiResponse(201, room, 'Room type added to property'));
});

// ─── GET ROOMS ─────────────────────────────────────────
export const getRooms = asyncHandler(async (req, res) => {
  const { id: propertyId } = req.params;
  const rooms = await propertyService.getRooms(propertyId);

  res
    .status(200)
    .json(new ApiResponse(200, rooms, 'Rooms fetched successfully'));
});

// ─── UPDATE ROOM ───────────────────────────────────────
export const updateRoom = asyncHandler(async (req, res) => {
  const { id: propertyId, roomId } = req.params;
  const userId = req.user.userId;
  const userRole = req.user.role;

  const room = await propertyService.updateRoom(propertyId, roomId, userId, userRole, req.body);

  res
    .status(200)
    .json(new ApiResponse(200, room, 'Room updated successfully'));
});

// ─── DELETE ROOM ───────────────────────────────────────
export const deleteRoom = asyncHandler(async (req, res) => {
  const { id: propertyId, roomId } = req.params;
  const userId = req.user.userId;
  const userRole = req.user.role;

  const result = await propertyService.deleteRoom(propertyId, roomId, userId, userRole);

  res
    .status(200)
    .json(new ApiResponse(200, null, result.message));
});

// ─── ADD PHOTO ─────────────────────────────────────────
export const addPhoto = asyncHandler(async (req, res) => {
  const { id: propertyId } = req.params;
  const userId = req.user.userId;
  const userRole = req.user.role;

  const photo = await propertyService.addPhoto(propertyId, userId, userRole, req.body);

  res
    .status(201)
    .json(new ApiResponse(201, photo, 'Photo added successfully'));
});

// ─── DELETE PHOTO ──────────────────────────────────────
export const deletePhoto = asyncHandler(async (req, res) => {
  const { id: propertyId, photoId } = req.params;
  const userId = req.user.userId;
  const userRole = req.user.role;

  const result = await propertyService.deletePhoto(propertyId, photoId, userId, userRole);

  res
    .status(200)
    .json(new ApiResponse(200, null, result.message));
});

// ─── SET COVER PHOTO ───────────────────────────────────
export const setCoverPhoto = asyncHandler(async (req, res) => {
  const { id: propertyId, photoId } = req.params;
  const userId = req.user.userId;
  const userRole = req.user.role;

  const result = await propertyService.setCoverPhoto(propertyId, photoId, userId, userRole);

  res
    .status(200)
    .json(new ApiResponse(200, null, result.message));
});
