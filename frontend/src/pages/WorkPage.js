import React, { useEffect, useMemo, useState } from 'react';
import { workAPI } from '../services/api';

const emptySchoolForm = {
  emriShkolles: '',
  qyteti: ''
};

const emptyStudentForm = {
  emriNxenesit: '',
  klasa: '',
  schoolId: ''
};

const getErrorMessage = (error, fallback) => (
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  fallback
);

const WorkPage = () => {
  const [schools, setSchools] = useState([]);
  const [students, setStudents] = useState([]);
  const [schoolForm, setSchoolForm] = useState(emptySchoolForm);
  const [studentForm, setStudentForm] = useState(emptyStudentForm);
  const [editingSchool, setEditingSchool] = useState(null);
  const [filterSchoolId, setFilterSchoolId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSchool, setIsSavingSchool] = useState(false);
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const totalStudents = useMemo(
    () => schools.reduce((total, school) => total + Number(school.nxenesitCount || 0), 0),
    [schools]
  );

  const selectedFilterSchool = useMemo(
    () => schools.find((school) => String(school.id) === String(filterSchoolId)),
    [schools, filterSchoolId]
  );

  const fetchSchools = async () => {
    const response = await workAPI.getSchools();
    setSchools(response.data.schools || []);
  };

  const fetchStudents = async (schoolId = filterSchoolId) => {
    const response = await workAPI.getStudents(schoolId);
    setStudents(response.data.students || []);
  };

  const loadWorkData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [schoolsResponse, studentsResponse] = await Promise.all([
        workAPI.getSchools(),
        workAPI.getStudents(filterSchoolId)
      ]);

      setSchools(schoolsResponse.data.schools || []);
      setStudents(studentsResponse.data.students || []);
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Te dhenat nuk u ngarkuan.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const refreshStudents = async () => {
      setError('');

      try {
        await fetchStudents(filterSchoolId);
      } catch (studentError) {
        setError(getErrorMessage(studentError, 'Nxenesit nuk u ngarkuan.'));
      }
    };

    refreshStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSchoolId]);

  const handleSchoolChange = (event) => {
    const { name, value } = event.target;
    setSchoolForm((current) => ({ ...current, [name]: value }));
  };

  const handleStudentChange = (event) => {
    const { name, value } = event.target;
    setStudentForm((current) => ({ ...current, [name]: value }));
  };

  const resetSchoolForm = () => {
    setSchoolForm(emptySchoolForm);
    setEditingSchool(null);
  };

  const handleSchoolSubmit = async (event) => {
    event.preventDefault();
    setIsSavingSchool(true);
    setNotice('');
    setError('');

    try {
      if (editingSchool) {
        await workAPI.updateSchool(editingSchool.id, schoolForm);
        setNotice('Shkolla u perditesua me sukses.');
      } else {
        await workAPI.createSchool(schoolForm);
        setNotice('Shkolla u shtua me sukses.');
      }

      resetSchoolForm();
      await fetchSchools();
      await fetchStudents(filterSchoolId);
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Shkolla nuk u ruajt.'));
    } finally {
      setIsSavingSchool(false);
    }
  };

  const startEditingSchool = (school) => {
    setEditingSchool(school);
    setSchoolForm({
      emriShkolles: school.emriShkolles || '',
      qyteti: school.qyteti || ''
    });
    setNotice('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSchool = async (school) => {
    const confirmed = window.confirm(
      `A jeni i sigurt qe doni te fshini shkollen "${school.emriShkolles}"? Nxenesit e saj do te fshihen gjithashtu.`
    );

    if (!confirmed) {
      return;
    }

    setNotice('');
    setError('');

    try {
      await workAPI.deleteSchool(school.id);
      setNotice('Shkolla u fshi me sukses.');

      const nextFilterSchoolId = String(filterSchoolId) === String(school.id) ? '' : filterSchoolId;
      setFilterSchoolId(nextFilterSchoolId);
      await fetchSchools();
      await fetchStudents(nextFilterSchoolId);

      if (editingSchool?.id === school.id) {
        resetSchoolForm();
      }
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Shkolla nuk u fshi.'));
    }
  };

  const handleStudentSubmit = async (event) => {
    event.preventDefault();
    setIsSavingStudent(true);
    setNotice('');
    setError('');

    try {
      await workAPI.createStudent(studentForm);
      setNotice('Nxenesi u shtua me sukses.');
      setStudentForm(emptyStudentForm);
      await fetchSchools();
      await fetchStudents(filterSchoolId);
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Nxenesi nuk u ruajt.'));
    } finally {
      setIsSavingStudent(false);
    }
  };

  return (
    <div>
      <h1>Shkolla dhe Nxenesi</h1>
      <p>Shkolla: {schools.length}</p>
      <p>Nxenes: {totalStudents}</p>

      {notice && <p>{notice}</p>}
      {error && <p>{error}</p>}

      <hr />

      <fieldset>
        <legend>{editingSchool ? 'Perditeso Shkollen' : 'Shto Shkolle'}</legend>
        <form onSubmit={handleSchoolSubmit}>
          <p>
            <label htmlFor="emriShkolles">Emri i shkolles</label>
            <br />
            <input
              id="emriShkolles"
              name="emriShkolles"
              type="text"
              value={schoolForm.emriShkolles}
              onChange={handleSchoolChange}
              required
            />
          </p>

          <p>
            <label htmlFor="qyteti">Qyteti</label>
            <br />
            <input
              id="qyteti"
              name="qyteti"
              type="text"
              value={schoolForm.qyteti}
              onChange={handleSchoolChange}
              required
            />
          </p>

          <button type="submit" disabled={isSavingSchool}>
            {editingSchool ? 'Ruaj ndryshimet' : 'Shto shkolle'}
          </button>

          {editingSchool && (
            <button type="button" onClick={resetSchoolForm}>
              Anulo
            </button>
          )}
        </form>
      </fieldset>

      <fieldset>
        <legend>Shto Nxenes</legend>
        <form onSubmit={handleStudentSubmit}>
          <p>
            <label htmlFor="emriNxenesit">Emri i nxenesit</label>
            <br />
            <input
              id="emriNxenesit"
              name="emriNxenesit"
              type="text"
              value={studentForm.emriNxenesit}
              onChange={handleStudentChange}
              required
            />
          </p>

          <p>
            <label htmlFor="klasa">Klasa</label>
            <br />
            <input
              id="klasa"
              name="klasa"
              type="text"
              value={studentForm.klasa}
              onChange={handleStudentChange}
              required
            />
          </p>

          <p>
            <label htmlFor="studentSchoolId">Shkolla</label>
            <br />
            <select
              id="studentSchoolId"
              name="schoolId"
              value={studentForm.schoolId}
              onChange={handleStudentChange}
              required
            >
              <option value="">Zgjidh shkollen</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.emriShkolles} - {school.qyteti}
                </option>
              ))}
            </select>
          </p>

          <button type="submit" disabled={isSavingStudent || schools.length === 0}>
            Shto nxenes
          </button>
        </form>
      </fieldset>

      <hr />

      <h2>Lista e Shkollave</h2>
      <button type="button" onClick={loadWorkData}>
        Rifresko
      </button>

      {isLoading ? (
        <p>Duke ngarkuar shkollat...</p>
      ) : schools.length === 0 ? (
        <p>Nuk ka ende shkolla te regjistruara.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>EmriShkolles</th>
              <th>Qyteti</th>
              <th>Nxenes</th>
              <th>Veprime</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((school) => (
              <tr key={school.id}>
                <td>{school.id}</td>
                <td>{school.emriShkolles}</td>
                <td>{school.qyteti}</td>
                <td>{school.nxenesitCount}</td>
                <td>
                  <button type="button" onClick={() => startEditingSchool(school)}>
                    Edito
                  </button>
                  <button type="button" onClick={() => handleDeleteSchool(school)}>
                    Fshi
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Lista e Nxenesve</h2>
      <p>
        {selectedFilterSchool
          ? `Filtruar sipas: ${selectedFilterSchool.emriShkolles}`
          : 'Te gjithe nxenesit'}
      </p>

      <p>
        <label htmlFor="filterSchoolId">Filtro sipas shkolles</label>
        <br />
        <select
          id="filterSchoolId"
          value={filterSchoolId}
          onChange={(event) => setFilterSchoolId(event.target.value)}
        >
          <option value="">Te gjitha shkollat</option>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.emriShkolles}
            </option>
          ))}
        </select>
      </p>

      {isLoading ? (
        <p>Duke ngarkuar nxenesit...</p>
      ) : students.length === 0 ? (
        <p>Nuk ka nxenes per kete zgjedhje.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>EmriNxenesit</th>
              <th>Klasa</th>
              <th>Shkolla</th>
              <th>Qyteti</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.id}</td>
                <td>{student.emriNxenesit}</td>
                <td>{student.klasa}</td>
                <td>{student.shkolla?.emriShkolles || 'Pa shkolle'}</td>
                <td>{student.shkolla?.qyteti || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default WorkPage;
