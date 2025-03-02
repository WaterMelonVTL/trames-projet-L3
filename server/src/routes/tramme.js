import express from 'express';
import dotenv from 'dotenv';
import { catchError } from '../utils/HandleErrors.js';
import { Tramme, Sequelize, Layer, Course, Group, UE, DesignatedDays, CoursePool } from '../models/index.js';
import chalk from 'chalk';
import { json } from 'sequelize';

dotenv.config();
const router = express.Router();

// Create a new tramme
router.post('/', async (req, res) => {
    const { data, user } = req.body; // user est à récupérer depuis le token pour sécuriser la création
    const tramme = {
        Name: data.Name,
        ContextId: data.ContextId,
        Owner: user.Id,
    };
    const [trammeError, trammeData] = await catchError(Tramme.create(tramme));
    if (trammeError) {
        console.error(trammeError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(trammeData);
});

// Add designated days
router.put('/addDesignatedDays', async (req, res) => {
    console.log("DesignatedDays route hit!");
    const { trammeId, designatedDays } = req.body;

    try {
        console.log(`MAJ jours banalisés pour trammeId: ${trammeId}`, designatedDays);

        // Nettoyer s'il y a des jours existants
        const existingDays = await DesignatedDays.findAll({ where: { trammeId } });

        if (existingDays.length > 0) {
            await DesignatedDays.destroy({ where: { trammeId } });
        }

        // Création des jours banalisés
        const newDesignatedDays = await DesignatedDays.bulkCreate(
            designatedDays.map(day => ({ TrammeId: trammeId, Day: day }))
        );

        res.status(200).json(newDesignatedDays);
    } catch (error) {
        console.error("Erreur lors de l'insertion des jours banalisés:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// Get all trammes
router.get('/', async (req, res) => {
    const [trammeError, trammeData] = await catchError(Tramme.findAll());
    if (trammeError) {
        console.error(trammeError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(trammeData);
});

// Search trammes by query
router.get('/search/:searchQuery', async (req, res) => {
    const searchQuery = req.params.searchQuery;
    let trammes;
    let trammeError;

    if (searchQuery === 'all') {
        [trammeError, trammes] = await catchError(Tramme.findAll());
    } else {
        [trammeError, trammes] = await catchError(Tramme.findAll({
            where: {
                [Sequelize.Op.or]: [
                    { Name: { [Sequelize.Op.like]: `%${searchQuery}%` } }
                ]
            }
        }));
    }

    if (trammeError) {
        console.error(trammeError);
        res.status(500).send('Internal Server Error');
        return;
    }

    res.json(trammes);
});

// Get trammes by user ID
router.get('/user/:id', async (req, res) => {
    const id = req.params.id;

    if (!id) {
        res.status(400).send('Id is required');
        return;
    }

    const [trammeError, trammes] = await catchError(Tramme.findAll({ where: { Owner: id } }));
    if (trammeError) {
        console.error(trammeError);
        res.status(500).send('Internal Server Error');
        return;
    }
    return res.json(trammes);
});

// Get a tramme by ID
router.get('/:id', async (req, res) => {
    const id = req.params.id;

    if (!id) {
        res.status(400).send('Id is required');
        return;
    }

    const [trammeError, trammeData] = await catchError(Tramme.findByPk(id));

    if (trammeError) {
        console.error(trammeError);
        res.status(500).send('Internal Server Error');
        return;
    }

    return res.json(trammeData);
});

// Update a tramme by ID
router.put('/:id', async (req, res) => {
    const id = req.params.id;
    console.log("updating context with id: ", id);

    if (!id) {
        res.status(400).send('Id is required');
        return;
    }

    const [trammeError, trammeData] = await catchError(Tramme.findByPk(id));

    if (trammeError) {
        console.error(trammeError);
        res.status(500).send('Internal Server Error');
        return;

    } if (!trammeData) {
        res.status(404).send('Context not found');
        return;
    }

    console.log("updating context with data: ", req.body);

    const [updateError, updatedTramme] = await catchError(trammeData.update(req.body));

    if (updateError) {
        console.error(updateError);
        res.status(500).send('Internal Server Error');
        return;
    }

    console.log(updatedTramme);
    return res.json(updatedTramme);
});


// returns true if the date is a designated day for the tramme
router.get('/is-dts/:trammeId/:date', async (req, res) => {
    const date = req.params.date;
    const trammeId = req.params.trammeId;
    const [dtsError, dts] = await catchError(DesignatedDays.findOne({ where: { TrammeId: trammeId, Day: date } }));
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

router.post('/duplicate/:id', async (req, res) => {

    
    const designatedDaysRecords = await DesignatedDays.findAll({ where: { TrammeId: req.params.id } });
    let daysToSkip = designatedDaysRecords.map(record => record.Day);



    if (!daysToSkip) {
        daysToSkip = []; // au cas ou
    }
    const id = req.params.id;

    if (!id) {
        res.status(400).send('Id is required');
        return;
    }


    const [trammeError, trammeData] = await catchError(Tramme.findByPk(id)); // On récupère la tramme à étendre
    let startDate = trammeData.StartDate;
    let endDate = trammeData.EndDate;
    if (!startDate || !endDate) {
        res.status(400).send('Start and end date are required to be defined to duplicate');
        return;
    }
    startDate = new Date(startDate);
    endDate = new Date(endDate);
    if (trammeError) {
        console.error(trammeError);
        res.status(500).send('Internal Server Error');
        return;
    }

    if (!trammeData) {
        res.status(404).send('Trame not found');
        return;
    }

    const [layerError, layers] = await catchError(Layer.findAll( // On récupère les layers de la tramme pour pouvoir trouver les cours
        {
            where:
                { TrammeId: id },
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
        console.error(layerError);
        res.status(500).send('Internal Server Error');
        return;
    }

    if (!layers) {
        res.status(404).send('Layers not found');
        return;
    }
    for (let layer of layers) { // Maintenant on va itérer sur chaque layer pour les dupliquer un par un
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

        const [ueError, ues] = await catchError(UE.findAll({ // On récupère les UEs associées à ce layer pour pouvoir initialiser les heures restantes
            where: {
                LayerId: layer.Id
            }
        }));

        if (ueError) {
            console.error(ueError);
            res.status(500).send('Internal Server Error');
            return;
        }

        if (!ues) {
            res.status(404).send('UEs not found');
            return;
        }

        let RemainingHours = {}; // On initialise un objet pour stocker les heures restantes pour chaque UE
        ues.forEach(ue => {
            RemainingHours[ue.Id] = {
                CM: ue.TotalHourVolume_CM,
                TD: ue.TotalHourVolume_TD,
                TP: ue.TotalHourVolume_TP
            };
        });

        let currentDate = new Date(startDate);  // On initialise la date de début


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
        
        while (currentDate <= endDate) {
            let currentDay = currentDate.getDay();

            if (daysToSkip && daysToSkip.includes(currentDate.toISOString().slice(0, 10))) {
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
            }

            const courseofDay = weekCourses[currentDay];
            console.log(chalk.red("Current day : ", currentDay, " ", currentDate));
            for (const course of courseofDay) { // On itere sure les cours du jour (le jour de la semaine en question)
                if (RemainingHours[course.UEId][course.Type] <= 0) {
                    continue; // Si on a plus d'heures pour cette UE on skip
                }

                // Calculate usual group count (non-special groups)
                const groupsAssociated = course.Groups;
                let normalGroupCount = groupsAssociated.filter(g => !g.isSpecial).length;
                if (normalGroupCount === 0) normalGroupCount = groupsAssociated.length;
                const groupsCount = groupsAssociated.length;
                // Determine maximum length that can be allocated considering remaining hours
                const maxLength = RemainingHours[course.UEId][course.Type] >= course.length ? course.length : RemainingHours[course.UEId][course.Type];

                const [courseError, newCourse] = await catchError(Course.create({
                    UEId: course.UEId,
                    Date: currentDate,
                    length: maxLength, // tentative allocated length
                    Type: course.Type,
                    StartHour: course.StartHour,
                    ProfId: course.ProfId,
                }));
                if (courseError) {
                    console.log(chalk.red("Error creating cours :"));
                    console.error(courseError);
                    res.status(500).send('Internal Server Error');
                    newCourse.destroy();
                    return;
                }

                const GroupsIds = groupsAssociated.map(group => group.Id);
                console.log(chalk.red("Setting groups : ", GroupsIds));
                const [courseGroupError, courseGroup] = await catchError(newCourse.setGroups(GroupsIds));
                if (courseGroupError) {
                    console.log(chalk.red("Error setting groups :"));
                    console.error(courseGroupError);
                    newCourse.destroy();
                    res.status(500).send('Internal Server Error');
                    return;
                }
                // Adjust remaining hours proportional to groups count using normal groups in current layer
                const effectiveDeduction = newCourse.length * (groupsCount / totalNormalGroupsInLayer);
                RemainingHours[course.UEId][course.Type] -= effectiveDeduction;
            }

            // On incrémente currentDate pour passer au jour suivant
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // On a fini de dupliquer les cours, on va maintenant mettre à jour les heures restantes pour chaque UE
        for (const [ueId, hours] of Object.entries(RemainingHours)) {
            // Create or update pool item for CM, TD, and TP even if the value is 0
            const [coursePoolCMError, coursePoolCM] = await catchError(
                CoursePool.upsert({ UEId: ueId, Type: "CM", Volume: hours.CM })
            );
            if (coursePoolCMError) {
                console.error(coursePoolCMError);
                res.status(500).send('Internal Server Error');
                return;
            }
            const [coursePoolTDError, coursePoolTD] = await catchError(
                CoursePool.upsert({ UEId: ueId, Type: "TD", Volume: hours.TD })
            );
            if (coursePoolTDError) {
                console.error(coursePoolTDError);
                res.status(500).send('Internal Server Error');
                return;
            }
            const [coursePoolTPError, coursePoolTP] = await catchError(
                CoursePool.upsert({ UEId: ueId, Type: "TP", Volume: hours.TP })
            );
            if (coursePoolTPError) {
                console.error(coursePoolTPError);
                res.status(500).send('Internal Server Error');
                return;
            }
        }
    } // finito
    console.log(chalk.red("Sending start date : ", startDate));
    res.json(startDate); // On renvoie la date de début pour pouvoir bouger directement dessus dans le client
});

// Clear courses from a tramme that are after January 2001
router.delete('/clear-courses/:id', async (req, res) => {
    const id = req.params.id;
    if (!id) {
        res.status(400).send('Tramme Id is required');
        return;
    }

    // Retrieve layers linked to the tramme
    const [layerError, layers] = await catchError(Layer.findAll({ where: { TrammeId: id } }));
    if (layerError) {
        console.error(layerError);
        res.status(500).send('Internal Server Error');
        return;
    }
    if (!layers || layers.length === 0) {
        res.status(404).send('No layers found for the tramme');
        return;
    }
    const layerIds = layers.map(l => l.Id);

    // Retrieve UEs associated with these layers
    const [ueError, ues] = await catchError(UE.findAll({ where: { LayerId: { [Sequelize.Op.in]: layerIds } } }));
    if (ueError) {
        console.error(ueError);
        res.status(500).send('Internal Server Error');
        return;
    }
    if (!ues || ues.length === 0) {
        res.status(404).send('No UEs found for the tramme layers');
        return;
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
        res.status(500).send('Internal Server Error');
        return;
    }

    res.json({ message: `Deleted ${count} courses` });
});

// Delete a tramme by ID
router.delete('/:id', async (req, res) => {
    const id = req.params.id;

    if (!id) {
        res.status(400).send('Id is required');
        return;
    }

    const [trammeError, trammeData] = await catchError(Tramme.findByPk(id));

    if (trammeError) {
        console.error(trammeError);
        res.status(500).send('Internal Server Error');
        return;
    }

    return res.json(trammeData);
});


// // Delete designated days
// router.delete('/deleteDesignatedDays', async (req, res) =>{

// });

export default router;