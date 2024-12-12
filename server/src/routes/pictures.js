const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const { Image,Sequelize,sequelize } = require('../models');


const upload = multer({ storage: multer.memoryStorage() });

// Function to generate a hash for an image
function generateHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Function to save an image
async function saveImage(buffer, type, id) {
    const hash = generateHash(buffer);
    const imagesDir = path.join(__dirname, '../images');
    const imagePath = path.join(imagesDir, `${hash}.png`); // Assuming the file type is PNG

    // Ensure the images directory exists
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }

    fs.writeFileSync(imagePath, buffer);

    // Save hash, type, and id in the database
    await Image.create({ Hash: hash, Type: type, RefId: id });

    return hash;
}

// Function to retrieve an image
async function getImage(hash) {
    const imagePath = path.join(__dirname, '../images', hash);

    if (!fs.existsSync(imagePath)) {
        throw new Error('Image not found');
    }

    return fs.readFileSync(imagePath);
}

// Example usage
router.post('/upload', upload.array('pictures'), async (req, res) => {
    const { type, id} = req.body;
    const files = req.files;

    try {
        const hashes = await Promise.all(files.map(file => saveImage(file.buffer, type, id)));
        res.json({ hashes });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
    }
});
 
router.get('/:hash', async (req, res) => {
    const hash = req.params.hash;

    try {
        const imageBuffer = await getImage(hash);
        res.send(imageBuffer);
    } catch (err) {
        console.error(err.message);
        res.status(404).send('Image not found');
    }
});

router.get('/:type/:id', async (req, res) => {
    const type = req.params.type;
    const id = req.params.id;

    try {
        const images = await Image.findAll({ where: { Type: type, RefId: id } });
        images_url = images.map(image => {
            return image.Url ? image.Url : `http://localhost:3000/pictures/${image.Hash}.png`;
        })
        res.json(images_url);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/add', async (req, res) => {
    const { url, type, id } = req.body;
    try {
        const hash = url.split('/').pop().split('.')[0];
        await Image.create({ Hash: hash, Type: type, RefId: id, Url: url });
        res.send('Image added successfully');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
    }
});

router.delete('/:hash', async (req, res) => {
    var hash = req.params.hash;
    if (!hash) {
        res.status(400).send('Hash is required');
        return;
    }


    try {
        const imagePath = path.join(__dirname, '../images', hash);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        if (hash.split('.').length > 1) {
            hash = hash.split('.')[0];
        }

        Image.destroy({ where: { Hash: hash } });
        res.send('Image deleted successfully');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Internal Server Error');
    }
});



module.exports = router;