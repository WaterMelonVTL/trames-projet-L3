import express from 'express';
import dotenv from 'dotenv';
import { catchError } from '../utils/HandleErrors.js';
import { Room, Sequelize, sequelize } from '../models/index.js';

dotenv.config();

const router = express.Router();


// Create a new room
router.post('/', async (req, res) => {
    const { room, user } = req.body;
    const [roomError, roomData] = await catchError(Room.create(room));
    if (roomError) {
        console.error(roomError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(roomData);
});

// Get all rooms from a context id
router.get('/context/:id', async (req, res) => {
    const id = req.params.id;
    let rooms;
    let roomError;
    if (id === 'all') {
        [roomError, rooms] = await catchError(Room.findAll());
    } else {
        [roomError, rooms] = await catchError(Room.findAll({
            where: {
                ContextId: id
            }
        }));
    }

    if (roomError) {
        console.error(roomError);
        res.status(500).send('Internal Server Error');
        return;
    }

    return res.json(rooms);
});

// Get all rooms
router.get('/', async (req, res) => {
    const [roomError, roomData] = await catchError(Room.findAll());
    if (roomError) {
        console.error(roomError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(roomData);
});

// Search for rooms
router.get('/search/:Context/:searchQuery', async (req, res) => {
    const searchQuery = req.params.searchQuery;
    const Context = req.params.Context;
    let rooms;
    let roomError;
    if (searchQuery === '%all%') {
        [roomError, rooms] = await catchError(Room.findAll({
            where: { ContextId: Context }
        }));
    } else {
        [roomError, rooms] = await catchError(Room.findAll({
            where: {
                ContextId: Context,
                [Sequelize.Op.or]: [
                    { Name: { [Sequelize.Op.like]: `%${searchQuery}%` } }
                ]
            }
        }));
    }

    if (roomError) {
        console.error(roomError);
        res.status(500).send('Internal Server Error');
        return;
    }

    return res.json(rooms);
});

// Get a room by ID
router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const [roomError, roomData] = await catchError(Room.findOne({ where: { Id: id } }));
    if (roomError) {
        console.error(roomError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(roomData);
});

// Update a room by ID
router.post('/:id', async (req, res) => {
    const id = req.params.id;
    const { room } = req.body;
    const [roomError, roomData] = await catchError(Room.update(room, { where: { Id: id } }));
    if (roomError) {
        console.error(roomError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(roomData);
});

// Delete a room by ID
router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    const [roomError, roomData] = await catchError(Room.destroy({ where: { Id: id } }));
    if (roomError) {
        console.error(roomError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(roomData);
});

export default router;

