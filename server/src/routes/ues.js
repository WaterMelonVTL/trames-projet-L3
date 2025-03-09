import express from 'express';
import dotenv from 'dotenv';
import { catchError } from '../utils/HandleErrors.js';
import { UE, Layer, CoursePool } from '../models/index.js';
import { Op } from 'sequelize';

dotenv.config();
const router = express.Router();

// Update the remainingpool route to include GroupId
router.get('/remainingpool/:layerId', async (req, res) => {
    const layerId = req.params.layerId;
    
    try {
        // Find layer
        const [layerError, layer] = await catchError(Layer.findOne({
            where: { Id: layerId },
            include: [{
                model: UE,
                include: [CoursePool]
            }]
        }));
        
        if (layerError) {
            console.error(layerError);
            return res.status(500).send('Internal Server Error');
        }
        
        if (!layer) {
            return res.status(404).send('Layer not found');
        }
        
        // Get regular groups for this layer
        const [groupsError, groups] = await catchError(layer.getGroups({ where: { IsSpecial: false } }));
        
        if (groupsError) {
            console.error(groupsError);
            return res.status(500).send('Internal Server Error');
        }
        
        const groupIds = groups.map(g => g.Id);
        
        // Get pooled hours with group information
        const [poolError, poolItems] = await catchError(CoursePool.findAll({
            where: {
                UEId: { [Op.in]: layer.UEs.map(ue => ue.Id) },
                GroupId: { [Op.in]: groupIds }
            },
            include: [{
                model: UE,
                required: true
            }]
        }));
        
        if (poolError) {
            console.error(poolError);
            return res.status(500).send('Internal Server Error');
        }
        
        return res.json(poolItems);
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
});

export default router;