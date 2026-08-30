import React, { useEffect, useMemo, useState } from 'react';
import { ligjeruesiAPI } from '../services/api';

const emptyLigjeruesiForm = {
  lecturerName: '',
  department: '',
  email: ''
};

const emptyLigjerataForm = {
  lectureName: '',
  lecturerId: ''
};

const getErrorMessage = (error, fallback) => (
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  fallback
);

const LigjeruesiPage = () => {
  const [ligjeruesit, setLigjeruesit] = useState([]);
  const [ligjeratat, setLigjeratat] = useState([]);
  const [ligjeruesiForm, setLigjeruesiForm] = useState(emptyLigjeruesiForm);
  const [ligjerataForm, setLigjerataForm] = useState(emptyLigjerataForm);
  const [editingLigjeruesi, setEditingLigjeruesi] = useState(null);
  const [filterLecturerId, setFilterLecturerId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingLigjeruesi, setIsSavingLigjeruesi] = useState(false);
  const [isSavingLigjerata, setIsSavingLigjerata] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const totalLigjerata = useMemo(
    () => ligjeruesit.reduce((total, ligjeruesi) => total + Number(ligjeruesi.ligjeratatCount || 0), 0),
    [ligjeruesit]
  );

  const selectedFilterLigjeruesi = useMemo(
    () => ligjeruesit.find((ligjeruesi) => String(ligjeruesi.id) === String(filterLecturerId)),
    [ligjeruesit, filterLecturerId]
  );

  const fetchLigjeruesit = async () => {
    const response = await ligjeruesiAPI.getLigjeruesit();
    setLigjeruesit(response.data.ligjeruesit || []);
  };

  const fetchLigjeratat = async (lecturerId = filterLecturerId) => {
    const response = await ligjeruesiAPI.getLigjeratat(lecturerId);
    setLigjeratat(response.data.ligjeratat || []);
  };

  const loadLigjeruesiData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [ligjeruesitResponse, ligjeratatResponse] = await Promise.all([
        ligjeruesiAPI.getLigjeruesit(),
        ligjeruesiAPI.getLigjeratat(filterLecturerId)
      ]);

      setLigjeruesit(ligjeruesitResponse.data.ligjeruesit || []);
      setLigjeratat(ligjeratatResponse.data.ligjeratat || []);
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Te dhenat nuk u ngarkuan.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLigjeruesiData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const refreshLigjeratat = async () => {
      setError('');

      try {
        await fetchLigjeratat(filterLecturerId);
      } catch (ligjerataError) {
        setError(getErrorMessage(ligjerataError, 'Ligjeratat nuk u ngarkuan.'));
      }
    };

    refreshLigjeratat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterLecturerId]);

  const handleLigjeruesiChange = (event) => {
    const { name, value } = event.target;
    setLigjeruesiForm((current) => ({ ...current, [name]: value }));
  };

  const handleLigjerataChange = (event) => {
    const { name, value } = event.target;
    setLigjerataForm((current) => ({ ...current, [name]: value }));
  };

  const resetLigjeruesiForm = () => {
    setLigjeruesiForm(emptyLigjeruesiForm);
    setEditingLigjeruesi(null);
  };

  const handleLigjeruesiSubmit = async (event) => {
    event.preventDefault();
    setIsSavingLigjeruesi(true);
    setNotice('');
    setError('');

    try {
      if (editingLigjeruesi) {
        await ligjeruesiAPI.updateLigjeruesi(editingLigjeruesi.id, ligjeruesiForm);
        setNotice('Ligjeruesi u perditesua me sukses.');
      } else {
        await ligjeruesiAPI.createLigjeruesi(ligjeruesiForm);
        setNotice('Ligjeruesi u shtua me sukses.');
      }

      resetLigjeruesiForm();
      await fetchLigjeruesit();
      await fetchLigjeratat(filterLecturerId);
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Ligjeruesi nuk u ruajt.'));
    } finally {
      setIsSavingLigjeruesi(false);
    }
  };

  const startEditingLigjeruesi = (ligjeruesi) => {
    setEditingLigjeruesi(ligjeruesi);
    setLigjeruesiForm({
      lecturerName: ligjeruesi.lecturerName || '',
      department: ligjeruesi.department || '',
      email: ligjeruesi.email || ''
    });
    setNotice('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteLigjeruesi = async (ligjeruesi) => {
    const confirmed = window.confirm(
      `A jeni i sigurt qe doni te fshini ligjeruesin "${ligjeruesi.lecturerName}"? Ligjeratat e tij/saj do te fshihen gjithashtu.`
    );

    if (!confirmed) {
      return;
    }

    setNotice('');
    setError('');

    try {
      await ligjeruesiAPI.deleteLigjeruesi(ligjeruesi.id);
      setNotice('Ligjeruesi u fshi me sukses.');

      const nextFilterLecturerId = String(filterLecturerId) === String(ligjeruesi.id) ? '' : filterLecturerId;
      setFilterLecturerId(nextFilterLecturerId);
      await fetchLigjeruesit();
      await fetchLigjeratat(nextFilterLecturerId);

      if (editingLigjeruesi?.id === ligjeruesi.id) {
        resetLigjeruesiForm();
      }
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Ligjeruesi nuk u fshi.'));
    }
  };

  const handleLigjerataSubmit = async (event) => {
    event.preventDefault();
    setIsSavingLigjerata(true);
    setNotice('');
    setError('');

    try {
      await ligjeruesiAPI.createLigjerata(ligjerataForm);
      setNotice('Ligjerata u shtua me sukses.');
      setLigjerataForm(emptyLigjerataForm);
      await fetchLigjeruesit();
      await fetchLigjeratat(filterLecturerId);
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Ligjerata nuk u ruajt.'));
    } finally {
      setIsSavingLigjerata(false);
    }
  };

  const handleDeleteLigjerata = async (ligjerata) => {
    const confirmed = window.confirm(
      `A jeni i sigurt qe doni te fshini ligjeraten "${ligjerata.lectureName}"?`
    );

    if (!confirmed) {
      return;
    }

    setNotice('');
    setError('');

    try {
      await ligjeruesiAPI.deleteLigjerata(ligjerata.id);
      setNotice('Ligjerata u fshi me sukses.');
      await fetchLigjeruesit();
      await fetchLigjeratat(filterLecturerId);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Ligjerata nuk u fshi.'));
    }
  };

  return (
    <div>
      <h1>Ligjeruesi dhe Ligjerata</h1>
      <p>Ligjerues: {ligjeruesit.length}</p>
      <p>Ligjerata: {totalLigjerata}</p>

      {notice && <p>{notice}</p>}
      {error && <p>{error}</p>}

      <hr />

      <fieldset>
        <legend>{editingLigjeruesi ? 'Perditeso Ligjeruesin' : 'Shto Ligjerues'}</legend>
        <form onSubmit={handleLigjeruesiSubmit}>
          <p>
            <label htmlFor="lecturerName">LecturerName</label>
            <br />
            <input
              id="lecturerName"
              name="lecturerName"
              type="text"
              value={ligjeruesiForm.lecturerName}
              onChange={handleLigjeruesiChange}
              required
            />
          </p>

          <p>
            <label htmlFor="department">Department</label>
            <br />
            <input
              id="department"
              name="department"
              type="text"
              value={ligjeruesiForm.department}
              onChange={handleLigjeruesiChange}
              required
            />
          </p>

          <p>
            <label htmlFor="email">Email</label>
            <br />
            <input
              id="email"
              name="email"
              type="email"
              value={ligjeruesiForm.email}
              onChange={handleLigjeruesiChange}
              required
            />
          </p>

          <button type="submit" disabled={isSavingLigjeruesi}>
            {editingLigjeruesi ? 'Ruaj ndryshimet' : 'Shto ligjerues'}
          </button>

          {editingLigjeruesi && (
            <button type="button" onClick={resetLigjeruesiForm}>
              Anulo
            </button>
          )}
        </form>
      </fieldset>

      <fieldset>
        <legend>Shto Ligjerate</legend>
        <form onSubmit={handleLigjerataSubmit}>
          <p>
            <label htmlFor="lectureName">LectureName</label>
            <br />
            <input
              id="lectureName"
              name="lectureName"
              type="text"
              value={ligjerataForm.lectureName}
              onChange={handleLigjerataChange}
              required
            />
          </p>

          <p>
            <label htmlFor="ligjerataLecturerId">Ligjeruesi</label>
            <br />
            <select
              id="ligjerataLecturerId"
              name="lecturerId"
              value={ligjerataForm.lecturerId}
              onChange={handleLigjerataChange}
              required
            >
              <option value="">Zgjidh ligjeruesin</option>
              {ligjeruesit.map((ligjeruesi) => (
                <option key={ligjeruesi.id} value={ligjeruesi.id}>
                  {ligjeruesi.lecturerName} - {ligjeruesi.department}
                </option>
              ))}
            </select>
          </p>

          <button type="submit" disabled={isSavingLigjerata || ligjeruesit.length === 0}>
            Shto ligjerate
          </button>
        </form>
      </fieldset>

      <hr />

      <h2>Lista e Ligjeruesve</h2>
      <button type="button" onClick={loadLigjeruesiData}>
        Rifresko
      </button>

      {isLoading ? (
        <p>Duke ngarkuar ligjeruesit...</p>
      ) : ligjeruesit.length === 0 ? (
        <p>Nuk ka ende ligjerues te regjistruar.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>LecturerID</th>
              <th>LecturerName</th>
              <th>Department</th>
              <th>Email</th>
              <th>Ligjerata</th>
              <th>Veprime</th>
            </tr>
          </thead>
          <tbody>
            {ligjeruesit.map((ligjeruesi) => (
              <tr key={ligjeruesi.id}>
                <td>{ligjeruesi.id}</td>
                <td>{ligjeruesi.lecturerName}</td>
                <td>{ligjeruesi.department}</td>
                <td>{ligjeruesi.email}</td>
                <td>{ligjeruesi.ligjeratatCount}</td>
                <td>
                  <button type="button" onClick={() => startEditingLigjeruesi(ligjeruesi)}>
                    Edito
                  </button>
                  <button type="button" onClick={() => handleDeleteLigjeruesi(ligjeruesi)}>
                    Fshi
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Lista e Ligjeratave</h2>
      <p>
        {selectedFilterLigjeruesi
          ? `Filtruar sipas: ${selectedFilterLigjeruesi.lecturerName}`
          : 'Te gjitha ligjeratat'}
      </p>

      <p>
        <label htmlFor="filterLecturerId">Filtro sipas ligjeruesit</label>
        <br />
        <select
          id="filterLecturerId"
          value={filterLecturerId}
          onChange={(event) => setFilterLecturerId(event.target.value)}
        >
          <option value="">Te gjithe ligjeruesit</option>
          {ligjeruesit.map((ligjeruesi) => (
            <option key={ligjeruesi.id} value={ligjeruesi.id}>
              {ligjeruesi.lecturerName}
            </option>
          ))}
        </select>
      </p>

      {isLoading ? (
        <p>Duke ngarkuar ligjeratat...</p>
      ) : ligjeratat.length === 0 ? (
        <p>Nuk ka ligjerata per kete zgjedhje.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>LectureID</th>
              <th>LectureName</th>
              <th>LecturerID</th>
              <th>LecturerName</th>
              <th>Department</th>
              <th>Email</th>
              <th>Veprime</th>
            </tr>
          </thead>
          <tbody>
            {ligjeratat.map((ligjerata) => (
              <tr key={ligjerata.id}>
                <td>{ligjerata.id}</td>
                <td>{ligjerata.lectureName}</td>
                <td>{ligjerata.lecturerId}</td>
                <td>{ligjerata.ligjeruesi?.lecturerName || 'Pa ligjerues'}</td>
                <td>{ligjerata.ligjeruesi?.department || ''}</td>
                <td>{ligjerata.ligjeruesi?.email || ''}</td>
                <td>
                  <button type="button" onClick={() => handleDeleteLigjerata(ligjerata)}>
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

export default LigjeruesiPage;
