import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcrypt';

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
    TrammeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Tramme,
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

// Course relationships
Course.belongsToMany(Prof, { as: 'Teachers', through: 'Course_Teachers', foreignKey: 'CourseId' });
Prof.belongsToMany(Course, { as: 'Courses', through: 'Course_Teachers', foreignKey: 'ProfId' });

// Tramme relationships
Tramme.hasMany(Layer, { foreignKey: 'TrammeId' });
Layer.belongsTo(Tramme, { foreignKey: 'TrammeId' });
Tramme.hasMany(Prof, { foreignKey: 'TrammeId' });
Prof.belongsTo(Tramme, { foreignKey: 'TrammeId' });

User.hasMany(Tramme, { foreignKey: 'Owner' });
Tramme.belongsTo(User, { foreignKey: 'Owner' });

// group relationships
Group.belongsToMany(Layer, { through: 'Layer_Groups', foreignKey: 'GroupId' });
Layer.belongsToMany(Group, { through: 'Layer_Groups', foreignKey: 'LayerId' });
Course.belongsToMany(Group, { through: 'Course_Groups', foreignKey: 'CourseId' });

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
    Tramme,
    Layer,
    Prof,
    UE,
    Course,
    Tokens,
    Group
};