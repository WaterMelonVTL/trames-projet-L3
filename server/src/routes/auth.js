import express from 'express';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

import { User, Tokens } from '../models/index.js';

const router = express.Router();

// Token generation utility functions
const generateAccessToken = async (payload) => {
    const TOKEN_SECRET = process.env.TOKEN_SECRET;
    console.log('TOKEN_SECRET : ', TOKEN_SECRET);
    const secretKey = new TextEncoder().encode(TOKEN_SECRET);
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('15m')
        .sign(secretKey);
};

const generateEmailToken = async (email) => {
    const TOKEN_SECRET = process.env.TOKEN_SECRET;
    const secretKey = new TextEncoder().encode(TOKEN_SECRET);
    return await new SignJWT({ Email: email })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('2h')
        .sign(secretKey);
};

const generateRefreshToken = async (payload) => {
    const TOKEN_SECRET = process.env.TOKEN_SECRET;
    const secretKey = new TextEncoder().encode(TOKEN_SECRET);
    const refreshToken = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(secretKey);

    try {
        const expireDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await Tokens.create({ Token: refreshToken, UserId: payload.UserId, Expire: expireDate });
        
    } catch (err) {
        console.error(err.message);
        return -1;
    }
    return refreshToken;
};

// Login route
router.post('/login', async (req, res) => {
    const { Email, Password, Admin, RememberMe } = req.body;
    if (!Email || !Password) {
        return res.status(400).send('Missing required fields');
    }

    try {
        const user = await User.findOne({ where: { Email } });
        if (!user) {
            return res.status(404).send('User not found');
        }
        if (Admin && user.Role !== 'ADMIN') {
            console.log('Unauthorized, not an admin');
            return res.status(401).send('Unauthorized');
        }

        /*if (!Admin && !user.VerifiedEmailSince) {
            return res.status(401).json({ Error: "not verified", Email });
        }
        */
        const isValid = await bcrypt.compare(Password, user.Password);

        if (!isValid) {
            console.log('Invalid password');
            return res.status(401).send('Invalid password');
        }

        const accessToken = await generateAccessToken({ UserId: user.Id, Role: user.Role });
        const refreshToken = await generateRefreshToken({ UserId: user.Id, Role: user.Role });

        if (refreshToken === -1) {
            console.log('Server error : could not generate refresh token');
            return res.status(500).send('Internal Server Error');
        }

        // Conditionally set cookie options based on rememberMe flag
        if (RememberMe) {
            console.log('rememberMe is true');
            const maxAge = 7 * 24 * 60 * 60 * 1000; // persistent cookie for 7 days
            res.cookie('refreshToken', refreshToken, { 
                httpOnly: true, 
                secure: true, 
                sameSite: 'none', 
                path: '/', 
                maxAge 
            });
        } else {
            console.log('rememberMe is false');
            // Session cookie: no maxAge attribute makes the cookie last until browser close
            res.cookie('refreshToken', refreshToken, { 
                httpOnly: true, 
                secure: true, 
                sameSite: 'none', 
                path: '/' 
            });
        }

        console.log('login success, set the cookies and return the response');
        return res.json({ accessToken, user: { user } });
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Internal Server Error');
    }
});

// Signup route
router.post('/signup', async (req, res) => {
    const userData = req.body;

    if (!userData.FirstName || !userData.LastName || !userData.Email || !userData.Password) {
        return res.status(400).send('Missing required fields');
    }

    try {
        const hashedPassword = await bcrypt.hash(userData.Password, 10);
        const user = await User.create({ ...userData, Password: hashedPassword });
        
        //const emailToken = await generateEmailToken(userData.Email);
        //const clientAdress = req.headers.origin;
        //const emailUrl = `${clientAdress}/verify/${emailToken}`;
        //console.log(emailUrl); // for dev purposes, replace by an email for production

        const newUser = { Email: userData.Email, FirstName: userData.FirstName };
        return res.status(201).json(newUser);
    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Internal Server Error');
    }
});

// Token refresh route
router.post('/token', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
        console.log('No refresh token found in cookies');
        return res.status(400).send('No refresh token found');
    }

    try {
        const TOKEN_SECRET = process.env.TOKEN_SECRET;
        const secretKey = new TextEncoder().encode(TOKEN_SECRET);
        
        const decoded = await jwtVerify(refreshToken, secretKey);
        
        const tokenFromDB = await Tokens.findOne({ where: { Token: refreshToken } });
        
        if (!tokenFromDB) {
            console.log('Token not found in database');
            return res.status(404).send('Token not found in database');
        }
        
        if (new Date(tokenFromDB.Expire) < new Date()) {
            return res.status(401).send('Token expired');
        }
        
        const user = await User.findByPk(tokenFromDB.UserId);
        
        if (!user) {
            console.log('User not found');
            return res.status(404).send('User not found');
        }
        
        const newAccessToken = await generateAccessToken({ UserId: user.Id, Role: user.Role });
        return res.json({ accessToken: newAccessToken });
    } catch (err) {
        console.error(err.message);
        return res.status(401).send('Invalid refresh token');
    }
});

// Logout route
router.post('/logout', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
        try {
            await Tokens.destroy({ where: { Token: refreshToken } });
        } catch (err) {
            console.error('Error deleting token:', err);
        }
    }
    
    res.clearCookie('refreshToken', { 
        httpOnly: true, 
        secure: true, 
        sameSite: 'none', 
        path: '/' 
    });
    
    return res.json({ message: 'Logged out successfully' });
});

// Auth status check route
router.get('/status', async (req, res) => {
    try {
        // This would need to be adapted to use Express middleware for authentication
        // For now, we'll assume a simple check based on a token in authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.json({ isAdmin: false });
        }
        
        const token = authHeader.split(' ')[1];
        const TOKEN_SECRET = process.env.TOKEN_SECRET;
        const secretKey = new TextEncoder().encode(TOKEN_SECRET);
        
        try {
            const decoded = await jwtVerify(token, secretKey);
            const payload = decoded.payload;
            
            if (payload.Role === 'ADMIN') {
                return res.json({ isAdmin: true, user: payload });
            } else {
                return res.json({ isAdmin: false });
            }
        } catch (err) {
            return res.json({ isAdmin: false });
        }
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Internal Server Error');
    }
});

// Email verification routes - keeping the original commented logic
router.post('/verify-email', async (req, res) => {
    // The commented-out version of the original email verification logic:
    /*
    const { token } = req.body;
    const TOKEN_SECRET = process.env.TOKEN_SECRET;
    const secretKey = new TextEncoder().encode(TOKEN_SECRET);

    if (!token) {
        console.log('Token not found');
        return res.status(400).send('Token not found');
    }

    console.log('token : ', token);

    try {
        const payload = await jwtVerify(token, secretKey);
        const Email = payload.payload.Email;
        console.log(Email)
        const date = new Date(Date.now()).toISOString();
        // Check if the email is already verified: TODO
        await User.update({ VerifiedEmailSince: date }, { where: { Email } });
        console.log('Email verified');
        return res.status(200).send('Email verified');
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Internal Server Error');
    }
    */
    return res.status(200).send('Email verification endpoint');
});

router.post('/email', async (req, res) => {
    // The commented-out version of the original resend email logic:
    /*
    const { Email } = req.body;

    if (!Email) {
        console.log('Email not found');
        return res.status(400).send('Email not found');
    }

    try {
        const user = await User.findOne({ where: { Email } });

        if (!user) {
            console.log('No user with this email');
            return res.status(404).send('No user with this email');
        }

        if (user.VerifiedEmailSince) {
            console.log('Email already verified');
            return res.status(400).send('Email already verified');
        }

        const emailToken = await generateEmailToken(Email);

        const clientAddress = req.headers.origin;
        console.log(req.headers);
        const emailUrl = `${clientAddress}/verify/${emailToken}`;

        console.log(emailUrl); // for dev purposes, replace by an email for production

        return res.status(200).send('Email sent');
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Internal Server Error');
    }
    */
    return res.status(200).send('Resend email endpoint');
});

export default router;


