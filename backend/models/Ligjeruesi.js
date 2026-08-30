module.exports = (sequelize, DataTypes) => {
  const Ligjeruesi = sequelize.define('Ligjeruesi', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'LecturerID'
    },
    lecturerName: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'LecturerName',
      validate: {
        notEmpty: true,
        len: [2, 150]
      }
    },
    department: {
      type: DataTypes.STRING(120),
      allowNull: false,
      field: 'Department',
      validate: {
        notEmpty: true,
        len: [2, 120]
      }
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'Email',
      validate: {
        isEmail: true,
        notEmpty: true,
        len: [5, 150]
      }
    }
  }, {
    tableName: 'Ligjeruesi',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['LecturerName'] },
      { fields: ['Department'] },
      { fields: ['Email'] }
    ]
  });

  return Ligjeruesi;
};
