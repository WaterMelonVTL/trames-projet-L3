import express from 'express';
import dotenv from 'dotenv';
import { catchError } from '../utils/HandleErrors.js';
import { UE, Layer, Sequelize } from '../models/index.js';
import chalk from 'chalk';

dotenv.config();
const router = express.Router();

// Create a new UE
router.post('/', async (req, res) => {
    const { ue, user } = req.body;
    const createTeacherRelations = async (ueId, profs, model) => {
        const relations = profs.map(profId => ({ UEId: ueId, ProfId: profId }));
        const [error, data] = await catchError(model.bulkCreate(relations));
        if (error) {
            console.error(error);
            throw new Error('Error creating teacher relations');
        }
        return data;
    };

    const [ueError, ueData] = await catchError(UE.create(ue));
    if (ueError) {
        console.error(ueError);
        res.status(500).send('Internal Server Error');
        return;
    }

    if (!ue.ResponsibleId) {
        return res.status(400).send('No profs_CM provided');
    }

    console.log(chalk.red(JSON.stringify(ue)));
    return res.json(ueData);
});

// Get all UEs
router.get('/', async (req, res) => {
    const [ueError, ueData] = await catchError(UE.findAll());
    if (ueError) {
        console.error(ueError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(ueData);
});

// Search UEs by query
router.get('/search/:searchQuery', async (req, res) => {
    const searchQuery = req.params.searchQuery;
    let ues;
    let ueError;
    if (searchQuery === 'all') {
        [ueError, ues] = await catchError(UE.findAll());
    } else {
        [ueError, ues] = await catchError(UE.findAll({
            where: {
                [Sequelize.Op.or]: [
                    { Name: { [Sequelize.Op.like]: `%${searchQuery}%` } }
                ]
            }
        }));
    }
    if (ueError) {
        console.error(ueError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(ues);
});

// Get UEs by tramme ID
router.get('/tramme/:id', async (req, res) => {
    const id = req.params.id;
    const [layersError, layers] = await catchError(Layer.findAll({ where: { TrammeId: id } }));
    if (layersError) {
        console.error(layersError);
        res.status(500).send('Internal Server Error');
    }

    const layerIds = layers.map(layer => layer.Id);
    const [ueError, ues] = await catchError(UE.findAll({ where: { LayerId: layerIds } }));

    if (ueError) {
        console.error(ueError);
        res.status(500).send('Internal Server Error');
        return;
    }

    return res.json(ues);
});

// Get UEs by layer ID
router.get('/layer/:id', async (req, res) => {
    const id = req.params.id;
    const [ueError, ues] = await catchError(UE.findAll({ where: { LayerId: id } }));
    if (ueError) {
        console.error(ueError);
        res.status(500).send('Internal Server Error');
        return;
    }

    return res.json(ues);
});

// Get UE by ID
router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const [ueError, ue] = await catchError(UE.findOne({ where: { id } }));
    if (ueError) {
        console.error(ueError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(ue);
});

// Update a UE
router.post('/:id', async (req, res) => {
    const id = req.params.id;
    const { ue } = req.body;
    const [ueError, ueData] = await catchError(UE.update(ue, { where: { id } }));
    if (ueError) {
        console.error(ueError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(ueData);
});

// Delete a UE
router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    const [ueError, ueData] = await catchError(UE.destroy({ where: { id } }));
    if (ueError) {
        console.error(ueError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(ueData);
});

export default router;