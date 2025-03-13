import express from 'express';
import dotenv from 'dotenv';
import { catchError } from '../utils/HandleErrors.js';
import { UE, Layer, Sequelize, CoursePool } from '../models/index.js';
import chalk from 'chalk';

dotenv.config();
const router = express.Router();


// Create multiple UEs
router.post('/bulk', async (req, res) => {
    const { ues } = req.body;
    console.log(ues);
    if (!Array.isArray(ues)) {
        console.log(" ues must be an array");
        return res.status(400).send('ues must be an array');
    }


    const [ueError, ueData] = await catchError(UE.bulkCreate(ues));
    if (ueError) {
        console.error(ueError);
        res.status(500).send('Internal Server Error');
        return;
    }

    console.log(chalk.red(`Created ${ues.length} UEs`));
    return res.json(ueData);
});

// Create a new UE
router.post('/', async (req, res) => {
    const { ue, user } = req.body;
    
    // Log the received data to debug boolean fields
    console.log('Received UE data:', JSON.stringify(ue, null, 2));
    
    // Ensure boolean fields are properly parsed
    if (ue.TD_NeedInformaticRoom !== undefined) {
        ue.TD_NeedInformaticRoom = Boolean(ue.TD_NeedInformaticRoom);
    }
    
    if (ue.TP_NeedInformaticRoom !== undefined) {
        ue.TP_NeedInformaticRoom = Boolean(ue.TP_NeedInformaticRoom);
    }
    
    console.log('Processed UE data:', JSON.stringify(ue, null, 2));

    const [ueError, ueData] = await catchError(UE.create(ue));
    if (ueError) {
        console.error(ueError);
        res.status(500).send('Internal Server Error');
        return;
    }

    console.log('Created UE:', JSON.stringify(ueData, null, 2));
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

router.get('/remainingpool/:id', async (req, res) => {
    const id = req.params.id;
    const [ueError, ues] = await catchError(UE.findAll({ where: { LayerId: id } }));
    if (ueError) {
        console.error(ueError);
        res.status(500).send('Internal Server Error');
        return;
    }
    let remainingPool = [];
    for (let ue of ues) {
        const [poolError, pool] = await catchError(CoursePool.findAll({ where: { UEId: ue.Id } }));
        if (poolError) {
            console.error(poolError);
            res.status(500).send('Internal Server Error');
            return;
        }
        for (let p of pool) {
            p.dataValues.UE = ue;
            remainingPool.push(p);
        }
    }
    if (remainingPool.length === 0) {
        res.status(404).send('No remaining pool found');
        return;
    }


    return res.json(remainingPool);
});

//update a UE    
router.put('/:id', async (req, res) => {
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