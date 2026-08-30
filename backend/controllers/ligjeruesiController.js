const { Ligjeruesi, Ligjerata } = require('../models');

let tableSetupPromise = null;

const ensureLigjeruesiTables = async () => {
  if (!tableSetupPromise) {
    tableSetupPromise = (async () => {
      await Ligjeruesi.sync();
      await Ligjerata.sync();
    })().catch((error) => {
      tableSetupPromise = null;
      throw error;
    });
  }

  return tableSetupPromise;
};

const cleanText = (value) => String(value || '').trim();

const serializeLigjeruesi = (ligjeruesi) => {
  const data = ligjeruesi.toJSON ? ligjeruesi.toJSON() : ligjeruesi;
  return {
    id: data.id,
    lecturerName: data.lecturerName,
    department: data.department,
    email: data.email,
    ligjeratatCount: Array.isArray(data.ligjeratat) ? data.ligjeratat.length : Number(data.ligjeratatCount || 0),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
};

const serializeLigjerata = (ligjerata) => {
  const data = ligjerata.toJSON ? ligjerata.toJSON() : ligjerata;
  return {
    id: data.id,
    lectureName: data.lectureName,
    lecturerId: data.lecturerId,
    ligjeruesi: data.ligjeruesi ? {
      id: data.ligjeruesi.id,
      lecturerName: data.ligjeruesi.lecturerName,
      department: data.ligjeruesi.department,
      email: data.ligjeruesi.email
    } : null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
};

const getLigjeruesit = async (req, res) => {
  try {
    await ensureLigjeruesiTables();

    const ligjeruesit = await Ligjeruesi.findAll({
      include: [{
        model: Ligjerata,
        as: 'ligjeratat',
        attributes: ['id']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ ligjeruesit: ligjeruesit.map(serializeLigjeruesi) });
  } catch (error) {
    console.error('Get ligjeruesit error:', error);
    res.status(500).json({ error: 'Failed to fetch ligjeruesit.' });
  }
};

const createLigjeruesi = async (req, res) => {
  try {
    await ensureLigjeruesiTables();

    const lecturerName = cleanText(req.body.lecturerName);
    const department = cleanText(req.body.department);
    const email = cleanText(req.body.email);

    if (!lecturerName || !department || !email) {
      return res.status(400).json({ error: 'LecturerName, Department, and Email are required.' });
    }

    const ligjeruesi = await Ligjeruesi.create({ lecturerName, department, email });

    res.status(201).json({
      message: 'Ligjeruesi created successfully.',
      ligjeruesi: serializeLigjeruesi(ligjeruesi)
    });
  } catch (error) {
    console.error('Create ligjeruesi error:', error);
    res.status(500).json({ error: 'Failed to create ligjeruesi.' });
  }
};

const updateLigjeruesi = async (req, res) => {
  try {
    await ensureLigjeruesiTables();

    const ligjeruesi = await Ligjeruesi.findByPk(req.params.id);

    if (!ligjeruesi) {
      return res.status(404).json({ error: 'Ligjeruesi not found.' });
    }

    const lecturerName = cleanText(req.body.lecturerName);
    const department = cleanText(req.body.department);
    const email = cleanText(req.body.email);

    if (!lecturerName || !department || !email) {
      return res.status(400).json({ error: 'LecturerName, Department, and Email are required.' });
    }

    await ligjeruesi.update({ lecturerName, department, email });

    res.json({
      message: 'Ligjeruesi updated successfully.',
      ligjeruesi: serializeLigjeruesi(ligjeruesi)
    });
  } catch (error) {
    console.error('Update ligjeruesi error:', error);
    res.status(500).json({ error: 'Failed to update ligjeruesi.' });
  }
};

const deleteLigjeruesi = async (req, res) => {
  try {
    await ensureLigjeruesiTables();

    const ligjeruesi = await Ligjeruesi.findByPk(req.params.id);

    if (!ligjeruesi) {
      return res.status(404).json({ error: 'Ligjeruesi not found.' });
    }

    await ligjeruesi.destroy();

    res.json({ message: 'Ligjeruesi deleted successfully.' });
  } catch (error) {
    console.error('Delete ligjeruesi error:', error);
    res.status(500).json({ error: 'Failed to delete ligjeruesi.' });
  }
};

const getLigjeratat = async (req, res) => {
  try {
    await ensureLigjeruesiTables();

    const where = {};

    if (req.query.lecturerId) {
      const lecturerId = Number(req.query.lecturerId);

      if (!Number.isInteger(lecturerId) || lecturerId < 1) {
        return res.status(400).json({ error: 'lecturerId must be a valid lecturer ID.' });
      }

      where.lecturerId = lecturerId;
    }

    const ligjeratat = await Ligjerata.findAll({
      where,
      include: [{
        model: Ligjeruesi,
        as: 'ligjeruesi',
        attributes: ['id', 'lecturerName', 'department', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ ligjeratat: ligjeratat.map(serializeLigjerata) });
  } catch (error) {
    console.error('Get ligjeratat error:', error);
    res.status(500).json({ error: 'Failed to fetch ligjeratat.' });
  }
};

const createLigjerata = async (req, res) => {
  try {
    await ensureLigjeruesiTables();

    const lectureName = cleanText(req.body.lectureName);
    const lecturerId = Number(req.body.lecturerId);

    if (!lectureName || !Number.isInteger(lecturerId) || lecturerId < 1) {
      return res.status(400).json({ error: 'LectureName and LecturerID are required.' });
    }

    const ligjeruesi = await Ligjeruesi.findByPk(lecturerId);

    if (!ligjeruesi) {
      return res.status(404).json({ error: 'Selected ligjeruesi was not found.' });
    }

    const ligjerata = await Ligjerata.create({ lectureName, lecturerId });
    const createdLigjerata = await Ligjerata.findByPk(ligjerata.id, {
      include: [{
        model: Ligjeruesi,
        as: 'ligjeruesi',
        attributes: ['id', 'lecturerName', 'department', 'email']
      }]
    });

    res.status(201).json({
      message: 'Ligjerata created successfully.',
      ligjerata: serializeLigjerata(createdLigjerata)
    });
  } catch (error) {
    console.error('Create ligjerata error:', error);
    res.status(500).json({ error: 'Failed to create ligjerata.' });
  }
};

const deleteLigjerata = async (req, res) => {
  try {
    await ensureLigjeruesiTables();

    const ligjerata = await Ligjerata.findByPk(req.params.id);

    if (!ligjerata) {
      return res.status(404).json({ error: 'Ligjerata not found.' });
    }

    await ligjerata.destroy();

    res.json({ message: 'Ligjerata deleted successfully.' });
  } catch (error) {
    console.error('Delete ligjerata error:', error);
    res.status(500).json({ error: 'Failed to delete ligjerata.' });
  }
};

module.exports = {
  getLigjeruesit,
  createLigjeruesi,
  updateLigjeruesi,
  deleteLigjeruesi,
  getLigjeratat,
  createLigjerata,
  deleteLigjerata
};
