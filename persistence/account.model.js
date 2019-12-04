/**
 * This is a virtual account.
 * {
 *  "id":1,
 *  "name":"test",
 *  "updatedAt":"2019-12-03T15:52:59.224Z",
 *  "createdAt":"2019-12-03T15:52:59.224Z"
 * }
 */
module.exports = (sequelize, DataTypes) => {

    var Account = sequelize.define('Account', {
        'id': {
            type: DataTypes.INTEGER(11),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        'name': {
            type: DataTypes.STRING(255)
        }
    });

    Account.associate = function (models) {

        // optional, foreign key is stored in the source model (= Account has foreign key to RealAccount)
        models.Account.belongsTo(models.RealAccount, {
            foreignKey: 'realaccountid',
            targetKey: 'id'
        });
    };

    return Account;
};