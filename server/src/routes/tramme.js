import express from 'express';
import dotenv from 'dotenv';
import { catchError } from '../utils/HandleErrors.js';
import { Tramme, Sequelize } from '../models/index.js';

dotenv.config();
const router = express.Router();

// Create a new tramme
router.post('/', async (req, res) => {
    const { data, user } = req.body; // user est à récupérer depuis le token pour sécuriser la création
    const tramme = {
        Name: data.Name,
        ContextId: data.ContextId,
        Owner: user.Id,
        Year: data.Year
    };
    const [trammeError, trammeData] = await catchError(Tramme.create(tramme));
    if (trammeError) {
        console.error(trammeError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(trammeData);
});

// Get all trammes
router.get('/', async (req, res) => {
    const [trammeError, trammeData] = await catchError(Tramme.findAll());
    if (trammeError) {
        console.error(trammeError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(trammeData);
});

// Search trammes by query
router.get('/search/:searchQuery', async (req, res) => {
    const searchQuery = req.params.searchQuery;
    let trammes;
    let trammeError;

    if (searchQuery === 'all') {
        [trammeError, trammes] = await catchError(Tramme.findAll());
    } else {
        [trammeError, trammes] = await catchError(Tramme.findAll({
            where: {
                [Sequelize.Op.or]: [
                    { Name: { [Sequelize.Op.like]: `%${searchQuery}%` } }
                ]
            }
        }));
    }

    if (trammeError) {
        console.error(trammeError);
        res.status(500).send('Internal Server Error');
        return;
    }

    res.json(trammes);
});

// Get trammes by user ID
router.get('/user/:id', async (req, res) => {
    const id = req.params.id;
    
    if (!id) {
        res.status(400).send('Id is required');
        return;
    }

    const [trammeError, trammes] = await catchError(Tramme.findAll({ where: { Owner: id } }));
    if (trammeError) {
        console.error(trammeError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(trammes);
});

// Get a tramme by ID
router.get('/:id', async (req, res) => {
    const id = req.params.id;

    if (!id) {
        res.status(400).send('Id is required');
        return;
    }

    const [trammeError, trammeData] = await catchError(Tramme.findByPk(id));

    if (trammeError) {
        console.error(trammeError);
        res.status(500).send('Internal Server Error');
        return;
    }

    return res.json(trammeData);
});

// Update a tramme by ID
router.put('/:id', async (req, res) => {
    const id = req.params.id;
    console.log("updating context with id: ", id);
    if (!id) {
        res.status(400).send('Id is required');
        return;
    }

    const [trammeError, trammeData] = await catchError(Tramme.findByPk(id));

    if (trammeError) {
        console.error(trammeError);
        res.status(500).send('Internal Server Error');
        return;

    }if (!trammeData) {
        res.status(404).send('Context not found');
        return;
    }

    console.log("updating context with data: ", req.body);

    const [updateError, updatedTramme] = await catchError(trammeData.update(req.body));

    if (updateError) {
        console.error(updateError);
        res.status(500).send('Internal Server Error');
        return;
    }

    console.log(updatedTramme);
    return res.json(updatedTramme);
});

// Delete a tramme by ID
router.delete('/:id', async (req, res) => {
    const id = req.params.id;

    if (!id) {
        res.status(400).send('Id is required');
        return;
    }

    const [trammeError, trammeData] = await catchError(Tramme.findByPk(id));

    if (trammeError) {
        console.error(trammeError);
        res.status(500).send('Internal Server Error');
        return;
    }

    return res.json(trammeData);
});

export default router;