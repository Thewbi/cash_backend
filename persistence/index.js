// inspired by https://github.com/sequelize/express-example/blob/master/models

var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');
var basename = path.basename(__filename);

const sqlConfig = {
    user: 'root',
    password: 'test',
    server: '127.0.0.1:3306',
    database: 'cash'
}

var sequelizeConnection = new Sequelize(sqlConfig.database, sqlConfig.user, sqlConfig.password, {
    host: 'localhost',
    port: 3306,
    dialect: 'mysql',

    pool: {
        max: 5,
        min: 0,
        idle: 10000
    }
});

var db = {
    Sequelize: Sequelize,
    sequelize: sequelizeConnection
};

// collect all model files in the models folder to automatically load all the defined models
fs.readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        var model = db.sequelize['import'](path.join(__dirname, file));
        db[model.name] = model;
    });

// if a model has an associtate methode, call it.
// The associate method will define the relationships between the models.
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

module.exports = db;