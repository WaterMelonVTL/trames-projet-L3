import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../main.db')
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
    Email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    Password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Points: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    Picture: {
        type: DataTypes.STRING,
        allowNull: true
    },
    Role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'USER'
    },
});

// Define Context model
const Context = sequelize.define('Context', {
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
});

// Define Tramme model
const Tramme = sequelize.define('Tramme', {
    Id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    Name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ContextId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Context,
            key: 'Id'
        }
    },
    Owner: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'Id'
        }
    },
    Year: {
        type: DataTypes.INTEGER,
        allowNull: false
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
    TrammeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Tramme,
            key: 'Id'
        }
    },
    Color: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

// Define Prof model
const Prof = sequelize.define('Prof', {
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
    Status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Enseignant Titulaire'
    },
    Sexe: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ContextId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Context,
            key: 'Id'
        }
    }
});

// Define Room model
const Room = sequelize.define('Room', {
    Id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    Name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    Amphiteatre: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    Informatised: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    ContextId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Context,
            key: 'Id'
        }
    },
    Capacity: {
        type: DataTypes.INTEGER,
        allowNull: true
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
    DefaultHourVolumeHebdo_CM: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    DefaultHourVolumeHebdo_TD: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    DefaultHourVolumeHebdo_TP: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    AmphiByDefaultId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Room,
            key: 'Id'
        }
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
    ResponsibleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Prof,
            key: 'Id'
        }
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

const UE_CM_Teacher = sequelize.define('UE_CM_Teacher', {
    UEId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: UE,
            key: 'Id'
        }
    },
    ProfId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Prof,
            key: 'Id'
        }
    }
});

const UE_TD_Teacher = sequelize.define('UE_TD_Teacher', {
    UEId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: UE,
            key: 'Id'
        }
    },
    ProfId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Prof,
            key: 'Id'
        }
    }
});

const UE_TP_Teacher = sequelize.define('UE_TP_Teacher', {
    UEId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: UE,
            key: 'Id'
        }
    },
    ProfId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Prof,
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
    TrammeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Tramme,
            key: 'Id'
        }
    },
    RoomId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Room,
            key: 'Id'
        }
    },
    LayerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Layer,
            key: 'Id'
        }
    },
    Type: {
        type: DataTypes.STRING,
        allowNull: false
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

// Define relationships

// UE relationships
UE.belongsToMany(Prof, { as: 'Responsibles', through: 'UE_Responsibles', foreignKey: 'UEId' });
UE.belongsToMany(Prof, { as: 'ProfCMs', through: 'UE_ProfCMs', foreignKey: 'UEId' });
UE.belongsToMany(Prof, { as: 'ProfTDs', through: 'UE_ProfTDs', foreignKey: 'UEId' });

// Course relationships
Course.belongsToMany(Prof, { as: 'Teachers', through: 'Course_Teachers', foreignKey: 'CourseId' });
Prof.belongsToMany(Course, { as: 'Courses', through: 'Course_Teachers', foreignKey: 'ProfId' });

// User relationships
User.hasMany(Context, { foreignKey: 'Owner' });
Context.belongsTo(User, { foreignKey: 'Owner' });

User.hasMany(Tramme, { foreignKey: 'Owner' });
Tramme.belongsTo(User, { foreignKey: 'Owner' });

sequelize.sync();

export {
    Sequelize,
    sequelize,
    User,
    Context,
    Tramme,
    Layer,
    Prof,
    Room,
    UE,
    Course,
    Tokens,
    UE_CM_Teacher,
    UE_TD_Teacher,
    UE_TP_Teacher
};