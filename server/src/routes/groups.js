import express from 'express';
import dotenv from 'dotenv';
import { catchError } from '../utils/HandleErrors.js';
import { Group, Course, Layer, Sequelize, sequelize } from '../models/index.js';

dotenv.config();

const router = express.Router();

// Create a new group
router.post('/', async (req, res) => {
    const data = await req.body;

    console.log(data);
    const { group } = data;
    const [groupError, groupData] = await catchError(Group.create(group));
    if (groupError) {
        console.error("ERROR CREATING GROUP : ", groupError);
        res.status(500).send('Internal Server Error');
        return;
    }
    const [layerError, layer] = await catchError(Layer.findByPk(group.LayerId));
    if (layerError) {
        console.error("ERROR FINDING THE LAYER : ", layerError);
        res.status(500).send('Internal Server Error');
        return;
    }
    if (!layer) {
        console.error("Layer not found");
        res.status(404).send('Layer not found');
        return;
    }
    console.log(groupData);
    const [groupLayerError, groupLayerData] = await catchError(groupData.addLayer(layer));
    console.log(groupLayerData);
    
    if (groupLayerError) {
        console.error("ERROR CREATING GROUP-LAYER ASSOS : ",groupLayerError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(groupData);
});

// Get all groups (for testing purposes)
router.get('/', async (req, res) => {
    const [groupError, groupData] = await catchError(Group.findAll());
    if (groupError) {
        console.error(groupError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(groupData);
});

// Search groups by property and search query
router.get('/search/:property/:searchQuery', async (req, res) => {
    const { property, searchQuery } = req.params;
    let groups, groupError;

    if (searchQuery === 'all') {
        [groupError, groups] = await catchError(Group.findAll());
    } else {
        [groupError, groups] = await catchError(Group.findAll({
            where: {
                [property]: { [Sequelize.Op.like]: `%${searchQuery}%` }
            }
        }));
    }

    if (groupError) {
        console.error(groupError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(groups);
});

// Get all groups for a specific layer
router.get('/layer/:id', async (req, res) => {
    const id = req.params.id;
    const onlyDefault = req.query.onlyDefault;
    console.log(onlyDefault);
    if (!id) {
        res.status(400).send('Layer Id is required');
        return;
    }
    const [layerError, layer] = await catchError(Layer.findByPk(id, {
        include: [{
            model: Group,
            through: { attributes: [] } // This excludes the join table attributes
        }]
    }));
    if (layerError) {
        console.error(layerError);
        res.status(500).send('Internal Server Error');
        return;
    }
    if (!layer) {
        res.status(404).send('Layer not found');
        return;
    }
    if (onlyDefault === 'true') {
        const defaultGroups = layer.Groups.filter(group => group.dataValues.IsSpecial === false);
        console.log(defaultGroups);
        return res.json(defaultGroups);
    }
    return res.json(layer.Groups);
});

// Get all groups for a specific course
router.get('/course/:id', async (req, res) => {
    const id = req.params.id;
    if (!id) {
        res.status(400).send('Course Id is required');
        return;
    }
    const [courseError, course] = await catchError(Course.findByPk(id, {
        include: [{
           model: Group
        }]
    }));
    if (courseError) {
        console.error(courseError);
        res.status(500).send('Internal Server Error');
        return;
    }
    if (!course) {
        res.status(404).send('Course not found');
        return;
    }
    return res.json(course.Groups);
});

// Get a specific group by ID
router.get('/:id', async (req, res) => {
    const id = req.params.id;
    if (!id) {
        res.status(400).send('Id is required');
        return;
    }
    const [groupError, group] = await catchError(Group.findByPk(id));
    if (groupError) {
        console.error(groupError);
        res.status(500).send('Internal Server Error');
        return;
    }
    if (!group) {
        res.status(404).send('Group not found');
        return;
    }
    return res.json(group);
});

// Update a specific group by ID
router.put('/:id', async (req, res) => {
    const id = req.params.id;
    if (!id) {
        res.status(400).send('Id is required');
        return;
    }
    const group = req.body;
    const [groupError, groupData] = await catchError(Group.update(group, { where: { Id: id } }));
    if (groupError) {
        console.error(groupError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(groupData);
});

// Delete a specific group by ID
router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    if (!id) {
        res.status(400).send('Id is required');
        return;
    }
    const [groupError, groupData] = await catchError(Group.destroy({ where: { Id: id } }));
    if (groupError) {
        console.error(groupError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(groupData);
});

export default router;
