const { Fabrika, Punetori } = require('../models');

let tableSetupPromise = null;

const ensureFabrikaTables = async () => {
  if (!tableSetupPromise) {
    tableSetupPromise = (async () => {
      await Fabrika.sync();
      await Punetori.sync();
    })().catch((error) => {
      tableSetupPromise = null;
      throw error;
    });
  }

  return tableSetupPromise;
};

const cleanText = (value) => String(value || '').trim();

const serializeFabrika = (fabrika) => {
  const data = fabrika.toJSON ? fabrika.toJSON() : fabrika;
  return {
    id: data.id,
    emriFabrikes: data.emriFabrikes,
    lokacioni: data.lokacioni,
    punetoretCount: Array.isArray(data.punetoret) ? data.punetoret.length : Number(data.punetoretCount || 0),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
};

const serializePunetori = (punetori) => {
  const data = punetori.toJSON ? punetori.toJSON() : punetori;
  return {
    id: data.id,
    emri: data.emri,
    mbiemri: data.mbiemri,
    pozita: data.pozita,
    fabrikaId: data.fabrikaId,
    fabrika: data.fabrika ? {
      id: data.fabrika.id,
      emriFabrikes: data.fabrika.emriFabrikes,
      lokacioni: data.fabrika.lokacioni
    } : null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
};

const getFabrikat = async (req, res) => {
  try {
    await ensureFabrikaTables();

    const fabrikat = await Fabrika.findAll({
      include: [{
        model: Punetori,
        as: 'punetoret',
        attributes: ['id']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ fabrikat: fabrikat.map(serializeFabrika) });
  } catch (error) {
    console.error('Get fabrikat error:', error);
    res.status(500).json({ error: 'Failed to fetch fabrikat.' });
  }
};

const createFabrika = async (req, res) => {
  try {
    await ensureFabrikaTables();

    const emriFabrikes = cleanText(req.body.emriFabrikes);
    const lokacioni = cleanText(req.body.lokacioni);

    if (!emriFabrikes || !lokacioni) {
      return res.status(400).json({ error: 'EmriFabrikes and Lokacioni are required.' });
    }

    const fabrika = await Fabrika.create({ emriFabrikes, lokacioni });

    res.status(201).json({
      message: 'Fabrika created successfully.',
      fabrika: serializeFabrika(fabrika)
    });
  } catch (error) {
    console.error('Create fabrika error:', error);
    res.status(500).json({ error: 'Failed to create fabrika.' });
  }
};

const updateFabrika = async (req, res) => {
  try {
    await ensureFabrikaTables();

    const fabrika = await Fabrika.findByPk(req.params.id);

    if (!fabrika) {
      return res.status(404).json({ error: 'Fabrika not found.' });
    }

    const emriFabrikes = cleanText(req.body.emriFabrikes);
    const lokacioni = cleanText(req.body.lokacioni);

    if (!emriFabrikes || !lokacioni) {
      return res.status(400).json({ error: 'EmriFabrikes and Lokacioni are required.' });
    }

    await fabrika.update({ emriFabrikes, lokacioni });

    res.json({
      message: 'Fabrika updated successfully.',
      fabrika: serializeFabrika(fabrika)
    });
  } catch (error) {
    console.error('Update fabrika error:', error);
    res.status(500).json({ error: 'Failed to update fabrika.' });
  }
};

const deleteFabrika = async (req, res) => {
  try {
    await ensureFabrikaTables();

    const fabrika = await Fabrika.findByPk(req.params.id);

    if (!fabrika) {
      return res.status(404).json({ error: 'Fabrika not found.' });
    }

    await fabrika.destroy();

    res.json({ message: 'Fabrika deleted successfully.' });
  } catch (error) {
    console.error('Delete fabrika error:', error);
    res.status(500).json({ error: 'Failed to delete fabrika.' });
  }
};

const getPunetoret = async (req, res) => {
  try {
    await ensureFabrikaTables();

    const where = {};

    if (req.query.fabrikaId) {
      const fabrikaId = Number(req.query.fabrikaId);

      if (!Number.isInteger(fabrikaId) || fabrikaId < 1) {
        return res.status(400).json({ error: 'fabrikaId must be a valid fabrika ID.' });
      }

      where.fabrikaId = fabrikaId;
    }

    const punetoret = await Punetori.findAll({
      where,
      include: [{
        model: Fabrika,
        as: 'fabrika',
        attributes: ['id', 'emriFabrikes', 'lokacioni']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ punetoret: punetoret.map(serializePunetori) });
  } catch (error) {
    console.error('Get punetoret error:', error);
    res.status(500).json({ error: 'Failed to fetch punetoret.' });
  }
};

const createPunetori = async (req, res) => {
  try {
    await ensureFabrikaTables();

    const emri = cleanText(req.body.emri);
    const mbiemri = cleanText(req.body.mbiemri);
    const pozita = cleanText(req.body.pozita);
    const fabrikaId = Number(req.body.fabrikaId);

    if (!emri || !mbiemri || !pozita || !Number.isInteger(fabrikaId) || fabrikaId < 1) {
      return res.status(400).json({ error: 'Emri, Mbiemri, Pozita, and ID_Fabrika are required.' });
    }

    const fabrika = await Fabrika.findByPk(fabrikaId);

    if (!fabrika) {
      return res.status(404).json({ error: 'Selected fabrika was not found.' });
    }

    const punetori = await Punetori.create({ emri, mbiemri, pozita, fabrikaId });
    const createdPunetori = await Punetori.findByPk(punetori.id, {
      include: [{
        model: Fabrika,
        as: 'fabrika',
        attributes: ['id', 'emriFabrikes', 'lokacioni']
      }]
    });

    res.status(201).json({
      message: 'Punetori created successfully.',
      punetori: serializePunetori(createdPunetori)
    });
  } catch (error) {
    console.error('Create punetori error:', error);
    res.status(500).json({ error: 'Failed to create punetori.' });
  }
};

const deletePunetori = async (req, res) => {
  try {
    await ensureFabrikaTables();

    const punetori = await Punetori.findByPk(req.params.id);

    if (!punetori) {
      return res.status(404).json({ error: 'Punetori not found.' });
    }

    await punetori.destroy();

    res.json({ message: 'Punetori deleted successfully.' });
  } catch (error) {
    console.error('Delete punetori error:', error);
    res.status(500).json({ error: 'Failed to delete punetori.' });
  }
};

module.exports = {
  getFabrikat,
  createFabrika,
  updateFabrika,
  deleteFabrika,
  getPunetoret,
  createPunetori,
  deletePunetori
};
