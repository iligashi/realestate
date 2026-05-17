module.exports = (sequelize, DataTypes) => {
  const Shkolla = sequelize.define('Shkolla', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'ID'
    },
    emriShkolles: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'EmriShkolles',
      validate: {
        notEmpty: true,
        len: [2, 150]
      }
    },
    qyteti: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'Qyteti',
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    }
  }, {
    tableName: 'Shkolla',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['EmriShkolles'] },
      { fields: ['Qyteti'] }
    ]
  });

  return Shkolla;
};
