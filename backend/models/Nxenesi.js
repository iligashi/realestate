module.exports = (sequelize, DataTypes) => {
  const Nxenesi = sequelize.define('Nxenesi', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'ID'
    },
    emriNxenesit: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'EmriNxenesit',
      validate: {
        notEmpty: true,
        len: [2, 150]
      }
    },
    klasa: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'Klasa',
      validate: {
        notEmpty: true,
        len: [1, 50]
      }
    },
    schoolId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'ID_Shkolla',
      references: {
        model: 'Shkolla',
        key: 'ID'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    }
  }, {
    tableName: 'Nxenesi',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['ID_Shkolla'] },
      { fields: ['EmriNxenesit'] }
    ]
  });

  return Nxenesi;
};
