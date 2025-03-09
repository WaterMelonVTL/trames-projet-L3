import express from 'express';
import dotenv from 'dotenv';
import { catchError } from '../utils/HandleErrors.js';
// Updated import to include Layer, Group, Prof and CoursePool
import { Course, Sequelize, sequelize, Layer, Group, Prof, CoursePool } from '../models/index.js';
import chalk from 'chalk';
import { Op } from 'sequelize';
dotenv.config();
const router = express.Router();

// Create a new Course
router.post('/', async (req, res) => {
    const { course, groups, separate } = req.body;
    if (!separate) {
        console.log("SEPARATE IS FALSE")
        console.log(course);
        console.log(groups);
        const groupIds = groups.map((group) => (group.Id));
        const [courseError, courseData] = await catchError(Course.create(course));
        if (courseError) {
            console.error(courseError);
            res.status(500).send('Internal Server Error');
            return;
        }
        if (groups && Array.isArray(groups) && groups.length > 0) {
            const [groupError, _] = await catchError(courseData.setGroups(groupIds));
            if (groupError) {
                console.error(groupError);
                res.status(500).send('Internal Server Error');
                return;
            }
            
            // Update CoursePool for each group if course date is not in 2001
            if (new Date(courseData.Date).getFullYear() !== 2001) {
                for (const group of groups) {
                    const [poolError, __] = await catchError(
                        CoursePool.decrement(
                            { Volume: course.length },
                            { 
                                where: { 
                                    UEId: courseData.UEId, 
                                    Type: courseData.Type,
                                    GroupId: group.Id
                                } 
                            }
                        )
                    );
                    if (poolError) {
                        console.error(`Error updating CoursePool for group ${group.Id}:`, poolError);
                        // Continue with other groups even if one fails
                    }
                }
            }
        } else {
            console.log(chalk.red('No groups provided'));
            const [deleteError, _] = await catchError(courseData.destroy());
            if (deleteError) {
                console.error(deleteError);
                res.status(500).send('Internal Server Error');
                return;
            }
            return res.status(400).send('No groups provided');
        }
        
        console.log(courseData);
        courseData.dataValues.Groups = groups;
        console.log(courseData);
        return res.json(courseData);
    } else {
        if (!groups || !Array.isArray(groups) || groups.length === 0) {
            console.log(chalk.red('No groups provided'));
            return res.status(400).send('No groups provided');
        }
        console.log("SEPARATE IS TRUE")
        const createdCourses = [];
        for (const g of groups) {
            console.log("GROUP : ", g);
            const [courseError, courseData] = await catchError(Course.create(course));
            if (courseError) {
                console.error(courseError);
                res.status(500).send('Internal Server Error');
                return;
            }
            const [groupError, _] = await catchError(courseData.setGroups(g.Id));
            if (groupError) {
                console.error("ERROR CREATING GROUP_COURSE relation : ", groupError);
                res.status(500).send('Internal Server Error');
                return;
            }
            
            // Update CoursePool for the specific group if course date is not in 2001
            if (new Date(courseData.Date).getFullYear() !== 2001) {
                const [poolError, __] = await catchError(
                    CoursePool.decrement(
                        { Volume: course.length },
                        { 
                            where: { 
                                UEId: courseData.UEId, 
                                Type: courseData.Type,
                                GroupId: g.Id
                            } 
                        }
                    )
                );
                if (poolError) {
                    console.error(`Error updating CoursePool for group ${g.Id}:`, poolError);
                }
            }
            
            console.log(courseData);
            courseData.dataValues.Groups = [g];
            console.log("CREATED COURSE FOR GROUP : ", g);
            createdCourses.push(courseData);
        }
        return res.json(createdCourses);
    }
});

router.post('/separate/:id', async (req, res) => {
    const id = req.params.id;
    const [courseError, course] = await catchError(Course.findOne({ where: { Id: id }, include: ['Groups'] }));
    if (courseError) {
        console.error(courseError);
        res.status(500).send('Internal Server Error');
        return;
    }
    if (!course) {
        console.log(chalk.red('Course not found'));
        return res.status(404).send('Course not found');
    }
    const groups = course.Groups;
    if (!groups || groups.length === 0) {
        console.log(chalk.red('No groups found'));
        return res.status(404).send('No groups found');
    }
    console.log(groups);
    const createdCourses = [];
    console.log(chalk.redBright('Creating courses for each group'));
    const { Id, ...newCourse } = course.dataValues;
    for (const g of groups) {
        const [courseError, courseData] = await catchError(Course.create(newCourse));
        if (courseError) {
            console.error(courseError);
            res.status(500).send('Internal Server Error');
            return;
        }
        console.log(chalk.redBright('Created course'));

        const [groupError, _] = await catchError(courseData.setGroups(g.dataValues.Id));
        if (groupError) {
            console.error(groupError);
            res.status(500).send('Internal Server Error');
            return;
        }
        console.log(chalk.redBright('Added course_group relation'));

        courseData.dataValues.Groups = [g];
        console.log(chalk.redBright('Added group to course'));
        console.log("\n");
        createdCourses.push(courseData);
    }
    course.destroy();
    console.log(chalk.redBright('Deleted original course'));
    return res.json(createdCourses);
});

router.post('/merge/:id', async (req, res) => {
    const id = req.params.id;
    const [findCourseError, course] = await catchError(Course.findOne({ where: { Id: id }, include: ['Groups'] }));
    if (findCourseError) {
        console.error(courseError);
        res.status(500).send('Internal Server Error');
        return;
    }
    if (!course) {
        console.log(chalk.red('Course not found'));
        return res.status(404).send('Course not found');
    }
    const courses = await Course.findAll({ where: { UEId: course.UEId, Date: course.Date, StartHour: course.StartHour }, include: ['Groups'] });
    if (!courses || courses.length === 0) {
        console.log(chalk.red('No courses found'));
        return res.status(404).send('No courses found');
    }
    const groups = courses.flatMap(c => c.Groups);
    if (!groups || groups.length === 0) {
        console.log(chalk.red('No groups found'));
        return res.status(404).send('No groups found');
    }
    const groupIds = groups.map(g => g.dataValues.Id);

    console.log("GROUPS : ", groups);
    const { Id, ...newCourse } = course.dataValues;

    const [courseError, courseData] = await catchError(Course.create(newCourse));
    if (courseError) {
        console.error(courseError);
        res.status(500).send('Internal Server Error');
        return;
    }
    console.log("GROUP IDS : ", groupIds);
    const [groupError, _] = await catchError(courseData.setGroups(groupIds));
    if (groupError) {
        console.error(courseError);
        res.status(500).send('Internal Server Error');
        return;
    }
    for (const c of courses) {
        c.destroy();
    }
    courseData.dataValues.Groups = groups;
    return res.json(courseData);
});

router.post('/customGroup/:id', async (req, res) => {
    const id = req.params.id;
    const [courseError, course] = await catchError(Course.findOne({
        where: { Id: id },
        include: [{
            model: Group,
            include: [Layer]
        }]
    }));
    if (courseError) {
        console.error(courseError);
        res.status(500).send('Internal Server Error');
        return;
    }
    if (!course) {
        console.log(chalk.red('Course not found'));
        return res.status(404).send('Course not found');
    }
    const layerId = course.Groups[0].Layers[0].Id;

    const [groupError, newGroup] = await catchError(Group.create({ Name: course.dataValues.Name, IsSpecial: true }));
    if (groupError) {
        console.error(groupError);
        res.status(500).send('Internal Server Error');
        return;
    }

    const [layerGroupError, __] = await catchError(newGroup.setLayers([layerId]));
    if (layerGroupError) {
        console.error(layerGroupError);
        res.status(500).send('Internal Server Error');
        return;
    }

    const [courseGroupError, _] = await catchError(course.setGroups([newGroup.Id]));
    if (courseGroupError) {
        console.error(courseGroupError);
        res.status(500).send('Internal Server Error');
        return;
    }

    const newCourse = { ...course.dataValues, Groups: [newGroup] };
    return res.json(newCourse);
});

router.post('/linkToLayer/:layerId/:courseId', async (req, res) => {
    const { layerId, courseId } = req.params;

    // Fetch destination layer
    const [layerError, destinationLayer] = await catchError(Layer.findOne({ where: { Id: layerId } }));
    if (layerError || !destinationLayer) {
        console.error(layerError || 'Layer not found');
        return res.status(404).send('Layer not found');
    }

    // Fetch course with associated groups and their layers
    const [courseError, course] = await catchError(
        Course.findOne({
            where: { Id: courseId },
            include: [{ model: Group, include: [Layer] }]
        })
    );
    if (courseError || !course) {
        console.error(courseError || 'Course not found');
        return res.status(404).send('Course not found');
    }

    // Assume the course has at least one group; pick the first one.
    let currentGroup = course.Groups && course.Groups.length ? course.Groups[0] : null;
    if (!currentGroup) {
        return res.status(404).send('No group assigned to course');
    }

    // If current group is not special, create a custom group and use it.
    if (!currentGroup.IsSpecial) {
        const currentLayerId = currentGroup.Layers && currentGroup.Layers.length ? currentGroup.Layers[0].Id : null;
        if (!currentLayerId) {
            return res.status(404).send('Current layer not found');
        }
        const [groupError, newGroup] = await catchError(Group.create({ Name: course.dataValues.Name, IsSpecial: true }));
        if (groupError) {
            console.error(groupError);
            return res.status(500).send('Internal Server Error');
        }
        // Assign both the current layer and the provided layerId to the new custom group.
        const [setLayerError, __] = await catchError(newGroup.setLayers([currentLayerId, layerId]));
        if (setLayerError) {
            console.error(setLayerError);
            return res.status(500).send('Internal Server Error');
        }
        const [courseGroupError, _] = await catchError(course.setGroups([newGroup.Id]));
        if (courseGroupError) {
            console.error(courseGroupError);
            return res.status(500).send('Internal Server Error');
        }
        currentGroup = newGroup;
    } else {
        // If already special, ensure the provided layer is in its associated layers.
        const existingLayerIds = currentGroup.Layers.map(l => l.Id);
        if (!existingLayerIds.includes(layerId)) {
            const newLayerIds = Array.from(new Set([...existingLayerIds, layerId]));
            const [updateLayerError, __] = await catchError(currentGroup.setLayers(newLayerIds));
            if (updateLayerError) {
                console.error(updateLayerError);
                return res.status(500).send('Internal Server Error');
            }
        }
    }
    return res.json(course);
});

// Route 1: Restore default groups for a course with a special group
router.post('/restoreDefaultGroups/:courseId', async (req, res) => {
    const { courseId } = req.params;
    // Fetch course with its groups and layers for each group
    const [courseError, course] = await catchError(
        Course.findOne({ where: { Id: courseId }, include: [{ model: Group, include: [Layer] }] })
    );
    if (courseError || !course) {
        console.error(courseError || 'Course not found');
        return res.status(404).send('Course not found');
    }

    // Find a special group within course's groups
    const specialGroup = course.Groups.find(g => g.IsSpecial);
    if (!specialGroup) {
        return res.status(400).send('No special group found on this course');
    }

    // Assume the special group is associated with at least one layer; pick the first one.
    const associatedLayer = specialGroup.Layers && specialGroup.Layers.length ? specialGroup.Layers[0] : null;
    if (!associatedLayer) {
        return res.status(404).send('No layer associated with the special group');
    }

    // Get default groups: groups associated with the layer that are not special
    const [layerGroupsError, layerGroups] = await catchError(
        associatedLayer.getGroups()
    );
    if (layerGroupsError || !layerGroups) {
        console.error(layerGroupsError || 'No groups found for the layer');
        return res.status(404).send('No groups found for the layer');
    }
    const defaultGroups = layerGroups.filter(g => !g.IsSpecial);
    if (!defaultGroups.length) {
        return res.status(400).send('No default groups available');
    }
    const defaultGroupIds = defaultGroups.map(g => g.Id);
    
    // Assign default groups to the course
    const [setGroupsError, _] = await catchError(course.setGroups(defaultGroupIds));
    if (setGroupsError) {
        console.error(setGroupsError);
        return res.status(500).send('Internal Server Error');
    }

    // Destroy the special group
    const [destroyError, __] = await catchError(specialGroup.destroy());
    if (destroyError) {
        console.error(destroyError);
        return res.status(500).send('Internal Server Error');
    }
    return res.json({ message: 'Default groups assigned and special group removed', defaultGroups });
});

// Route 2: Unlink a group from a layer
router.post('/unlinkGroup/:groupId/:layerId', async (req, res) => {
    const { groupId, layerId } = req.params;
    // Fetch the group
    const [groupError, group] = await catchError(Group.findOne({ where: { Id: groupId } }));
    if (groupError || !group) {
        console.error(groupError || 'Group not found');
        return res.status(404).send('Group not found');
    }
    // Unlink the association with the layer
    const [unlinkError, __] = await catchError(group.removeLayer(layerId));
    if (unlinkError) {
        console.error(unlinkError);
        return res.status(500).send('Internal Server Error');
    }
    return res.json({ message: 'Group unlinked from layer' });
});

// Search for Courses by layer ID and search query
router.get('/search/layer/:Layer/:searchQuery', async (req, res) => {
    const searchQuery = req.params.searchQuery;
    const layerId = req.params.Layer;
    try {
        // Find the layer by its id
        const layer = await Layer.findOne({ where: { Id: layerId } });
        if (!layer) return res.status(404).send('Layer not found');
        // Get associated groups from the layer
        const groups = await layer.getGroups();
        const groupIds = groups.map(group => group.Id);
        if (groupIds.length === 0) return res.json([]);
        // Build the condition for courses based on groupIds and search query
        let whereCondition = { GroupId: { [Sequelize.Op.in]: groupIds } };
        if (searchQuery !== 'all') {
            whereCondition = {
                ...whereCondition,
                Name: { [Sequelize.Op.like]: `%${searchQuery}%` }
            };
        }
        const [courseError, courses] = await catchError(Course.findAll({ where: whereCondition }));
        if (courseError) {
            console.error(courseError);
            return res.status(500).send('Internal Server Error');
        }
        return res.json(courses);
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
    }
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
    const layerId = req.params.id;
    try {
        // Find the layer by its id
        const layer = await Layer.findOne({ where: { Id: layerId } });
        if (!layer) return res.status(404).send('Layer not found');
        // Get associated groups from the layer
        const groups = await layer.getGroups();
        const groupIds = groups.map(group => group.Id);
        if (groupIds.length === 0) return res.json([]);
        const [courseError, courses] = await catchError(Course.findAll({
            where: { GroupId: { [Sequelize.Op.in]: groupIds } }
        }));
        if (courseError) {
            console.error(courseError);
            return res.status(500).send('Internal Server Error');
        }
        return res.json(courses);
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
    }
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

// Get all Course for a specific Teacher
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
    console.log(chalk.green(courses));
    return res.json(courses);
});

// Modified: get all Courses by date (apply group filtering based on LayerId using belongsToMany relation)
router.get('/date/:TrammeId/:LayerId/:date', async (req, res) => {
    const { TrammeId, LayerId, date } = req.params;

    /* EVENTUELLEMENT OPTIMISER AVEC : 
        SELECT c.*
        FROM Courses c
        JOIN Course_Groups cg ON c.Id = cg.CourseId
        JOIN Layer_Groups lg ON cg.GroupId = lg.GroupId
        WHERE lg.LayerId = ? 
        AND DATE(c.Date) = ?
    */

    try {
        let groupIds = [];

        if (LayerId === 'all') {
            const layers = await Layer.findAll({ where: { TrammeId } });
            if (!layers || layers.length === 0) return res.json([]);
            for (const layer of layers) {
                const groups = await layer.getGroups();
                groupIds.push(...groups.map(group => group.Id));
            }
        } else {
            const layer = await Layer.findOne({ where: { Id: LayerId } });
            if (!layer) return res.status(404).send('Layer not found');
            const groups = await layer.getGroups();
            groupIds = groups.map(group => group.Id);
        }

        if (groupIds.length === 0) return res.json([]);

        // Build the date condition
        const whereDateCondition = sequelize.where(sequelize.fn('DATE', sequelize.col('Date')), date);

        const [courseError, courses] = await catchError(
            Course.findAll({
                where: whereDateCondition,
                include: [{
                    model: Group,
                    where: { Id: { [Op.in]: groupIds } },
                    through: { attributes: [] }
                }]
            })
        );

        if (courseError) {
            console.error('Error fetching courses:', courseError);
            return res.status(500).send('Internal Server Error');
        }
        return res.json(courses);
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
    }
});

// NEW: Get all Courses for a specific Group
router.get('/group/:id', async (req, res) => {
    const groupId = req.params.id;
    try {
        const group = await Group.findOne({ where: { Id: groupId } });
        if (!group) return res.status(404).send('Group not found');
        const [courseError, courses] = await catchError(Course.findAll({ where: { GroupId: groupId } }));
        if (courseError) {
            console.error(courseError);
            return res.status(500).send('Internal Server Error');
        }
        return res.json(courses);
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
    }
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

// Update a Course by ID
router.put('/:id', async (req, res) => {
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
    // Fetch the course first with associated groups
    const [findError, courseToDelete] = await catchError(
        Course.findOne({ 
            where: { id },
            include: ['Groups'] 
        })
    );
    
    if (findError || !courseToDelete) {
        console.error(findError || 'Course not found');
        return res.status(404).send('Course not found');
    }
    
    // Update CoursePool for each associated group if course date is not in 2001
    if (new Date(courseToDelete.Date).getFullYear() !== 2001 && 
        courseToDelete.Groups && courseToDelete.Groups.length > 0) {
        
        for (const group of courseToDelete.Groups) {
            const [poolError, __] = await catchError(
                CoursePool.increment(
                    { Volume: courseToDelete.length },
                    { 
                        where: { 
                            UEId: courseToDelete.UEId, 
                            Type: courseToDelete.Type,
                            GroupId: group.Id 
                        } 
                    }
                )
            );
            if (poolError) {
                console.error(`Error updating CoursePool for group ${group.Id}:`, poolError);
                // Continue with other groups even if one fails
            }
        }
    }
    
    const [courseError, courseData] = await catchError(Course.destroy({ where: { id } }));
    if (courseError) {
        console.error(courseError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(courseData);
});

export default router;
