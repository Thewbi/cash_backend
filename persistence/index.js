// inspired by https://github.com/sequelize/express-example/blob/master/models

var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');
var services = require('../persistence_services/services');

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
    logging: false,
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

async function main() {

    //     console.log('main start');

    //     console.log('clearing database ...');

    // // delete the entire database
    // await db.sequelize.sync({
    //     force: true
    // });

    // console.log('clearing database done.');

    // var amount1 = 100;
    // // add real account
    // var realAccount1 = await services.addRealAccount(db, 'RealAccount-1', amount1);

    // // virtual account for real account
    // var virtualAccount1 = await services.addVirtualAccount(db, 'VirtualAccount-1', realAccount1);

    // // amount for virtual account 1
    // var amount1 = await services.addAmount(db, realAccount1, virtualAccount1, amount1);



    // var amount2 = 100;
    // // add real account
    // var realAccount2 = await services.addRealAccount(db, 'RealAccount-2', amount2);

    // // virtual account for real account
    // var virtualAccount2 = await services.addVirtualAccount(db, 'VirtualAccount-2', realAccount2);

    // // amount for virtual account 2
    // var amount2 = await services.addAmount(db, realAccount2, virtualAccount2, amount2);




    // var amount3 = 0;
    // // add real account
    // var realAccount3 = await services.addRealAccount(db, 'RealAccount-3', amount3);

    // // virtual account for real account
    // var virtualAccount3 = await services.addVirtualAccount(db, 'VirtualAccount-3', realAccount3);

    // // amount for virtual account 3
    // var amount3 = await services.addAmount(db, realAccount3, virtualAccount3, amount3);





    // // virtual account without a real account
    // var virtualAccount4 = await services.addVirtualAccount(db, 'VirtualAccount-4', null);
    // var virtualAccount5 = await services.addVirtualAccount(db, 'VirtualAccount-5', null);


    //     console.log('transfering money ...');
    //     await services.transferAmount(db, virtualAccount1, virtualAccount4, 50);
    //     await services.transferAmount(db, virtualAccount2, virtualAccount4, 50);

    //     await services.transferAmount(db, virtualAccount4, virtualAccount5, 75);
    //     //await services.transferAmount(db, virtualAccount5, virtualAccount3, 10);
    //     await services.transferAmount(db, virtualAccount5, virtualAccount3, 75);
    //     console.log('transfering money done.');

    //     console.log('main end');
}

main();

module.exports = db;