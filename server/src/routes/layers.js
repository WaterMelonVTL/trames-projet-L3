import express from 'express';
import dotenv from 'dotenv';
import { catchError } from '../utils/HandleErrors.js';
import { Layer, Sequelize, sequelize } from '../models/index.js';

dotenv.config();

const router = express.Router();

// Create a new layer
router.post('/', async (req, res) => {
    const { layer, user } = req.body;
    const [layerError, layerData] = await catchError(Layer.create(layer));
    if (layerError) {
        console.error(layerError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(layerData);
});

// Get all layers (for testing purposes)
router.get('/', async (req, res) => {
    const [layerError, layerData] = await catchError(Layer.findAll());
    if (layerError) {
        console.error(layerError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(layerData);
});

// Search layers by Tramme and search query
router.get('/search/:Tramme/:searchQuery', async (req, res) => {
    const searchQuery = req.params.searchQuery;
    const Tramme = req.params.Tramme;
    let layers, layerError;

    if (searchQuery === 'all') {
        [layerError, layers] = await catchError(Layer.findAll(
            { where: { TrammeId: Tramme } }
        ));
    } else {
        [layerError, layers] = await catchError(Layer.findAll({
            where: {
                TrammeId: Tramme,
                [Sequelize.Op.or]: [
                    { Name: { [Sequelize.Op.like]: `%${searchQuery}%` } }
                ]
            }
        }));
    }

    if (layerError) {
        console.error(layerError);
        res.status(500).send('Internal Server Error');
        return;
    }

    return res.json(layers);
});

// Get all layers of a specific Tramme
router.get('/tramme/:id', async (req, res) => {
    const id = req.params.id;
    const withGroups = req.query.withGroups;
    const [layerError, layers] = await catchError(Layer.findAll({ where: { TrammeId: id }, include: withGroups ? 'Groups' : null }));
    if (layerError) {
        console.error(layerError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(layers);
});

// Get a specific layer by ID
router.get('/:id', async (req, res) => {
    const id = req.params.id;
    if (!id) {
        res.status(400).send('Id is required');
        return;
    }
    const [layerError, layer] = await catchError(Layer.findByPk(id));
    if (layerError) {
        console.error(layerError);
        res.status(500).send('Internal Server Error');
        return;
    }
    if (!layer) {
        res.status(404).send('Layer not found');
        return;
    }
    res.json(layer);
});

// Update a specific layer by ID
router.put('/:id', async (req, res) => {
    const id = req.params.id;
    if (!id) {
        res.status(400).send('Id is required');
        return;
    }
    const layer = req.body;
    const [layerError, success] = await catchError(Layer.update(layer, { where: { Id: id } }));
    if (layerError) {
        console.error(layerError);
        res.status(500).send('Internal Server Error');
        return;
    }
    
    res.json(success);
});

// Delete a specific layer by ID
router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    if (!id) {
        res.status(400).send('Id is required');
        return;
    }
    const [layerError, layerData] = await catchError(Layer.destroy({ where: { Id: id } }));
    if (layerError) {
        console.error(layerError);
        res.status(500).send('Internal Server Error');
        return;
    }
    res.json(layerData);
});

export default router;
