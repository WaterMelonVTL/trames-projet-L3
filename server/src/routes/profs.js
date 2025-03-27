import express from 'express';
import dotenv from 'dotenv';
import { catchError } from '../utils/HandleErrors.js';
import { Prof, Sequelize, sequelize } from '../models/index.js';
import chalk from "chalk";

dotenv.config();
const router = express.Router();

// Create a new prof
router.post('/', async (req, res) => {
    const { prof } = req.body;
    console.log(prof);
    const [profError, profData] = await catchError(Prof.create(prof));
    if (profError) {
        console.error(profError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(profData);
});

// Get all profs
router.get('/', async (req, res) => {
    const [profError, profData] = await catchError(Prof.findAll());
    if (profError) {
        console.error(profError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(profData);
});

// Search for profs
router.get('/search/:trameId/:searchQuery', async (req, res) => {
    console.log(chalk.blue("searching for profs"));
    const { trameId, searchQuery } = req.params;
    let profs;
    let profError;
    if (searchQuery === '%all%') {
        [profError, profs] = await catchError(Prof.findAll({
            where: { TrameId: trameId }
        }));
    } else {
        [profError, profs] = await catchError(Prof.findAll({
            where: {
                TrameId: trameId,
                [Sequelize.Op.or]: [
                    { FullName: { [Sequelize.Op.like]: `%${searchQuery}%` } }
                ]
            }
        }));
    }

    if (profError) {
        console.error(profError);
        res.status(500).send('Internal Server Error');
        return;
    }

    return res.json(profs);
});

// Get all the profs of a context
router.get('/context/:id', async (req, res) => {
    const id = req.params.id;
    const [profError, profs] = await catchError(Prof.findAll({ where: { ContextId: id } }));
    if (profError) {
        console.error(profError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(profs);
});

// Get a prof by id
router.get('/:id', async (req, res) => {
    const id = req.params.id;

    if (!id) {
        res.status(400).send('Id is required');
        return;
    }

    const [profError, prof] = await catchError(Prof.findByPk(id));
    if (profError) {
        console.error(profError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(prof);
});

// Update a prof
router.put('/:id', async (req, res) => {
    const id = req.params.id;
    const { prof } = req.body;

    if (!id) {
        res.status(400).send('Id is required');
        return;
    }

    const [profError, profData] = await catchError(Prof.findByPk(id));
    if (profError) {
        console.error(profError);
        res.status(500).send('Internal Server Error');
        return;
    }

    await profData.update(prof);
    return res.json(profData);
});

// Delete a prof
router.delete('/:id', async (req, res) => {
    const id = req.params.id;

    if (!id) {
        res.status(400).send('Id is required');
        return;
    }

    const [profError, profData] = await catchError(Prof.destroy({ where: { Id: id } }));
    if (profError) {
        console.error(profError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(profData);
});

export default router;
