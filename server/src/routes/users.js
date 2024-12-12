const express = require('express');
const { User, Sequelize, sequelize } = require('../models');
const router = express.Router();
const bcrypt = require('bcrypt');
require('dotenv').config();

const createInitialAdmin = async () => {
    const adminCount = await User.count({ where: { Role: 'ADMIN' } });
    if (adminCount === 0) {
        const email = process.env.INITIAL_ADMIN_EMAIL;
        const password = process.env.INITIAL_ADMIN_PASSWORD;

        if (!email || !password) {
            console.error('INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD must be set in the environment variables');
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        try {
            await User.create({
                Email: email,
                Password: hashedPassword,
                FirstName: 'Initial',
                LastName: 'Admin',
                Role: 'ADMIN'
            });
            console.log('Initial admin user created');
        } catch (err) {
            console.error('Error creating initial admin user');
            console.error(err);
        }

        console.log('Initial admin user created');
    }
};

createInitialAdmin();


// Create a new user
router.post('/', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.Password, 10);
        req.body.Password = hashedPassword;

        const user = await User.create(req.body);
        res.json(user);
    } catch (err) {
        console.error(err.message);
        if (err.message.includes('duplicate key error')) {
            res.status(409).send('Email already exists');
        } else {
            res.status(500).send('Internal Server Error');
        }
    }
});

// Get users
router.get('/search/:searchQuery', async (req, res) => {
    const searchQuery = req.params.searchQuery;
    try {
        let users;
        if (searchQuery === 'all') {
            users = await User.findAll();
        } else {
            users = await User.findAll({
                where: {
                    [Sequelize.Op.or]: [
                        { FirstName: { [Sequelize.Op.like]: `%${searchQuery}%` } },
                        { LastName: { [Sequelize.Op.like]: `%${searchQuery}%` } },
                        { Email: { [Sequelize.Op.like]: `%${searchQuery}%` } }
                    ]
                }
            });
        }
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/get/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await User.findByPk(userId);
        if (!user) {
            res.status(404).send('User not found');
            return;
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
    }
});
router.put('/:id/password', async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await User.findByPk(userId);
        if (!user) {
            res.status(404).send('User not found');
            return;
        }
        const hashedPassword = await bcrypt.hash(req.body.Password, 10);
        await user.update({ Password: hashedPassword });
        res.send('Password updated successfully');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
    }
});

// Update a user
router.put('/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await User.findByPk(userId);
        if (!user) {
            res.status(404).send('User not found');
            return;
        }
        await user.update(req.body);
        res.send('User updated successfully');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
    }
});

// Delete a user
router.delete('/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await User.findByPk(userId);
        if (!user) {
            res.status(404).send('User not found');
            return;
        }
        await user.destroy();
        res.send('User deleted successfully');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;