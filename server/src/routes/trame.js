import express from 'express';
import dotenv from 'dotenv';
import { catchError } from '../utils/HandleErrors.js';
import { Trame, Sequelize, Layer, Course, Group, UE, DesignatedDays, CoursePool, Prof, Events, Conflicts } from '../models/index.js';
import chalk from 'chalk';
import { json } from 'sequelize';

dotenv.config();
const router = express.Router();

// In-memory store for tracking duplication progress
const duplicationProgress = {};

// Create a new trame
router.post('/', async (req, res) => {
    const { data, user } = req.body; // user est à récupérer depuis le token pour sécuriser la création
    const trame = {
        Name: data.Name,
        ContextId: data.ContextId,
        Owner: user.Id,
    };
    const [trameError, trameData] = await catchError(Trame.create(trame));
    if (trameError) {
        console.error(trameError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(trameData);
});

// Add designated days
router.put('/addDesignatedDays', async (req, res) => {
    console.log("DesignatedDays route hit!");
    const { trameId, designatedDays } = req.body;

    try {
        console.log(`MAJ jours banalisés pour trameId: ${trameId}`, designatedDays);

        // Nettoyer s'il y a des jours existants
        const existingDays = await DesignatedDays.findAll({ where: { trameId } });

        if (existingDays.length > 0) {
            await DesignatedDays.destroy({ where: { trameId } });
        }

        // Création des jours banalisés
        const newDesignatedDays = await DesignatedDays.bulkCreate(
            designatedDays.map(day => ({ TrameId: trameId, Day: day }))
        );

        res.status(200).json(newDesignatedDays);
    } catch (error) {
        console.error("Erreur lors de l'insertion des jours banalisés:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.put('/pool', async (req, res) => {
    const { ueId, groupIds, type, change } = req.body;

    if (!ueId || !groupIds || !type || !change) {
        res.status(400).send('All fields are required');
        return;
    }
    let coursePools = [];

    for (const group of groupIds) {

        const [coursePoolError, coursePool] = await catchError(CoursePool.findOne({
            where: {
                UEId: ueId,
                GroupId: group.Id,
                Type: type
            }
        }));
        if (coursePoolError) {
            console.error(coursePoolError);
            res.status(500).send('Internal Server Error');
            return;
        }
        if (!coursePool) {
            res.status(404).send('Course pool not found');
            return;
        }
        const newVolume = coursePool.Volume + change;

        const [updateError, updatedCoursePool] = await catchError(coursePool.update({
            Volume: newVolume
        }));

        if (updateError) {
            console.error(updateError);
            res.status(500).send('Internal Server Error');
            return;
        }
        coursePools.push(updatedCoursePool);
    }
    return res.json(coursePools);
});

// Get designated days by trameId
router.get('/:trameId/designatedDays', async (req, res) => {
    try {
        const { trameId } = req.params;

        const designatedDays = await DesignatedDays.findAll({
            where: { TrameId: trameId }
        });
        return res.json(designatedDays);
    } catch (error) {
        console.error("Error fetching designated days:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// Get all trames
router.get('/', async (req, res) => {
    const [trameError, trameData] = await catchError(Trame.findAll());
    if (trameError) {
        console.error(trameError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(trameData);
});

// Search trames by query
router.get('/search/:searchQuery', async (req, res) => {
    const searchQuery = req.params.searchQuery;
    let trames;
    let trameError;

    if (searchQuery === 'all') {
        [trameError, trames] = await catchError(Trame.findAll());
    } else {
        [trameError, trames] = await catchError(Trame.findAll({
            where: {
                [Sequelize.Op.or]: [
                    { Name: { [Sequelize.Op.like]: `%${searchQuery}%` } }
                ]
            }
        }));
    }

    if (trameError) {
        console.error(trameError);
        res.status(500).send('Internal Server Error');
        return;
    }

    res.json(trames);
});

// Get trames by user ID
router.get('/user/:id', async (req, res) => {
    const id = req.params.id;

    if (!id) {
        res.status(400).send('Id is required');
        return;
    }

    const [trameError, trames] = await catchError(Trame.findAll({ where: { Owner: id } }));
    if (trameError) {
        console.error(trameError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(trames);
});

// Get a trame by ID
router.get('/:id', async (req, res) => {
    const id = req.params.id;

    if (!id) {
        res.status(400).send('Id is required');
        return;
    }

    const [trameError, trameData] = await catchError(Trame.findByPk(id));

    if (trameError) {
        console.error(trameError);
        res.status(500).send('Internal Server Error');
        return;
    }

    return res.json(trameData);
});

// Update a trame by ID
router.put('/:id', async (req, res) => {
    const id = req.params.id;
    console.log("updating context with id: ", id);

    if (!id) {
        res.status(400).send('Id is required');
        return;
    }

    const [trameError, trameData] = await catchError(Trame.findByPk(id));

    if (trameError) {
        console.error(trameError);
        res.status(500).send('Internal Server Error');
        return;

    } if (!trameData) {
        res.status(404).send('Context not found');
        return;
    }

    console.log("updating context with data: ", req.body);

    const [updateError, updatedTrame] = await catchError(trameData.update(req.body));

    if (updateError) {
        console.error(updateError);
        res.status(500).send('Internal Server Error');
        return;
    }

    console.log(updatedTrame);
    return res.json(updatedTrame);
});


// returns true if the date is a designated day for the trame
router.get('/is-dts/:trameId/:date', async (req, res) => {
    const date = req.params.date;
    const trameId = req.params.trameId;
    const [dtsError, dts] = await catchError(DesignatedDays.findOne({ where: { TrameId: trameId, Day: date } }));
    if (dtsError) {
        console.error(dtsError);
        res.status(500).send('Internal Server Error');
        return;
    }
    if (!dts) {
        res.status(404).send('Designated day not found');
        return;
    }
    return res.json("true");
});

// Add new endpoint to get duplication progress
router.get('/duplicate-progress/:trameId', async (req, res) => {
    const trameId = req.params.trameId;

    if (duplicationProgress[trameId]) {
        res.json(duplicationProgress[trameId]);
    } else {
        res.json({
            state: 'idle',
            percentage: 0,
            currentLayer: null,
            percentageLayer: 0,
            percentageTotal: 0
        });
    }
});

/**
 * Clear courses from a trame that are after January 2001
 * @param {string} trameId - The ID of the trame to clear courses from
 * @returns {Promise<number>} The count of deleted courses
 */
async function clearCoursesFromTrame(trameId) {
    if (!trameId) {
        throw new Error('Trame Id is required');
    }

    // Retrieve layers linked to the trame
    const [layerError, layers] = await catchError(Layer.findAll({ where: { TrameId: trameId } }));
    if (layerError) {
        console.error(layerError);
        throw new Error('Failed to find layers');
    }
    if (!layers || layers.length === 0) {
        throw new Error('No layers found for the trame');
    }
    const layerIds = layers.map(l => l.Id);

    // Retrieve UEs associated with these layers
    const [ueError, ues] = await catchError(UE.findAll({ where: { LayerId: { [Sequelize.Op.in]: layerIds } } }));
    if (ueError) {
        console.error(ueError);
        throw new Error('Failed to find UEs');
    }
    if (!ues || ues.length === 0) {
        throw new Error('No UEs found for the trame layers');
    }
    const ueIds = ues.map(ue => ue.Id);

    // Define cutoff date: courses after January 2001 (i.e., from February 1, 2001)
    const cutoffDate = new Date('2001-02-01');

    // Delete courses for these UEs with Date on or after the cutoff
    const [delError, count] = await catchError(Course.destroy({
        where: {
            UEId: { [Sequelize.Op.in]: ueIds },
            Date: { [Sequelize.Op.gte]: cutoffDate }
        }
    }));
    if (delError) {
        console.error(delError);
        throw new Error('Failed to delete courses');
    }

    return count;
}

// Cache conflicts for the trame
async function cacheConflicts(trameId) {
    const [conflictError, conflicts] = await catchError(Conflicts.findAll({
        include: [
            { model: Course, as: 'Course1', include: [Group] },
            { model: Course, as: 'Course2', include: [Group] }
        ],
        where: {
            TrameId: trameId,
            ResolutionMethod: { [Sequelize.Op.ne]: 'None' }
        }
    }));

    if (conflictError) {
        console.error("Error fetching conflicts:", conflictError);
        throw new Error('Failed to fetch conflicts');
    }

    const conflictCache = new Map();
    for (const conflict of conflicts) {
        const key = `${conflict.Course1Id}-${conflict.Course2Id}`;
        conflictCache.set(key, conflict);
    }
    return conflictCache;
}



// Update the duplicate route to call the clearCoursesFromTrame function
router.post('/duplicate/:id', async (req, res) => {




    // Initialize progress tracking
    const id = req.params.id;
    if (!id) {
        res.status(400).send('Id is required');
        return;
    }

    duplicationProgress[id] = {
        state: 'initialisation',
        percentage: 0,
        currentLayer: null,
        percentageLayer: 0,
        percentageTotal: 5 // Start at 5% for initialization
    };

    const designatedDaysRecords = await DesignatedDays.findAll({ where: { TrameId: id } });
    let daysToSkip = designatedDaysRecords.map(record => record.Day);

    let totalEvents = await Events.findAll({ where: { TrameId: id } });
    if (!totalEvents) {
        console.log("Total events found : ", totalEvents.length);
        totalEvents = [];
    }

    if (!daysToSkip) {
        daysToSkip = []; // au cas ou
    }



    // Clear existing courses before duplication
    duplicationProgress[id].state = 'suppression des cours...';
    try {
        await clearCoursesFromTrame(id);
    } catch (error) {
        duplicationProgress[id].state = 'erreur';
        console.error('Error clearing courses:', error);
        res.status(500).send('Error clearing courses');
        return;
    }

    const [trameError, trameData] = await catchError(Trame.findByPk(id)); // On récupère la trame à étendre

    // Update progress state
    duplicationProgress[id].state = 'chargement des données';
    duplicationProgress[id].percentageTotal = 10;

    let startDate = trameData.StartDate;
    let endDate = trameData.EndDate;
    if (!startDate || !endDate) {
        duplicationProgress[id].state = 'erreur';
        res.status(400).send('Start and end date are required to be defined to duplicate');
        return;
    }
    startDate = new Date(startDate);
    endDate = new Date(endDate);

    // Calculate the total duration for percentage calculations
    const totalDateDuration = endDate.getTime() - startDate.getTime();

    if (trameError) {
        duplicationProgress[id].state = 'erreur';
        console.error(trameError);
        res.status(500).send('Internal Server Error');
        return;
    }

    if (!trameData) {
        duplicationProgress[id].state = 'erreur';
        res.status(404).send('Trame not found');
        return;
    }

    // Update progress - loading layers
    duplicationProgress[id].state = 'chargement des couches';
    duplicationProgress[id].percentageTotal = 15;

    const [layerError, layers] = await catchError(Layer.findAll( // On récupère les layers de la trame pour pouvoir trouver les cours
        {
            where:
                { TrameId: id },
            include:
            {
                model: Group,// on lui dit d'inclure les groupes liés à ces layers
                through: { attributes: [] },
                include: {
                    model: Course,
                    through: { attributes: [] },
                    where: {
                        Date: { [Sequelize.Op.lt]: new Date('2001-01-08') }
                    },
                    include: {
                        model: Group,
                        through: { attributes: [] }
                    }
                } // on lui dit d'inclure les cours liés à ces groupes
            }
        }));

    if (layerError) {
        duplicationProgress[id].state = 'erreur';
        console.error(layerError);
        res.status(500).send('Internal Server Error');
        return;
    }

    if (!layers) {
        duplicationProgress[id].state = 'erreur';
        res.status(404).send('Layers not found');
        return;
    }

    // Update progress - starting generation
    duplicationProgress[id].state = 'préparation de la génération';
    duplicationProgress[id].percentageTotal = 20;

    let totcourses = 0;
    const totalLayers = layers.length;

    // Cache conflicts for the trame
    let conflictCache;
    try {
        conflictCache = await cacheConflicts(id);
    } catch (error) {
        duplicationProgress[id].state = 'erreur';
        console.error('Error caching conflicts:', error);
        res.status(500).send('Error caching conflicts');
        return;
    }

    const alternateCounts = new Map(); // Tracks alternate counts per group and day
    const sequenceRemaining = new Map(); // Tracks remaining hours for sequence

    for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
        const layer = layers[layerIndex];

        // Update progress for this layer
        duplicationProgress[id].currentLayer = layer.Name || `Couche ${layerIndex + 1}`;
        duplicationProgress[id].state = 'génération des jours';
        duplicationProgress[id].percentageLayer = 0;

        // ...existing code...
        console.log(chalk.red(" Duplicating layer : ", JSON.stringify(layer.dataValues.Name)));
        const dedupedCourses = new Map();
        for (const group of layer.Groups) {
            // Ensure group.Courses is defined
            if (group.Courses && group.Courses.length) {
                group.Courses.forEach(course => {
                    // Assuming each course has a unique identifier such as course.Id
                    dedupedCourses.set(course.Id, course);
                });
            }
        }
        const flattenedCourses = Array.from(dedupedCourses.values());

        // Update progress - loading UEs
        duplicationProgress[id].state = 'chargement des UEs';

        const [ueError, ues] = await catchError(UE.findAll({ // On récupère les UEs associées à ce layer pour pouvoir initialiser les heures restantes
            where: {
                LayerId: layer.Id
            }
        }));

        if (ueError) {
            duplicationProgress[id].state = 'erreur';
            console.error(ueError);
            res.status(500).send('Internal Server Error');
            return;
        }

        if (!ues) {
            duplicationProgress[id].state = 'erreur';
            res.status(404).send('UEs not found');
            return;
        }

        // Filter out special groups
        const regularGroups = layer.Groups.filter(group => !group.isSpecial);

        // Initialize remaining hours per UE and regular group
        let RemainingHours = {};
        ues.forEach(ue => {
            RemainingHours[ue.Id] = {};
            regularGroups.forEach(group => {
                RemainingHours[ue.Id][group.Id] = {
                    CM: ue.TotalHourVolume_CM,
                    TD: ue.TotalHourVolume_TD,
                    TP: ue.TotalHourVolume_TP
                };
            });
        });

        let currentDate = new Date(startDate);  // On initialise la date de début

        // Update progress - preparing week courses
        duplicationProgress[id].state = 'préparation des cours';

        const weekCourses = [[], [], [], [], [], [], []]; // On crée un tableau pour chaque jour de la semaine
        const baseDate = new Date('2001-01-01'); // On crée une date de base pour calculer les jours de la semaine
        for (const course of flattenedCourses) {    // On itère sur les cours et on les ajoute au bon jour de la semaine
            if (!course.Date) continue;
            const courseDate = new Date(course.Date);
            const diffTime = courseDate.getTime() - baseDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays < 7) {
                if (diffDays === 6) {
                    weekCourses[0].push(course);
                } else {
                    weekCourses[diffDays + 1].push(course);
                }
            }
        }

        // Update progress - generating days
        duplicationProgress[id].state = 'génération des jours';

        // l'idée c'est d'avoir un tableau avec les cours de chaque jour de la semaine, 
        // pour pouvoir à partir d'une date savoir quels cours il y a ce jour là 
        // (en récupérant son jour de la semaine)
        console.log(chalk.red("Entering the loop"));
        console.log(chalk.red("Current date : ", currentDate));
        console.log(chalk.red("End date : ", endDate));
        console.log(chalk.red("Cours de la semaine : ", JSON.stringify(weekCourses)));

        // Calculate total normal groups in the current layer
        let totalNormalGroupsInLayer = layer.Groups.filter(g => !g.isSpecial).length;
        if (totalNormalGroupsInLayer === 0) totalNormalGroupsInLayer = layer.Groups.length;

        // Helper function to format date as YYYY-MM-DD using local date values
        const formatLocalDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Helper function to check if a course is in the default weekday
        function isCourseInDefaultWeekDay(course, dayOfWeek) {
            const courseDate = new Date(course.Date);
            return courseDate.getDay() === dayOfWeek;
        }

        while (currentDate <= endDate) {
            // Update layer percentage based on date progress
            const elapsedTime = currentDate.getTime() - startDate.getTime();
            duplicationProgress[id].percentageLayer = Math.min(100, Math.round((elapsedTime / totalDateDuration) * 100));

            const eventsOnDate = totalEvents.filter(event => {
                const eventDate = new Date(event.Date);
                return eventDate.toDateString() === currentDate.toDateString();
            });

            // Calculate total percentage considering layers
            // 85% of the process is generating the days, 15% is other tasks (init, finalization)
            const layerContribution = (layerIndex + duplicationProgress[id].percentageLayer / 100) / totalLayers;
            duplicationProgress[id].percentageTotal = Math.min(95, Math.round(20 + layerContribution * 75));

            // Check designated days using local date format
            if (daysToSkip && daysToSkip.includes(formatLocalDate(currentDate))) {
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
            }
            let currentDay = currentDate.getDay();
            const courseofDay = weekCourses[currentDay];
            //console.log(chalk.red("Current day : ", currentDay, " ", currentDate));

            // ...existing course creation code...
            console.log(chalk.green("_____________________Current date : ", currentDate));
            for (const course of courseofDay) {
                // Get all groups associated with this course
                const allGroupsAssociated = course.Groups;

                // Filter out special groups
                const groupsAssociated = allGroupsAssociated.filter(group => !group.isSpecial);

                // Skip if no regular groups are associated with this course
                if (groupsAssociated.length === 0) {
                    continue;
                }

                // Find groups that have enough remaining hours
                const eligibleGroups = groupsAssociated.filter(group => {
                    return RemainingHours[course.UEId] &&
                        RemainingHours[course.UEId][group.Id] &&
                        RemainingHours[course.UEId][group.Id][course.Type] >= course.length;
                });

                // Skip if no groups have enough remaining hours
                if (eligibleGroups.length === 0) {
                    continue;
                }

                if (eventsOnDate && eventsOnDate.length > 0 && eventsOnDate.some(event => {
                    // Convert times to comparable values (minutes since midnight)
                    const eventStart = timeToMinutes(event.StartHour);
                    const eventEnd = timeToMinutes(event.EndHour);
                    const courseStart = timeToMinutes(course.StartHour);
                    const courseEnd = courseStart + (course.length * 60); // length is in hours, convert to minutes

                    // Check for any overlap scenario
                    return (
                        // Event starts during course
                        (eventStart >= courseStart && eventStart < courseEnd) ||
                        // Event ends during course
                        (eventEnd > courseStart && eventEnd <= courseEnd) ||
                        // Event completely contains course
                        (eventStart <= courseStart && eventEnd >= courseEnd)
                    );
                })) {
                    continue;
                }

                // Check for conflicts
                let shouldSkipCourse = false;
                const dayOfWeek = currentDate.getDay();

                const conflicts = Array.from(conflictCache.values()).filter(conflict => {
                    return [conflict.Course1.Id, conflict.Course2.Id].includes(course.Id)
                });

                console.log("Current course : ", course.Id);


                if (conflicts.length > 0) {
                    console.log(chalk.red("Conflicts found for course "));
                } else {
                    console.log(chalk.green("No conflicts found for course "));
                }

                for (const conflict of conflicts) {
                    const courseInDay = [conflict.Course1, conflict.Course2]
                    console.log("course ID corresponds to : 0:", courseInDay[0].Id, " 1:", courseInDay[1].Id);
                    // if (courseInDay.length !== 2) continue;
                    const key = conflict.Id;
                    switch (conflict.ResolutionMethod) {
                        case 'alternate':
                            console.log(chalk.red("Alternate method"));
                            const count = alternateCounts.get(key) || 0;
                            const selectedCourse = count % 2 === 0 ? courseInDay[0] : courseInDay[1];
                            console.log(chalk.green("Count == ", count));
                            console.log("placing course : ", count % 2 === 0 ? "0" : "1");
                            console.log("Selected course : ", selectedCourse.Id);
                            console.log("Course : ", course.Id);
                            if (course.Id === conflict.Course1.Id) {
                                alternateCounts.set(key, count + 1);
                            }
                            if (selectedCourse.Id !== course.Id) {
                                console.log(chalk.blue("Id differents, skipping course"));
                                shouldSkipCourse = true;
                            }


                            break;
                        case 'sequence':
                            console.log(chalk.red("Sequence method"));
                            const shouldPlaceCourse1 = conflict.Course1.Groups.some(group => {
                                return RemainingHours[conflict.Course1.UEId] &&
                                    RemainingHours[conflict.Course1.UEId][group.Id] &&
                                    RemainingHours[conflict.Course1.UEId][group.Id][conflict.Course1.Type] >= conflict.Course1.length;
                            });
                            console.log(chalk.green("shouldPlaceCourse1 : ", shouldPlaceCourse1));
                            const selectedSeqCourse = shouldPlaceCourse1
                                ? conflict.Course1
                                : conflict.Course2;

                            if (selectedSeqCourse.Id !== course.Id && course.Id === conflict.Course2.Id) {
                                shouldSkipCourse = true;
                            }


                            break;
                    }

                    if (shouldSkipCourse) break;
                }
                console.log(chalk.magenta("we're out of the for loop, shouldSkipCourse : ", shouldSkipCourse));
                if (shouldSkipCourse) {
                    continue; // Skip this course due to conflict resolution
                }

                // Create the course
                console.log(chalk.red("Creating cours"));
                const [courseError, newCourse] = await catchError(Course.create({
                    UEId: course.UEId,
                    Date: currentDate,
                    length: course.length,
                    Type: course.Type,
                    StartHour: course.StartHour,
                    ProfId: course.ProfId,
                    RoomType: course.RoomType
                }));

                if (courseError) {
                    console.error(courseError);
                    res.status(500).send('Internal Server Error');
                    return;
                }
                totcourses++;

                // Add all eligible groups to the course
                const eligibleGroupIds = eligibleGroups.map(group => group.Id);
                const [courseGroupError, courseGroup] = await catchError(newCourse.setGroups(eligibleGroupIds));

                if (courseGroupError) {
                    console.log(chalk.red("Error setting groups :"));
                    console.error(courseGroupError);
                    await newCourse.destroy();
                    res.status(500).send('Internal Server Error');
                    return;
                }

                // Deduct hours from each eligible group
                eligibleGroups.forEach(group => {
                    if (RemainingHours[course.UEId] && RemainingHours[course.UEId][group.Id]) {
                        RemainingHours[course.UEId][group.Id][course.Type] -= newCourse.length;
                    }
                });
            }

            // On incrémente currentDate pour passer au jour suivant
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Update progress - updating remaining hours
        duplicationProgress[id].state = 'mise à jour des heures restantes dans la base de données';
        duplicationProgress[id].percentageLayer = 100;
        duplicationProgress[id].percentageTotal = Math.min(95, 20 + ((layerIndex + 1) / totalLayers) * 75);

        // Update the course pool with individual group remaining hours
        for (const [ueId, groupHours] of Object.entries(RemainingHours)) {
            for (const [groupId, hours] of Object.entries(groupHours)) {
                // Update the course pool for CM
                const [coursePoolCMError, coursePoolCM] = await catchError(
                    CoursePool.upsert({
                        UEId: ueId,
                        GroupId: groupId,
                        Type: "CM",
                        Volume: hours.CM
                    })
                );
                if (coursePoolCMError) {
                    console.error(coursePoolCMError);
                    res.status(500).send('Internal Server Error');
                    return;
                }

                // Update the course pool for TD
                const [coursePoolTDError, coursePoolTD] = await catchError(
                    CoursePool.upsert({
                        UEId: ueId,
                        GroupId: groupId,
                        Type: "TD",
                        Volume: hours.TD
                    })
                );
                if (coursePoolTDError) {
                    console.error(coursePoolTDError);
                    res.status(500).send('Internal Server Error');
                    return;
                }

                // Update the course pool for TP
                const [coursePoolTPError, coursePoolTP] = await catchError(
                    CoursePool.upsert({
                        UEId: ueId,
                        GroupId: groupId,
                        Type: "TP",
                        Volume: hours.TP
                    })
                );
                if (coursePoolTPError) {
                    console.error(coursePoolTPError);
                    res.status(500).send('Internal Server Error');
                    return;
                }
            }
        }
    } // finito

    // Final progress update
    duplicationProgress[id].state = 'finalisation';
    duplicationProgress[id].currentLayer = null;
    duplicationProgress[id].percentageTotal = 100;

    console.log(chalk.red("Sending start date : ", startDate));
    console.log(chalk.red("Total courses created : ", totcourses));

    // Clear progress tracking data after a short delay (let client fetch the final 100%)
    setTimeout(() => {
        delete duplicationProgress[id];
    }, 10000);

    console.log(chalk.red("totalEvents : ", JSON.stringify(totalEvents)));

    res.json(startDate); // On renvoie la date de début pour pouvoir bouger directement dessus dans le client
});

// Update the clear-courses route to use the extracted function
router.delete('/clear-courses/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const count = await clearCoursesFromTrame(id);
        res.json({ message: `Deleted ${count} courses` });
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message || 'Internal Server Error');
    }
});

// Delete a trame by ID
router.delete('/:id', async (req, res) => {
    const id = req.params.id;

    if (!id) {
        res.status(400).send('Id is required');
        return;
    }

    const [trameError, trameData] = await catchError(Trame.findByPk(id));

    if (trameError) {
        console.error(trameError);
        res.status(500).send('Internal Server Error');
        return;
    }

    return res.json(trameData);
});

// Calculate end time from start time and duration
function calculateEndTime(startHour, length) {
    const [hours, minutes] = startHour.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(hours);
    endDate.setMinutes(minutes + length * 60);
    endDate.setSeconds(0);
    return endDate.toTimeString().split(' ')[0];
}

// Get Monday from a date
function getMonday(date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(date);
    monday.setDate(diff);
    return monday;
}

// New endpoint to export Excel data for a trame
router.post('/export-excel', async (req, res) => {
    const { trameId, layerId, startDate, endDate } = req.body;

    if (!trameId || !layerId || !startDate || !endDate) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        console.log(`Export Excel request - trameId: ${trameId}, layerId: ${layerId}`);
        console.log(`Date range: ${startDate} to ${endDate}`);

        const startMonday = getMonday(new Date(startDate));
        const endMonday = getMonday(new Date(endDate));
        console.log(`Start Monday: ${startMonday.toISOString()}, End Monday: ${endMonday.toISOString()}`);

        const weeks = [];

        // Verify the layer exists
        const [layerErr, layer] = await catchError(Layer.findByPk(layerId));
        if (layerErr || !layer) {
            console.error("Layer not found:", layerErr);
            return res.status(404).json({ error: "Layer not found" });
        }

        // Get UEs for the layer to verify we have data
        const [uesErr, ues] = await catchError(UE.findAll({ where: { LayerId: layerId } }));
        if (uesErr) {
            console.error("Error fetching UEs:", uesErr);
            return res.status(500).json({ error: "Error fetching UEs" });
        }

        console.log(`Found ${ues.length} UEs for layer ${layerId}`);
        if (ues.length === 0) {
            return res.status(404).json({ error: "No UEs found for this layer" });
        }

        const ueIds = ues.map(ue => ue.Id);
        console.log(`UE IDs: ${ueIds.join(', ')}`);

        let currentMonday = new Date(startMonday);
        while (currentMonday <= endMonday) {
            console.log(`Processing week starting: ${currentMonday.toISOString()}`);
            const weekClasses = [];

            // Fetch classes for each day of the week (-1 is Sunday, 0-5 are Monday-Saturday)
            for (let i = -1; i < 6; i++) {
                const date = new Date(currentMonday);
                date.setDate(currentMonday.getDate() + i);

                // Create start and end of day for range query
                const startOfDay = new Date(date);
                startOfDay.setHours(0, 0, 0, 0);

                const endOfDay = new Date(date);
                endOfDay.setHours(23, 59, 59, 999);

                const formattedDate = date.toISOString().split('T')[0];
                console.log(`Fetching courses for day: ${formattedDate}`);

                // Get courses for this day - use date range instead of exact match
                const [dayCoursesErr, dayCourses] = await catchError(Course.findAll({
                    include: [
                        {
                            model: UE,
                            required: true,
                            where: {
                                Id: { [Sequelize.Op.in]: ueIds }
                            }
                        },
                        {
                            model: Group,
                            through: { attributes: [] }
                        },
                        {
                            model: Prof,
                            as: 'Teachers',
                            required: false,
                            through: { attributes: [] }
                        }
                    ],
                    where: {
                        Date: {
                            [Sequelize.Op.between]: [startOfDay, endOfDay]
                        }
                    }
                }));

                if (dayCoursesErr) {
                    console.error("Error fetching courses for Excel export:", dayCoursesErr);
                    return res.status(500).json({ error: "Error fetching courses" });
                }

                console.log(`Found ${dayCourses.length} courses for ${formattedDate}`);

                // Format the results
                const formattedCourses = dayCourses.map(async course => {
                    const courseObj = course.get({ plain: true });
                    const ueData = courseObj.UE;
                    const endTime = calculateEndTime(course.StartHour, course.length);

                    // Check if we need to fetch professor info
                    let profFullName = null;
                    if (courseObj.Teachers && courseObj.Teachers.length > 0) {
                        profFullName = courseObj.Teachers[0].FullName;
                    } else if (course.ProfId) {
                        // Fetch the professor info if we have an ID but no Teachers association
                        const [profErr, professor] = await catchError(Prof.findByPk(course.ProfId));
                        profFullName = profErr ? `Unknown (ID: ${course.ProfId})` : professor.FullName;
                    }

                    return {
                        ...courseObj,
                        UEName: ueData.Name,
                        ProfFullName: profFullName,
                        EndHour: endTime
                    };
                });

                // Since we're using async/await in the map function, we need to wait for all promises to resolve
                const resolvedCourses = await Promise.all(formattedCourses);
                weekClasses.push(resolvedCourses);
            }

            weeks.push(weekClasses);
            console.log(`Week completed with ${weekClasses.flat().length} total courses`);

            // Move to next week
            currentMonday.setDate(currentMonday.getDate() + 7);
        }

        console.log(`Export completed with ${weeks.length} weeks of data`);
        return res.json(weeks);
    } catch (error) {
        console.error("Error in Excel export:", error);
        return res.status(500).json({ error: "Internal server error", details: error.message });
    }
});

// Helper function to convert time string (HH:MM) to minutes since midnight
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + minutes;
}

export default router;