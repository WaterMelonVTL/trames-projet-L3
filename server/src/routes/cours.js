const express = require('express');
require('dotenv').config();
const { catchError } = require('../utils/HandleErrors'); 
const { Course, Sequelize, sequelize } = require('../models');
const router = express.Router();


// Create a new Course
router.put('/', async (req, res) => {
    const { course, user } = req.body;
    const [courseError, courseData] = await catchError(Course.create(course));
    if (courseError) {
        console.error(courseError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(courseData);
});

// Get all Courses
router.get('/', async (req, res) => {
    const [courseError, courseData] = await catchError(Course.findAll());
    if (courseError) {
        console.error(courseError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(courseData);
});

// Search for Courses by layer ID and search query
router.get('/search/layer/:Layer/:searchQuery', async (req, res) => {
    const searchQuery = req.params.searchQuery;
    const Layer = req.params.Layer;
    let courses, courseError;
    if (searchQuery === 'all') {
        [courseError, courses] = await catchError(Course.findAll({
            where: {
                LayerId: Layer
            }
        }));
    } else {
        [courseError, courses] = await catchError(Course.findAll({
            where: {
                LayerId: Layer,
                [Sequelize.Op.or]: [
                    { Name: { [Sequelize.Op.like]: `%${searchQuery}%` } }
                ]
            }
        }));
    }

    if (courseError) {
        console.error(courseError);
        res.status(500).send('Internal Server Error');
        return;
    }

    return res.json(courses);
});

// Search for courses by Tramme ID and search query
router.get('/search/tramme/:id/:searchQuery', async (req, res) => {
    const searchQuery = req.params.searchQuery;
    const id = req.params.id;
    let courses, courseError;
    if (searchQuery === 'all') {
        [courseError, courses] = await catchError(Course.findAll({
            where: {
                TrammeId: id
            }
        }));
    } else {
        [courseError, courses] = await catchError(Course.findAll({
            where: {
                TrammeId: id,
                [Sequelize.Op.or]: [
                    { Name: { [Sequelize.Op.like]: `%${searchQuery}%` } }
                ]
            }
        }));
    }

    if (courseError) {
        console.error(courseError);
        res.status(500).send('Internal Server Error');
        return;
    }

    return res.json(courses);
});

// Get all Courses of a specific Layer
router.get('/layer/:id', async (req, res) => {
    const id = req.params.id;
    const [courseError, courses] = await catchError(Course.findAll({ where: { LayerId: id } }));
    if (courseError) {
        console.error(courseError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(courses);
});

// Get all Courses of a specific Tramme
router.get('/tramme/:id', async (req, res) => {
    const id = req.params.id;
    const [courseError, courses] = await catchError(Course.findAll({ where: { TrammeId: id } }));
    if (courseError) {
        console.error(courseError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(courses);
});

// Get all  Course for a specific Teacher
router.get('/teacher/:id', async (req, res) => {
    const id = req.params.id;
    const [courseError, courses] = await catchError(Course.findAll({
        include: [{
            model: Prof,
            as: 'Teachers',
            where: { id }
        }]
    }));
    if (courseError) {
        console.error(courseError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(courses);
});

// Get all Courses for a specific UE
router.get('/UE/:id', async (req, res) => {
    const id = req.params.id;
    const [courseError, courses] = await catchError(Course.findAll({ where: { UEId: id } }));
    if (courseError) {
        console.error(courseError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(courses);
});

// Get a specific Course by ID
router.get('/:id', async (req, res) => {
    const id = req.params.id;
    const [courseError, course] = await catchError(Course.findOne({ where: { id } }));
    if (courseError) {
        console.error(courseError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(course);
});

// Update a Course by ID
router.post('/:id', async (req, res) => {
    const id = req.params.id;
    const { course } = req.body;
    const [courseError, courseData] = await catchError(Course.update(course, { where: { id } }));
    if (courseError) {
        console.error(courseError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(courseData);
});

// Delete a Course by ID
router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    const [courseError, courseData] = await catchError(Course.destroy({ where: { id } }));
    if (courseError) {
        console.error(courseError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(courseData);
});




