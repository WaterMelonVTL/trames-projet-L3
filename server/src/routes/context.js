const express = require('express');
require('dotenv').config();
const { catchError } = require('../utils/HandleErrors'); 
const { Context, Sequelize, sequelize } = require('../models');
const router = express.Router();

// Create a new Context
router.put('/', async (req, res) => {
    const { context, user } = req.body;
    const [contextError, contextData] = await catchError(Context.create(context));
    if (contextError) {
        console.error(contextError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(contextData);
});

// Get all Contexts
router.get('/', async (req, res) => {
    const [contextError, contextData] = await catchError(Context.findAll());
    if (contextError) {
        console.error(contextError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(contextData);
});

// Search Contexts by query
router.get('/search/:searchQuery', async (req, res) => {
    const searchQuery = req.params.searchQuery;
    let contexts;
    let contextError;
    if (searchQuery === 'all') {
        [contextError, contexts] = await catchError(Context.findAll());
    } else {
        [contextError, contexts] = await catchError(Context.findAll({
            where: {
                [Sequelize.Op.or]: [
                    { Name: { [Sequelize.Op.like]: `%${searchQuery}%` } }
                ]
            }
        }));
    }
    if (contextError) {
        console.error(contextError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(contexts);
});

// Get all Contexts of a User
router.get('/user/:id', async (req, res) => {
    const id = req.params.id;

    if (!id) {
        res.status(400).send('Id is required');
        return;
    }
    const [contextError, contexts] = await catchError(Context.findAll({ where: { Owner: id } }));
    if (contextError) {
        console.error(contextError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(contexts);
});

// Get a Context by ID
router.get('/:id', async (req, res) => {
    const id = req.params.id;

    if (!id) {
        res.status(400).send('Id is required');
        return;
    }

    const [contextError, contextData] = await catchError(Context.findByPk(id));

    if (contextError) {
        console.error(contextError);
        res.status(500).send('Internal Server Error');
        return;
    }

    return res.json(contextData);
});

// Update a Context by ID
router.put('/:id', async (req, res) => {
    const id = req.params.id;

    if (!id) {
        res.status(400).send('Id is required');
        return;
    }

    const [contextError, contextData] = await catchError(Context.findByPk(id));

    if (contextError) {
        console.error(contextError);
        res.status(500).send('Internal Server Error');
        return;
    }

    const [updateError, updatedContext] = await contextData.update(req.body);

    if (updateError) {
        console.error(updateError);
        res.status(500).send('Internal Server Error');
        return;
    }

    return res.json(updatedContext);
});

// Delete a Context by ID
router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    if (!id) {
        res.status(400).send('Id is required');
        return;
    }
    const [contextError, contextData] = await catchError(Context.findByPk(id));

    if (contextError) {
        console.error(contextError);
        res.status(500).send('Internal Server Error');
        return;
    }
    await contextData.destroy();
    return res.send('Context deleted successfully');
});

export default router;