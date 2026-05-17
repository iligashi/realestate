import React, { useEffect, useMemo, useState } from 'react';
import { fabrikaAPI } from '../services/api';

const emptyFabrikaForm = {
  emriFabrikes: '',
  lokacioni: ''
};

const emptyPunetoriForm = {
  emri: '',
  mbiemri: '',
  pozita: '',
  fabrikaId: ''
};

const getErrorMessage = (error, fallback) => (
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  fallback
);

const FabrikaPage = () => {
  const [fabrikat, setFabrikat] = useState([]);
  const [punetoret, setPunetoret] = useState([]);
  const [fabrikaForm, setFabrikaForm] = useState(emptyFabrikaForm);
  const [punetoriForm, setPunetoriForm] = useState(emptyPunetoriForm);
  const [editingFabrika, setEditingFabrika] = useState(null);
  const [filterFabrikaId, setFilterFabrikaId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingFabrika, setIsSavingFabrika] = useState(false);
  const [isSavingPunetori, setIsSavingPunetori] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const totalPunetore = useMemo(
    () => fabrikat.reduce((total, fabrika) => total + Number(fabrika.punetoretCount || 0), 0),
    [fabrikat]
  );

  const selectedFilterFabrika = useMemo(
    () => fabrikat.find((fabrika) => String(fabrika.id) === String(filterFabrikaId)),
    [fabrikat, filterFabrikaId]
  );

  const fetchFabrikat = async () => {
    const response = await fabrikaAPI.getFabrikat();
    setFabrikat(response.data.fabrikat || []);
  };

  const fetchPunetoret = async (fabrikaId = filterFabrikaId) => {
    const response = await fabrikaAPI.getPunetoret(fabrikaId);
    setPunetoret(response.data.punetoret || []);
  };

  const loadFabrikaData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [fabrikatResponse, punetoretResponse] = await Promise.all([
        fabrikaAPI.getFabrikat(),
        fabrikaAPI.getPunetoret(filterFabrikaId)
      ]);

      setFabrikat(fabrikatResponse.data.fabrikat || []);
      setPunetoret(punetoretResponse.data.punetoret || []);
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Te dhenat nuk u ngarkuan.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFabrikaData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const refreshPunetoret = async () => {
      setError('');

      try {
        await fetchPunetoret(filterFabrikaId);
      } catch (punetoriError) {
        setError(getErrorMessage(punetoriError, 'Punetoret nuk u ngarkuan.'));
      }
    };

    refreshPunetoret();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterFabrikaId]);

  const handleFabrikaChange = (event) => {
    const { name, value } = event.target;
    setFabrikaForm((current) => ({ ...current, [name]: value }));
  };

  const handlePunetoriChange = (event) => {
    const { name, value } = event.target;
    setPunetoriForm((current) => ({ ...current, [name]: value }));
  };

  const resetFabrikaForm = () => {
    setFabrikaForm(emptyFabrikaForm);
    setEditingFabrika(null);
  };

  const handleFabrikaSubmit = async (event) => {
    event.preventDefault();
    setIsSavingFabrika(true);
    setNotice('');
    setError('');

    try {
      if (editingFabrika) {
        await fabrikaAPI.updateFabrika(editingFabrika.id, fabrikaForm);
        setNotice('Fabrika u perditesua me sukses.');
      } else {
        await fabrikaAPI.createFabrika(fabrikaForm);
        setNotice('Fabrika u shtua me sukses.');
      }

      resetFabrikaForm();
      await fetchFabrikat();
      await fetchPunetoret(filterFabrikaId);
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Fabrika nuk u ruajt.'));
    } finally {
      setIsSavingFabrika(false);
    }
  };

  const startEditingFabrika = (fabrika) => {
    setEditingFabrika(fabrika);
    setFabrikaForm({
      emriFabrikes: fabrika.emriFabrikes || '',
      lokacioni: fabrika.lokacioni || ''
    });
    setNotice('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteFabrika = async (fabrika) => {
    const confirmed = window.confirm(
      `A jeni i sigurt qe doni te fshini fabriken "${fabrika.emriFabrikes}"? Punetoret e saj do te fshihen gjithashtu.`
    );

    if (!confirmed) {
      return;
    }

    setNotice('');
    setError('');

    try {
      await fabrikaAPI.deleteFabrika(fabrika.id);
      setNotice('Fabrika u fshi me sukses.');

      const nextFilterFabrikaId = String(filterFabrikaId) === String(fabrika.id) ? '' : filterFabrikaId;
      setFilterFabrikaId(nextFilterFabrikaId);
      await fetchFabrikat();
      await fetchPunetoret(nextFilterFabrikaId);

      if (editingFabrika?.id === fabrika.id) {
        resetFabrikaForm();
      }
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Fabrika nuk u fshi.'));
    }
  };

  const handlePunetoriSubmit = async (event) => {
    event.preventDefault();
    setIsSavingPunetori(true);
    setNotice('');
    setError('');

    try {
      await fabrikaAPI.createPunetori(punetoriForm);
      setNotice('Punetori u shtua me sukses.');
      setPunetoriForm(emptyPunetoriForm);
      await fetchFabrikat();
      await fetchPunetoret(filterFabrikaId);
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Punetori nuk u ruajt.'));
    } finally {
      setIsSavingPunetori(false);
    }
  };

  const handleDeletePunetori = async (punetori) => {
    const confirmed = window.confirm(
      `A jeni i sigurt qe doni te fshini punetorin "${punetori.emri} ${punetori.mbiemri}"?`
    );

    if (!confirmed) {
      return;
    }

    setNotice('');
    setError('');

    try {
      await fabrikaAPI.deletePunetori(punetori.id);
      setNotice('Punetori u fshi me sukses.');
      await fetchFabrikat();
      await fetchPunetoret(filterFabrikaId);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Punetori nuk u fshi.'));
    }
  };

  return (
    <div>
      <h1>Fabrika dhe Punetori</h1>
      <p>Fabrika: {fabrikat.length}</p>
      <p>Punetore: {totalPunetore}</p>

      {notice && <p>{notice}</p>}
      {error && <p>{error}</p>}

      <hr />

      <fieldset>
        <legend>{editingFabrika ? 'Perditeso Fabriken' : 'Shto Fabrike'}</legend>
        <form onSubmit={handleFabrikaSubmit}>
          <p>
            <label htmlFor="emriFabrikes">Emri i fabrikes</label>
            <br />
            <input
              id="emriFabrikes"
              name="emriFabrikes"
              type="text"
              value={fabrikaForm.emriFabrikes}
              onChange={handleFabrikaChange}
              required
            />
          </p>

          <p>
            <label htmlFor="lokacioni">Lokacioni</label>
            <br />
            <input
              id="lokacioni"
              name="lokacioni"
              type="text"
              value={fabrikaForm.lokacioni}
              onChange={handleFabrikaChange}
              required
            />
          </p>

          <button type="submit" disabled={isSavingFabrika}>
            {editingFabrika ? 'Ruaj ndryshimet' : 'Shto fabrike'}
          </button>

          {editingFabrika && (
            <button type="button" onClick={resetFabrikaForm}>
              Anulo
            </button>
          )}
        </form>
      </fieldset>

      <fieldset>
        <legend>Shto Punetori</legend>
        <form onSubmit={handlePunetoriSubmit}>
          <p>
            <label htmlFor="emri">Emri</label>
            <br />
            <input
              id="emri"
              name="emri"
              type="text"
              value={punetoriForm.emri}
              onChange={handlePunetoriChange}
              required
            />
          </p>

          <p>
            <label htmlFor="mbiemri">Mbiemri</label>
            <br />
            <input
              id="mbiemri"
              name="mbiemri"
              type="text"
              value={punetoriForm.mbiemri}
              onChange={handlePunetoriChange}
              required
            />
          </p>

          <p>
            <label htmlFor="pozita">Pozita</label>
            <br />
            <input
              id="pozita"
              name="pozita"
              type="text"
              value={punetoriForm.pozita}
              onChange={handlePunetoriChange}
              required
            />
          </p>

          <p>
            <label htmlFor="punetoriFabrikaId">Fabrika</label>
            <br />
            <select
              id="punetoriFabrikaId"
              name="fabrikaId"
              value={punetoriForm.fabrikaId}
              onChange={handlePunetoriChange}
              required
            >
              <option value="">Zgjidh fabriken</option>
              {fabrikat.map((fabrika) => (
                <option key={fabrika.id} value={fabrika.id}>
                  {fabrika.emriFabrikes} - {fabrika.lokacioni}
                </option>
              ))}
            </select>
          </p>

          <button type="submit" disabled={isSavingPunetori || fabrikat.length === 0}>
            Shto punetori
          </button>
        </form>
      </fieldset>

      <hr />

      <h2>Lista e Fabrikave</h2>
      <button type="button" onClick={loadFabrikaData}>
        Rifresko
      </button>

      {isLoading ? (
        <p>Duke ngarkuar fabrikat...</p>
      ) : fabrikat.length === 0 ? (
        <p>Nuk ka ende fabrika te regjistruara.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>EmriFabrikes</th>
              <th>Lokacioni</th>
              <th>Punetore</th>
              <th>Veprime</th>
            </tr>
          </thead>
          <tbody>
            {fabrikat.map((fabrika) => (
              <tr key={fabrika.id}>
                <td>{fabrika.id}</td>
                <td>{fabrika.emriFabrikes}</td>
                <td>{fabrika.lokacioni}</td>
                <td>{fabrika.punetoretCount}</td>
                <td>
                  <button type="button" onClick={() => startEditingFabrika(fabrika)}>
                    Edito
                  </button>
                  <button type="button" onClick={() => handleDeleteFabrika(fabrika)}>
                    Fshi
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Lista e Punetoreve</h2>
      <p>
        {selectedFilterFabrika
          ? `Filtruar sipas: ${selectedFilterFabrika.emriFabrikes}`
          : 'Te gjithe punetoret'}
      </p>

      <p>
        <label htmlFor="filterFabrikaId">Filtro sipas fabrikes</label>
        <br />
        <select
          id="filterFabrikaId"
          value={filterFabrikaId}
          onChange={(event) => setFilterFabrikaId(event.target.value)}
        >
          <option value="">Te gjitha fabrikat</option>
          {fabrikat.map((fabrika) => (
            <option key={fabrika.id} value={fabrika.id}>
              {fabrika.emriFabrikes}
            </option>
          ))}
        </select>
      </p>

      {isLoading ? (
        <p>Duke ngarkuar punetoret...</p>
      ) : punetoret.length === 0 ? (
        <p>Nuk ka punetore per kete zgjedhje.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Emri</th>
              <th>Mbiemri</th>
              <th>Pozita</th>
              <th>Fabrika</th>
              <th>Lokacioni</th>
              <th>Veprime</th>
            </tr>
          </thead>
          <tbody>
            {punetoret.map((punetori) => (
              <tr key={punetori.id}>
                <td>{punetori.id}</td>
                <td>{punetori.emri}</td>
                <td>{punetori.mbiemri}</td>
                <td>{punetori.pozita}</td>
                <td>{punetori.fabrika?.emriFabrikes || 'Pa fabrike'}</td>
                <td>{punetori.fabrika?.lokacioni || ''}</td>
                <td>
                  <button type="button" onClick={() => handleDeletePunetori(punetori)}>
                    Fshi
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FabrikaPage;
