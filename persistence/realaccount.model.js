/**
 * This is an account that really exists in the banking institution.
 * {
 *  "id":1,
 *  "name":"test",
 *  "updatedAt":"2019-12-03T15:52:59.224Z",
 *  "createdAt":"2019-12-03T15:52:59.224Z"
 * }
 */
module.exports = (sequelize, DataTypes) => {

    var RealAccount = sequelize.define('RealAccount', {
        'id': {
            type: DataTypes.INTEGER(11),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        'name': {
            type: DataTypes.STRING(255)
        },
        'amount': {
            type: DataTypes.INTEGER(11)
        }
    });

    RealAccount.associate = function (models) {
        //models.RealAccount.hasOne(models.Account);
    };

    return RealAccount;
};