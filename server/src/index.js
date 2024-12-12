const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');
const cookieParser = require('cookie-parser');
const ip = 'localhost';
// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors({
    origin: ["http://localhost:5473", "http://localhost:5474", "http://localhost:3000"], 
    credentials: true // Allow credentials (cookies) to be sent
}));
app.use(cookieParser());

// Import routes
const userRoutes = require('./routes/users');
const pictures = require('./routes/pictures');
const auth = require('./routes/auth');
//const coursRoutes = require('./routes/cours'); (exemple)


// Use routes

app.use('/api/users', userRoutes);
app.use('/api/pictures', pictures);
app.use('/api/auth', auth);
//app.use('/api/cours', coursRoutes); (exemple)




app.listen(port, () => {
    console.log(`Server is running on http://${ip}:${port}`);
});


