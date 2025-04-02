import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../main.db'),
    logging: false,
});

// Define User model 
const User = sequelize.define('User', {
    Id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    FirstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    LastName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'USER'
    },
});

// Define Trame model
const Trame = sequelize.define('Trame', {
    Id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    Name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Owner: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'Id'
        }
    },
    StartDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    EndDate: {
        type: DataTypes.DATE,
        allowNull: true
    }
});

// Define Layer model
const Layer = sequelize.define('Layer', {
    Id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    Name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    TrameId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Trame,
            key: 'Id'
        }
    },
    Color: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

// Define Group model
const Group = sequelize.define('Group', {
    Id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    Name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    IsSpecial: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
});

// Define Prof model
const Prof = sequelize.define('Prof', {
    Id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    FullName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Enseignant Titulaire'
    },
    TrameId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Trame,
            key: 'Id'
        }
    }
});

// Define UE model
const UE = sequelize.define('UE', {
    Id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    Name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    TotalHourVolume_CM: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    TotalHourVolume_TD: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    TotalHourVolume_TP: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    TP_NeedInformaticRoom: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    TD_NeedInformaticRoom: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    ResponsibleName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    Color: {
        type: DataTypes.STRING,
        allowNull: false
    },
    LayerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Layer,
            key: 'Id'
        }
    }
});

// Define Course model
const Course = sequelize.define('Course', {
    Id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    UEId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: UE,
            key: 'Id'
        }
    },
    Date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    StartHour: {
        type: DataTypes.TIME,
        allowNull: false
    },
    length: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    ProfId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Prof,
            key: 'Id'
        }
    },
    Type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    RoomType: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

// Define Tokens model
const Tokens = sequelize.define('Tokens', {
    Token: {
        type: DataTypes.STRING,
        allowNull: false
    },
    UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'Id'
        }
    },
    Expire: {
        type: DataTypes.DATE,
        allowNull: false
    }
});

// Define DesignatedDays model
const DesignatedDays = sequelize.define('DesignatedDays', {
    Id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },

    Day: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    TrameId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Trame,
            key: 'Id'
        }
    }
});

//Define the Events model
const Events = sequelize.define('Events', {
    Id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    Name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    StartHour: {
        type: DataTypes.TIME,
        allowNull: false
    },
    EndHour: {
        type: DataTypes.TIME,
        allowNull: false
    },
    TrameId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Trame,
            key: 'Id'
        }
    }
});

// Updated CoursePool model definition
const CoursePool = sequelize.define('CoursePool', {
	UEId: {
		type: DataTypes.INTEGER,
		allowNull: false,
		primaryKey: true,
		references: {
			model: UE,
			key: 'Id'
		}
	},
	GroupId: {
		type: DataTypes.INTEGER,
		allowNull: false,
		primaryKey: true,
		references: {
			model: Group,
			key: 'Id'
		}
	},
	Type: {
		type: DataTypes.STRING,
		allowNull: false,
		primaryKey: true,
	},
	Volume: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 0,
	}
});

// Update Conflicts model definition
const Conflicts = sequelize.define('Conflicts', {
    Id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    TrameId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Trame,
            key: 'Id'
        }
    },

    Course1Id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Course,
            key: 'Id'
        }
    },
    Course2Id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Course,
            key: 'Id'
        }
    },
    ResolutionMethod: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'None'
    }
});

// Update relationships
Conflicts.belongsTo(Course, { foreignKey: 'Course1Id', as: 'Course1', onDelete: 'CASCADE' });
Conflicts.belongsTo(Course, { foreignKey: 'Course2Id', as: 'Course2', onDelete: 'CASCADE' });

// Ensure the database schema reflects the cascade behavior
sequelize.sync({ alter: true }).then(() => {
    console.log('Database schema updated to enforce cascade delete for Conflicts.');
}).catch(error => {
    console.error('Error updating database schema:', error);
});

// UE relationships
UE.belongsToMany(Prof, { as: 'Responsibles', through: 'UE_Responsibles', foreignKey: 'UEId' });
UE.hasMany(Course, { foreignKey: 'UEId', onDelete: 'CASCADE' });  // Added onDelete: 'CASCADE'
Course.belongsTo(UE, { foreignKey: 'UEId' }); 

// Course relationships
Course.belongsToMany(Prof, { as: 'Teachers', through: 'Course_Teachers', foreignKey: 'CourseId' });
Prof.belongsToMany(Course, { as: 'Courses', through: 'Course_Teachers', foreignKey: 'ProfId' });

// Trame relationships
Trame.hasMany(Layer, { foreignKey: 'TrameId' });
Layer.belongsTo(Trame, { foreignKey: 'TrameId' });
Trame.hasMany(Prof, { foreignKey: 'TrameId' });
Prof.belongsTo(Trame, { foreignKey: 'TrameId' });

User.hasMany(Trame, { foreignKey: 'Owner' });
Trame.belongsTo(User, { foreignKey: 'Owner' });

// group relationships
Group.belongsToMany(Layer, { through: 'Layer_Groups', foreignKey: 'GroupId' });
Layer.belongsToMany(Group, { through: 'Layer_Groups', foreignKey: 'LayerId' });
Course.belongsToMany(Group, { through: 'Course_Groups', foreignKey: 'CourseId' });
Group.belongsToMany(Course, { through: 'Course_Groups', foreignKey: 'GroupId' });

// // DesignatedDays relationships
Trame.hasMany(DesignatedDays, { foreignKey: 'TrameId' });


/* Note :  (Group, Layer) = N-N can use those : 
group.getLayers()
group.setLayers()
group.addLayer()
layer.getGroups()
layer.setGroups()
layer.addGroup()
*/

sequelize.sync().then(async () => {
    try {
        const [user, created] = await User.findOrCreate({
            where: { FirstName: "Louis", LastName: "Veran" },
            defaults: {
                Password: await bcrypt.hash("azerty", 10),
                Role: "ADMIN"
            }
        });
        if (created) {
            console.log("Admin user created:", user);
        } else {
            console.log("Admin user already exists");
        }
    } catch (error) {
        console.error("Error seeding admin user:", error);
    }
});


export {
    Sequelize,
    sequelize,
    User,
    Trame,
    Layer,
    Prof,
    UE,
    Course,
    Tokens,
    Group,
    DesignatedDays,
    CoursePool,
    Events,
    Conflicts
};