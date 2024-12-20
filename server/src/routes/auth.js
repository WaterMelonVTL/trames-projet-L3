import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Sequelize, sequelize, Tokens, User } from '../models/index.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

dotenv.config();

const router = express.Router();
router.use(cookieParser());

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
console.log(accessTokenSecret);
console.log(refreshTokenSecret);

// Generate tokens
const generateAccessToken = (payload) => {
    return jwt.sign(payload, accessTokenSecret, { expiresIn: '15m' });
};

const generateRefreshToken = (payload) => {
    const refreshToken = jwt.sign(payload, refreshTokenSecret, { expiresIn: '7d' });
    try {
        Tokens.create({ Token: refreshToken, UserId: payload.UserId, Expire: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
    }
    catch (err) {
        console.error(err.message);
        return -1;
    }
    return refreshToken;
};

// Login endpoint
router.post('/login', async (req, res) => {
    const { Email, Password } = req.body;
    const user = await User.findOne({ where: { Email } });
    console.log(Email, Password);
    if (!user) {
        return res.status(401).send('Invalid email or password');
    }
    try {
        if (await bcrypt.compare(Password, user.Password)) {
            const userPayload = { UserId: user.Id, Role: user.Role };
            const accessToken = generateAccessToken(userPayload);
            const refreshToken = generateRefreshToken(userPayload);

            res.cookie('refreshToken', refreshToken, { 
                httpOnly: true, 
                secure: true, // Ensure this is true if using HTTPS
                sameSite: 'None' // Set SameSite to 'None' for cross-site requests
            });
            res.json({ accessToken, user });

        } else {
            res.status(401).send('Invalid credentials');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
    }
});

// Token refresh endpoint
router.post('/token', async (req, res) => {
    if (!req.cookies || !req.cookies.refreshToken) {
        return res.status(403).send('Refresh token not found, login again');
    }

    const refreshToken = req.cookies.refreshToken;

    jwt.verify(refreshToken, refreshTokenSecret, async (err, user) => {
        if (err) {
            return res.status(403).send('Invalid refresh token');
        }
        try {
            const token = await Tokens.findOne({ where: { Token: refreshToken } });
            if (!token) {
                return res.status(403).send('Refresh token not found in database');
            }
            if (token.Expire < new Date()) {
                return res.status(403).send('Refresh token expired');
            }

            console.log('Token:', token); // Log the token object

            const user = await User.findOne({ where: { Id: token.UserId } });
            if (!user) {
                return res.status(404).send('User not found');
            }

            console.log('User:', user); // Log the user object

            const accessToken = generateAccessToken({ UserId: user.Id, Role: user.Role });
            res.json({ accessToken, user });
        }
        catch (err) {
            console.error(err.message);
            res.status(500).send('Refresh Token has been terminated');
        }
    });
});

// Middleware to authenticate access tokens
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, accessTokenSecret, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }

        req.user = user;
        next();
    });
};

// Protected route example
router.get('/protected', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.sendStatus(403);
    }
    return res.send('This is a protected route');
});

// Logout endpoint
router.post('/logout', (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    refreshToken.delete(refreshToken);
    res.clearCookie('refreshToken');
    res.sendStatus(204);
});

export default router;