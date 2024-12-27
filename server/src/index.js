import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/users.js';
import coursRoutes from './routes/cours.js';
import profRoutes from './routes/profs.js';
import layerRoutes from './routes/layers.js';
import trammeRoutes from './routes/tramme.js';
import authRoutes from './routes/auth.js';
import contextRoutes from './routes/context.js';
import roomsRoutes from './routes/rooms.js';
import UERoutes from './routes/UE.js';

const app = express();
const port = process.env.PORT || 3000;
const ip = 'localhost';

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors({
    origin: ["http://localhost:5473", "http://localhost:5474", "http://localhost:3000"], 
    credentials: true // Allow credentials (cookies) to be sent
}));
app.use(cookieParser());

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profs', profRoutes);
app.use('/api/layers', layerRoutes);
app.use('/api/trammes', trammeRoutes);
app.use('/api/contexts', contextRoutes);
app.use('/api/UEs', UERoutes);
app.use('/api/cours', coursRoutes); 
app.use('/api/rooms', roomsRoutes);

app.listen(port, () => {
    console.log(`Server is running on http://${ip}:${port}`);
});
