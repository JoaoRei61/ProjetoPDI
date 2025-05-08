import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import 'bootstrap/dist/css/bootstrap.min.css';
import supabase from '../../helper/supabaseconfig';

const AdicionarUnidadesCurriculares = () => {
    const [unidades, setUnidades] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [cursosSelecionados, setCursosSelecionados] = useState({});

    const initialValues = {
        nomeUnidade: '',
        codigoUC: '',
    };

    const validationSchema = Yup.object({
        nomeUnidade: Yup.string().required('Campo obrigatório'),
        codigoUC: Yup.string().required('Campo obrigatório'),
    });

    const fetchCursos = async () => {
        const { data, error } = await supabase.from('curso').select();
        if (!error) setCursos(data);
    };

    const fetchUnidades = async () => {
        const { data: disciplinas, error: erroDisciplinas } = await supabase.from('disciplinas').select();
        if (erroDisciplinas) {
            console.error("Erro ao buscar disciplinas:", erroDisciplinas.message);
            return;
        }

        const { data: ligacoes, error: erroLigacoes } = await supabase.from('curso_disciplina').select();
        if (erroLigacoes) {
            console.error("Erro ao buscar ligações curso-disciplina:", erroLigacoes.message);
            return;
        }

        const unidadesComCursos = disciplinas.map((disc) => {
            const cursosRelacionados = ligacoes
                .filter(cd => cd.iddisciplina === disc.iddisciplina)
                .map(cd => {
                    const curso = cursos.find(c => c.idcurso === cd.idcurso);
                    return curso ? { ...curso, ano: cd.ano, semestre: cd.semestre } : null;
                })
                .filter(Boolean);
            return { ...disc, cursos: cursosRelacionados };
        });

        setUnidades(unidadesComCursos);
    };

    useEffect(() => {
        fetchCursos();
    }, []);

    useEffect(() => {
        if (cursos.length > 0) {
            fetchUnidades();
        }
    }, [cursos]);

    const handleCursoToggle = (idcurso) => {
        setCursosSelecionados((prev) => {
            const novoEstado = { ...prev };
            if (novoEstado[idcurso]) {
                delete novoEstado[idcurso];
            } else {
                novoEstado[idcurso] = { ano: '', semestre: '' };
            }
            return novoEstado;
        });
    };

    const handleCursoChange = (idcurso, field, value) => {
        setCursosSelecionados((prev) => ({
            ...prev,
            [idcurso]: {
                ...prev[idcurso],
                [field]: value,
            },
        }));
    };

    const handleFormSubmit = async (values, { resetForm }) => {
        // Verificar duplicação de nome ou código
        const { data: ucExistente, error: erroBusca } = await supabase
            .from('disciplinas')
            .select()
            .or(`nome.eq.${values.nomeUnidade},codigo.eq.${values.codigoUC}`);

        if (erroBusca) {
            console.error("Erro ao verificar duplicação:", erroBusca.message);
            return;
        }

        if (ucExistente.length > 0) {
            alert("Já existe uma unidade curricular com este nome ou código.");
            return;
        }

        // Inserir nova UC
        const { data: novaDisciplina, error } = await supabase
            .from('disciplinas')
            .insert([{ nome: values.nomeUnidade, codigo: values.codigoUC }])
            .select()
            .single();

        if (error) {
            console.error('Erro ao adicionar disciplina:', error.message);
            return;
        }

        // Associar UC aos cursos
        const ligacoes = Object.entries(cursosSelecionados).map(([idcurso, info]) => ({
            idcurso: parseInt(idcurso),
            iddisciplina: novaDisciplina.iddisciplina,
            ano: parseInt(info.ano),
            semestre: parseInt(info.semestre),
        }));

        const { error: erroLigacoes } = await supabase.from('curso_disciplina').insert(ligacoes);
        if (erroLigacoes) console.error('Erro ao associar cursos:', erroLigacoes.message);

        fetchUnidades();
        resetForm();
        setCursosSelecionados({});
    };

    return (
        <div className="container mt-4">
            <h2 className="text-dark">Adicionar Unidade Curricular</h2>
            <p className="text-muted">Preencha os detalhes da unidade curricular</p>

            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleFormSubmit}
            >
                {({ touched, errors }) => (
                    <Form>
                        <div className="mb-3">
                            <label className="form-label">Nome da Unidade Curricular</label>
                            <Field
                                name="nomeUnidade"
                                className={`form-control ${touched.nomeUnidade && errors.nomeUnidade ? 'is-invalid' : ''}`}
                                placeholder="Nome da Unidade Curricular"
                            />
                            <ErrorMessage name="nomeUnidade" component="div" className="text-danger" />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Código da Unidade Curricular</label>
                            <Field
                                name="codigoUC"
                                className={`form-control ${touched.codigoUC && errors.codigoUC ? 'is-invalid' : ''}`}
                                placeholder="Ex: UC123"
                            />
                            <ErrorMessage name="codigoUC" component="div" className="text-danger" />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Cursos</label>
                            <div className="d-flex flex-column gap-2">
                                {cursos.map((curso) => (
                                    <div key={curso.idcurso} className="border p-2 rounded">
                                        <div className="form-check">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                id={`curso-${curso.idcurso}`}
                                                checked={!!cursosSelecionados[curso.idcurso]}
                                                onChange={() => handleCursoToggle(curso.idcurso)}
                                            />
                                            <label className="form-check-label" htmlFor={`curso-${curso.idcurso}`}>
                                                {curso.nome}
                                            </label>
                                        </div>

                                        {cursosSelecionados[curso.idcurso] && (
                                            <div className="row mt-2">
                                                <div className="col">
                                                    <label className="form-label">Ano</label>
                                                    <select
                                                        className="form-select"
                                                        value={cursosSelecionados[curso.idcurso].ano}
                                                        onChange={(e) => handleCursoChange(curso.idcurso, 'ano', e.target.value)}
                                                    >
                                                        <option value="">Selecione</option>
                                                        <option value="1">1º</option>
                                                        <option value="2">2º</option>
                                                        <option value="3">3º</option>
                                                    </select>
                                                </div>
                                                <div className="col">
                                                    <label className="form-label">Semestre</label>
                                                    <select
                                                        className="form-select"
                                                        value={cursosSelecionados[curso.idcurso].semestre}
                                                        onChange={(e) => handleCursoChange(curso.idcurso, 'semestre', e.target.value)}
                                                    >
                                                        <option value="">Selecione</option>
                                                        <option value="1">1º</option>
                                                        <option value="2">2º</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="btn btn-success">
                            Adicionar Unidade Curricular
                        </button>
                    </Form>
                )}
            </Formik>

            <div className="mt-4">
                <h4>Lista de Unidades Curriculares</h4>
                {unidades.length === 0 ? (
                    <p className="text-muted">Nenhuma unidade curricular adicionada.</p>
                ) : (
                    <table className="table table-bordered">
                        <thead className="table-dark">
                            <tr>
                                <th className="text-center">Unidade Curricular</th>
                                <th>Curso</th>
                                <th>Ano</th>
                                <th>Semestre</th>
                            </tr>
                        </thead>
                        <tbody>
                            {unidades.map((uc, index) => (
                                uc.cursos.map((curso, idx) => (
                                    <tr key={`${index}-${idx}`}>
                                        {idx === 0 && (
                                            <td rowSpan={uc.cursos.length} className="align-middle text-center fw-bold bg-light">{uc.nome}</td>
                                        )}
                                        <td>{curso.nome}</td>
                                        <td>{curso.ano}º</td>
                                        <td>{curso.semestre}º</td>
                                    </tr>
                                ))
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdicionarUnidadesCurriculares;
