import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import 'bootstrap/dist/css/bootstrap.min.css';
import supabase from '../../helper/supabaseconfig';

const AdicionarCursos = () => {
    const [cursos, setCursos] = useState([]);

    const initialValues = {
        nomeCurso: '',
    };

    const validationSchema = Yup.object({
        nomeCurso: Yup.string().required('Campo obrigatório'),
    });

    const fetchCursos = async () => {
        const { data, error } = await supabase.from('curso').select();
        if (!error) setCursos(data);
    };

    useEffect(() => {
        fetchCursos();
    }, []);

    const handleFormSubmit = async (values, { resetForm }) => {
        const { data, error } = await supabase
            .from('curso')
            .insert([{ nome: values.nomeCurso }])
            .select();

        if (!error) {
            setCursos([...cursos, ...data]);
            resetForm();
        } else {
            console.error('Erro ao adicionar curso:', error.message);
        }
    };

    return (
        <div className="container mt-4">
            <h2 className="text-dark">Adicionar Curso</h2>
            <p className="text-muted">Preencha os detalhes do curso</p>

            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleFormSubmit}
            >
                {({ touched, errors }) => (
                    <Form>
                        <div className="row mb-3">
                            <div className="col-md-12">
                                <label className="form-label">Nome do Curso</label>
                                <Field
                                    name="nomeCurso"
                                    className={`form-control ${touched.nomeCurso && errors.nomeCurso ? 'is-invalid' : ''}`}
                                    placeholder="Nome do Curso"
                                />
                                <ErrorMessage name="nomeCurso" component="div" className="text-danger" />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-success">
                            Adicionar Curso
                        </button>
                    </Form>
                )}
            </Formik>

            <div className="mt-4">
                <h4>Lista de Cursos</h4>
                {cursos.length === 0 ? (
                    <p className="text-muted">Nenhum curso adicionado.</p>
                ) : (
                    <table className="table table-bordered">
                        <thead className="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Nome do Curso</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cursos.map((curso) => (
                                <tr key={curso.idcurso}>
                                    <td>{curso.idcurso}</td>
                                    <td>{curso.nome}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdicionarCursos;
