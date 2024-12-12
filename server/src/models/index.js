const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../main.db')
});

// JE LAISSE LE FICHIER ENTIER POUR L'EXEMPLE

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
    Picture : {
        type: DataTypes.STRING,
        allowNull: true
    },
    Role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'USER'
    },
});

// Define House model
const House = sequelize.define('House', {
    Id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    Street: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Number: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ZipCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Country: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    Price: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

// Define Booking model
const Booking = sequelize.define('Booking', {
    Id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    HouseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    Staker: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    StartDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    EndDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    EffectiveStartDate: {
        type: DataTypes.DATE,
    },
    EffectiveEndDate: {
        type: DataTypes.DATE,
    },
});

// Define Review model
const Review = sequelize.define('Review', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    HouseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    Reviewer: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    Rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    Comment: {
        type: DataTypes.TEXT,
    },
});

// Define BookingUser model
const BookingUser = sequelize.define('BookingUser', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    booking_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
});


// Define Image model
const Image = sequelize.define('Image', {
    Hash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    RefId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Url: {
        type: DataTypes.STRING,
        allowNull: true
    },
});

// Define City model
const City = sequelize.define('City', {
    ZipCode: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    Name: {
        type: DataTypes.STRING,
        allowNull: false
    }}
)

// Define Token model
const Tokens = sequelize.define('Tokens', {
    Token: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    UserId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Expire:{
        type: DataTypes.DATE,
    }
})

// Define relationships
User.hasMany(House, { foreignKey: 'Owner' });
House.belongsTo(User, { foreignKey: 'Owner' });

House.hasMany(Booking, { foreignKey: 'HouseId' });
Booking.belongsTo(House, { foreignKey: 'HouseId' });

User.hasMany(Booking, { foreignKey: 'Staker' });
Booking.belongsTo(User, { foreignKey: 'Staker' });

House.hasMany(Review, { foreignKey: 'HouseId' });
Review.belongsTo(House, { foreignKey: 'HouseId' });

User.hasMany(Review, { foreignKey: 'Reviewer' });
Review.belongsTo(User, { foreignKey: 'Reviewer' });

House.belongsTo(City, { foreignKey: 'ZipCode', targetKey: 'ZipCode' });
City.hasMany(House, { foreignKey: 'ZipCode', sourceKey: 'ZipCode' });

Booking.belongsToMany(User, { through: BookingUser, foreignKey: 'booking_id' });
User.belongsToMany(Booking, { through: BookingUser, foreignKey: 'user_id' });

User.hasMany(Tokens, { foreignKey: 'UserId' });
Tokens.belongsTo(User, { foreignKey: 'UserId' });

sequelize.sync();

module.exports = { Sequelize,sequelize, User, House, Booking, Review, BookingUser, Image, City,Tokens };