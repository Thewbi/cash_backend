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

    console.log('main start');

    console.log('clearing database ...');

    // delete the entire database
    await db.sequelize.sync({
        force: true
    });

    console.log('clearing database done.');




    var amount1 = 100;
    var realAccount1 = await addRealAccount(1, amount1);

    // virtual account for real account
    var virtualAccount1 = await addVirtualAccount(realAccount1, 1);

    // amount for virtual account 1
    var amount1 = await addAmount(realAccount1, virtualAccount1, amount1);



    var amount2 = 100;
    var realAccount2 = await addRealAccount(2, amount2);

    // virtual account for real account
    var virtualAccount2 = await addVirtualAccount(realAccount2, 2);

    // amount for virtual account 2
    var amount2 = await addAmount(realAccount2, virtualAccount2, amount2);




    var amount3 = 0;
    var realAccount3 = await addRealAccount(3, amount3);

    // virtual account for real account
    var virtualAccount3 = await addVirtualAccount(realAccount3, 3);

    // amount for virtual account 3
    var amount3 = await addAmount(realAccount3, virtualAccount3, amount3);





    // virtual account without a real account
    var virtualAccount4 = await addVirtualAccount(null, 4);
    var virtualAccount5 = await addVirtualAccount(null, 5);


    console.log('transfering money ...');
    await transferAmount(virtualAccount1, virtualAccount4, 50);
    await transferAmount(virtualAccount2, virtualAccount4, 50);

    await transferAmount(virtualAccount4, virtualAccount5, 75);
    //await transferAmount(virtualAccount5, virtualAccount3, 10);
    await transferAmount(virtualAccount5, virtualAccount3, 75);
    console.log('transfering money done.');

    console.log('main end');
}

main();

async function transferAmount(virtualAccountSource, virtualAccountTarget, amount) {

    if (amount <= 0) {
        console.log('amount has to be larger than zero!');
        return;
    }

    // accumulate the amount of money in the source account
    var sourceAmounts = await virtualAccountSource.getAmounts();

    if (typeof sourceAmounts === 'undefined' || sourceAmounts.length === 0) {
        console.log('No source amounts!');
        return;
    }

    var totalAmountInSource = 0;
    sourceAmounts.forEach(sourceAmount => {
        totalAmountInSource += sourceAmount.amount;
    });

    console.log('totalAmountInSource:', totalAmountInSource);

    // check if the source amount can serve the request
    if (totalAmountInSource < amount) {
        console.log('There is not enough money in the source account!');
        return;
    }

    var amountLeft = amount;

    // copy amounts until the total amount was transferred
    console.log('sourceAmounts.length:', sourceAmounts.length);
    for (var i = 0; i < sourceAmounts.length; i++) {

        var sourceAmount = sourceAmounts[i];

        // create amount in target virtual account
        var targetAmount = null;
        var targetAmounts = await findAmountInVirtualAccount(virtualAccountTarget, sourceAmount.realaccountid);
        if (typeof targetAmounts !== 'undefined' && targetAmounts.length > 0) {

            console.log('amount existed!');
            targetAmount = targetAmounts[0];
        } else {

            console.log('RealID:', sourceAmount.realaccountid);
            console.log('VirtualID:', virtualAccountTarget.id);

            targetAmount = await addAmountByIds(sourceAmount.realaccountid, virtualAccountTarget.id, 0);

            console.log('amount was created!');
        }

        if (amountLeft <= sourceAmount.amount) {

            console.log('Money fits!');

            sourceAmount.amount -= amountLeft;
            await sourceAmount.save().then(() => { });
            targetAmount.amount += amountLeft;
            await targetAmount.save().then(() => { });



            // if there is a physical acount backing the target virtual account
            // transfer real money
            if (virtualAccountTarget.realaccountid !== undefined) {
                console.log('there is a real account!');

                var realAccount = await virtualAccountTarget.getRealAccount();
                realAccount.amount += amountLeft;
                await realAccount.save().then(() => { });

                // subtract from the source real account
                var sourceRealAccount = await sourceAmount.getRealAccount();
                sourceRealAccount.amount -= amountLeft;
                await sourceRealAccount.save().then(() => { });
            }

            amountLeft = 0;

            // do not iterate further
            break;

        } else {

            var oldSourceAmount = sourceAmount.amount;

            sourceAmount.amount = 0;
            await sourceAmount.save().then(() => { });
            targetAmount.amount += oldSourceAmount;
            await targetAmount.save().then(() => { });

            // if there is a physical acount backing the target virtual account
            // transfer real money
            if (virtualAccountTarget.realaccountid !== undefined) {
                console.log('there is a real account!');

                var realAccount = await virtualAccountTarget.getRealAccount();
                realAccount.amount += oldSourceAmount;
                await realAccount.save().then(() => { });

                // subtract from the source real account
                var sourceRealAccount = await sourceAmount.getRealAccount();
                sourceRealAccount.amount -= oldSourceAmount;
                await sourceRealAccount.save().then(() => { });
            }

            amountLeft -= oldSourceAmount;
        }
    }
}

async function findAmountInVirtualAccount(virtualAccount, realaccountid) {
    return db.Amount.findAll({
        where: {
            realaccountid: realaccountid,
            virtualaccountid: virtualAccount.id
        }
    });
}

async function addRealAccount(index, amount) {
    return db.RealAccount.create({
        name: 'RealAccount-' + index,
        amount: amount
    });
}

async function addVirtualAccount(realAccount, index) {

    if (realAccount) {
        return db.Account.create({
            name: 'VirtualAccount-' + index,
            realaccountid: realAccount.id
        });
    }

    return db.Account.create({
        name: 'VirtualAccount-' + index
    });
}

async function addAmount(realAccount, virtualAccount, amount) {
    return db.Amount.create({
        amount: amount,
        realaccountid: realAccount.id,
        virtualaccountid: virtualAccount.id
    });
}

async function addAmountByIds(realAccountId, virtualAccountId, amount) {
    return db.Amount.create({
        amount: amount,
        realaccountid: realAccountId,
        virtualaccountid: virtualAccountId
    });
}

module.exports = db;