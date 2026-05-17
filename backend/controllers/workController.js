const { Shkolla, Nxenesi } = require('../models');

let tableSetupPromise = null;

const ensureWorkTables = async () => {
  if (!tableSetupPromise) {
    tableSetupPromise = (async () => {
      await Shkolla.sync();
      await Nxenesi.sync();
    })().catch((error) => {
      tableSetupPromise = null;
      throw error;
    });
  }

  return tableSetupPromise;
};

const cleanText = (value) => String(value || '').trim();

const serializeSchool = (school) => {
  const data = school.toJSON ? school.toJSON() : school;
  return {
    id: data.id,
    emriShkolles: data.emriShkolles,
    qyteti: data.qyteti,
    nxenesitCount: Array.isArray(data.nxenesit) ? data.nxenesit.length : Number(data.nxenesitCount || 0),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
};

const serializeStudent = (student) => {
  const data = student.toJSON ? student.toJSON() : student;
  return {
    id: data.id,
    emriNxenesit: data.emriNxenesit,
    klasa: data.klasa,
    schoolId: data.schoolId,
    shkolla: data.shkolla ? {
      id: data.shkolla.id,
      emriShkolles: data.shkolla.emriShkolles,
      qyteti: data.shkolla.qyteti
    } : null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
};

const getSchools = async (req, res) => {
  try {
    await ensureWorkTables();

    const schools = await Shkolla.findAll({
      include: [{
        model: Nxenesi,
        as: 'nxenesit',
        attributes: ['id']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ schools: schools.map(serializeSchool) });
  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({ error: 'Failed to fetch schools.' });
  }
};

const createSchool = async (req, res) => {
  try {
    await ensureWorkTables();

    const emriShkolles = cleanText(req.body.emriShkolles);
    const qyteti = cleanText(req.body.qyteti);

    if (!emriShkolles || !qyteti) {
      return res.status(400).json({ error: 'EmriShkolles and Qyteti are required.' });
    }

    const school = await Shkolla.create({ emriShkolles, qyteti });

    res.status(201).json({
      message: 'School created successfully.',
      school: serializeSchool(school)
    });
  } catch (error) {
    console.error('Create school error:', error);
    res.status(500).json({ error: 'Failed to create school.' });
  }
};

const updateSchool = async (req, res) => {
  try {
    await ensureWorkTables();

    const school = await Shkolla.findByPk(req.params.id);

    if (!school) {
      return res.status(404).json({ error: 'School not found.' });
    }

    const emriShkolles = cleanText(req.body.emriShkolles);
    const qyteti = cleanText(req.body.qyteti);

    if (!emriShkolles || !qyteti) {
      return res.status(400).json({ error: 'EmriShkolles and Qyteti are required.' });
    }

    await school.update({ emriShkolles, qyteti });

    res.json({
      message: 'School updated successfully.',
      school: serializeSchool(school)
    });
  } catch (error) {
    console.error('Update school error:', error);
    res.status(500).json({ error: 'Failed to update school.' });
  }
};

const deleteSchool = async (req, res) => {
  try {
    await ensureWorkTables();

    const school = await Shkolla.findByPk(req.params.id);

    if (!school) {
      return res.status(404).json({ error: 'School not found.' });
    }

    await school.destroy();

    res.json({ message: 'School deleted successfully.' });
  } catch (error) {
    console.error('Delete school error:', error);
    res.status(500).json({ error: 'Failed to delete school.' });
  }
};

const getStudents = async (req, res) => {
  try {
    await ensureWorkTables();

    const where = {};

    if (req.query.schoolId) {
      const schoolId = Number(req.query.schoolId);

      if (!Number.isInteger(schoolId) || schoolId < 1) {
        return res.status(400).json({ error: 'schoolId must be a valid school ID.' });
      }

      where.schoolId = schoolId;
    }

    const students = await Nxenesi.findAll({
      where,
      include: [{
        model: Shkolla,
        as: 'shkolla',
        attributes: ['id', 'emriShkolles', 'qyteti']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ students: students.map(serializeStudent) });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to fetch students.' });
  }
};

const createStudent = async (req, res) => {
  try {
    await ensureWorkTables();

    const emriNxenesit = cleanText(req.body.emriNxenesit);
    const klasa = cleanText(req.body.klasa);
    const schoolId = Number(req.body.schoolId);

    if (!emriNxenesit || !klasa || !Number.isInteger(schoolId) || schoolId < 1) {
      return res.status(400).json({ error: 'EmriNxenesit, Klasa, and ID_Shkolla are required.' });
    }

    const school = await Shkolla.findByPk(schoolId);

    if (!school) {
      return res.status(404).json({ error: 'Selected school was not found.' });
    }

    const student = await Nxenesi.create({ emriNxenesit, klasa, schoolId });
    const createdStudent = await Nxenesi.findByPk(student.id, {
      include: [{
        model: Shkolla,
        as: 'shkolla',
        attributes: ['id', 'emriShkolles', 'qyteti']
      }]
    });

    res.status(201).json({
      message: 'Student created successfully.',
      student: serializeStudent(createdStudent)
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Failed to create student.' });
  }
};

module.exports = {
  getSchools,
  createSchool,
  updateSchool,
  deleteSchool,
  getStudents,
  createStudent
};
