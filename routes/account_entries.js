var express = require('express');
var Sequelize = require('sequelize');
var router = express.Router();

const sqlConfig = {
    user: 'root',
    password: 'test',
    server: '127.0.0.1:3306',
    database: 'cash'
}

var sequelize = new Sequelize(sqlConfig.database, sqlConfig.user, sqlConfig.password, {
    host: 'localhost',
    port: 3306,
    dialect: 'mysql',

    pool: {
        max: 5,
        min: 0,
        idle: 10000
    }
});

var account_entry = sequelize.define('account_entry', {
    'id': {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    'amount': { type: Sequelize.INTEGER }
});

autoIncrement: true,

    /* GET home page. */
    router.get('/', function (req, res, next) {

        sequelize.sync().then(function () {
            return account_entry.create({
                amount: 123
            });
        }).then(function (new_account_entry) {

            const msg = new_account_entry.get({
                plain: true
            });
            console.log(msg);
            res.send(msg);
        });

    });

module.exports = router;
