import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/users.js';
import coursRoutes from './routes/cours.js';
import profRoutes from './routes/profs.js';
import layerRoutes from './routes/layers.js';
import trammeRoutes from './routes/tramme.js';
import authRoutes from './routes/auth.js';
import UERoutes from './routes/UE.js';
import groupRoutes from './routes/groups.js';

const app = express();
const port = process.env.PORT || 3000;
const ip = 'localhost';

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors({
    origin: (origin, callback) => {
        callback(null, origin || '*');
    },
    credentials: true
}));

app.use(cookieParser());

let requestCount = 0;
app.use((req, res, next) => {
    requestCount++;
    res.on('finish', () => {
        const status = res.statusCode;
        const bgColor = (status >= 200 && status < 300) ? '\x1b[42m' : '\x1b[41m'; // green or red background
        // Use ANSI code 53 for overline along with bold white text (if supported)
        const textStyle = '\x1b[53;1;37m';
        const reset = '\x1b[0m';
        const methodStyle = '\x1b[1;33m'; // Bold yellow for method
        const urlColor = '\x1b[1;32m';    // Bold bright green for URL
        const popStyleStart = '\x1b[45m\x1b[1m';
        const popStyleEnd = reset;
        // Print the status code directly with the new style
        console.log(`${popStyleStart}${bgColor}${textStyle}[${status}]${reset} : ${methodStyle}${req.method}${reset} ${urlColor}${req.headers.host}${req.originalUrl}${popStyleEnd}`);
    });
    next();
});

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profs', profRoutes);
app.use('/api/layers', layerRoutes);
app.use('/api/trammes', trammeRoutes);
app.use('/api/UEs', UERoutes);
app.use('/api/cours', coursRoutes); 
app.use('/api/groups', groupRoutes); // added new groups route

// Function to print the number of requests every minute
setInterval(() => {
    console.log(`Number of requests in the last minute: ${requestCount}`);
    requestCount = 0;
}, 60000);

app.listen(port, () => {
    console.log(`Server is running on http://${ip}:${port}`);
});

