import express from 'express';
import { Events, Sequelize } from '../models/index.js';

const router = express.Router();

// Create a new event
router.post('/', async (req, res) => {
    try {
        const event = await Events.create(req.body);
        res.status(201).json(event);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
    }
});

// Get all events
router.get('/', async (req, res) => {
    try {
        const events = await Events.findAll();
        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
    }
});

// Get a specific event by ID
router.get('/:id', async (req, res) => {
    const eventId = req.params.id;
    try {
        const event = await Events.findByPk(eventId);
        if (!event) {
            return res.status(404).send('Event not found');
        }
        res.json(event);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
    }
});

// Get events by tramme ID
router.get('/tramme/:trammeId', async (req, res) => {
    const trammeId = req.params.trammeId;
    try {
        const events = await Events.findAll({
            where: { TrammeId: trammeId }
        });
        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
    }
});



// Get events by date and tramme ID
router.get('/date/:trammeId/:date', async (req, res) => {
    const { trammeId, date } = req.params;
    console.log(trammeId, date);
    const eventDate = new Date(date);
    try {

        
        const events = await Events.findAll({
            where: {
                TrammeId: trammeId,
                Date: eventDate
            }
        });
        console.log(events);
        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
    }
});

// Update an event
router.put('/:id', async (req, res) => {
    const eventId = req.params.id;
    try {
        const event = await Events.findByPk(eventId);
        if (!event) {
            return res.status(404).send('Event not found');
        }
        await event.update(req.body);
        res.send('Event updated successfully');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
    }
});

// Delete an event
router.delete('/:id', async (req, res) => {
    const eventId = req.params.id;
    try {
        const event = await Events.findByPk(eventId);
        if (!event) {
            return res.status(404).send('Event not found');
        }
        await event.destroy();
        res.send('Event deleted successfully');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
