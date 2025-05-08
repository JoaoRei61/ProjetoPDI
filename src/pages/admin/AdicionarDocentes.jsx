import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import 'bootstrap/dist/css/bootstrap.min.css';
import supabase from '../../helper/supabaseconfig';
import { enviarEmailCredenciais } from '../../helper/emailservice';

const AdicionarDocente = () => {
    const [message, setMessage] = useState("");
    const [utilizadores, setUtilizadores] = useState([]);
    const [disciplinas, setDisciplinas] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [docenteDisciplinas, setDocenteDisciplinas] = useState([]);
    const [search, setSearch] = useState("");

    const fetchAllData = async () => {
        const [{ data: utilizadoresData }, { data: disciplinasData }, { data: cursosData }, { data: ligacoes }] = await Promise.all([
            supabase.from("utilizadores").select("*"),
            supabase.from("disciplinas").select(),
            supabase.from("curso").select(),
            supabase.from("docente_disciplina").select()
        ]);

        setUtilizadores(utilizadoresData || []);
        setDisciplinas(disciplinasData || []);
        setCursos(cursosData || []);
        setDocenteDisciplinas(ligacoes || []);
    };

    useEffect(() => {
        fetchAllData();
        const subscription = supabase
            .channel("docente_disciplina")
            .on("postgres_changes", { event: "*", schema: "public", table: "docente_disciplina" }, fetchAllData)
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const initialValues = {
        primeiroNome: '',
        ultimoNome: '',
        email: '',
        ucsSelecionadas: [],
    };

    const validationSchema = Yup.object({
        primeiroNome: Yup.string().required('Campo obrigatório'),
        ultimoNome: Yup.string().required('Campo obrigatório'),
        email: Yup.string().email('Email inválido').required('Campo obrigatório'),
        ucsSelecionadas: Yup.array().min(1, 'Selecione pelo menos uma unidade curricular'),
    });

    const gerarSenhaAleatoria = () => Math.random().toString(36).slice(-8);
    const gerarNomeUtilizador = (primeiroNome, ultimoNome) => primeiroNome.toLowerCase().charAt(0) + ultimoNome.toLowerCase();

    const handleFormSubmit = async (values, { resetForm }) => {
        setMessage("");
        const senhaAleatoria = gerarSenhaAleatoria();
        const nomeUtilizador = gerarNomeUtilizador(values.primeiroNome, values.ultimoNome);

        // Guardar a sessão do admin
        const sessaoAdmin = await supabase.auth.getSession();

        // Criar conta do docente
        const { data, error } = await supabase.auth.signUp({
            email: values.email,
            password: senhaAleatoria
        });

        if (error || !data?.user) {
            setMessage("Erro ao criar conta: " + (error?.message || "sem utilizador"));
            return;
        }

        const { error: dbError } = await supabase.from("utilizadores").insert([{
            id: data.user.id,
            username: nomeUtilizador,
            email: values.email,
            tipo_conta: "docente",
            nome: values.primeiroNome,
            apelido: values.ultimoNome
        }]);

        if (dbError) {
            setMessage("Erro ao salvar na base de dados: " + dbError.message);
            return;
        }

        const ligacoes = values.ucsSelecionadas.map((iddisciplina) => ({
            iddocente: data.user.id,
            iddisciplina: parseInt(iddisciplina)
        }));

        const { error: ligacaoErro } = await supabase.from("docente_disciplina").insert(ligacoes);
        if (ligacaoErro) {
            setMessage("Erro ao associar disciplinas: " + ligacaoErro.message);
            return;
        }

        // Restaurar a sessão do admin
        if (sessaoAdmin.data?.session) {
            await supabase.auth.setSession(sessaoAdmin.data.session);
        }

        await enviarEmailCredenciais(values.email, senhaAleatoria);
        setMessage("✅ Docente adicionado com sucesso! As credenciais foram enviadas para o email.");
        resetForm();
        setSearch("");
        fetchAllData();
    };

    const obterNomeCurso = (idcurso) => cursos.find(c => c.idcurso === idcurso)?.nome || "—";
    const obterNomeDisciplinasPorDocente = (iddocente) => {
        const ids = docenteDisciplinas.filter(d => d.iddocente === iddocente).map(d => d.iddisciplina);
        return disciplinas.filter(d => ids.includes(d.iddisciplina)).map(d => d.nome).join(", ");
    };

    return (
        <div className="container mt-4">
            <h2 className="text-dark">Adicionar Docente</h2>
            {message && <div className="alert alert-info">{message}</div>}

            <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleFormSubmit}>
                {({ values, setFieldValue }) => (
                    <Form>
                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label className="form-label">Primeiro Nome</label>
                                <Field name="primeiroNome" className="form-control" placeholder="Primeiro Nome" />
                                <ErrorMessage name="primeiroNome" component="div" className="text-danger" />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Último Nome</label>
                                <Field name="ultimoNome" className="form-control" placeholder="Último Nome" />
                                <ErrorMessage name="ultimoNome" component="div" className="text-danger" />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Email</label>
                            <Field name="email" type="email" className="form-control" placeholder="Email" />
                            <ErrorMessage name="email" component="div" className="text-danger" />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Unidades Curriculares</label>
                            <input
                                type="text"
                                className="form-control mb-2"
                                placeholder="Pesquisar unidade curricular..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <div className="d-flex flex-wrap gap-2 mb-2">
                                {values.ucsSelecionadas.map(id => {
                                    const uc = disciplinas.find(d => d.iddisciplina.toString() === id);
                                    return (
                                        <span key={id} className="badge bg-primary">
                                            {uc?.nome}
                                            <button type="button" className="btn-close btn-close-white ms-2" onClick={() => {
                                                const atualizadas = values.ucsSelecionadas.filter(i => i !== id);
                                                setFieldValue("ucsSelecionadas", atualizadas);
                                            }}></button>
                                        </span>
                                    );
                                })}
                            </div>
                            {search.trim() && (
                                <div className="list-group">
                                    {disciplinas
                                        .filter(uc => uc.nome.toLowerCase().includes(search.toLowerCase()) && !values.ucsSelecionadas.includes(uc.iddisciplina.toString()))
                                        .slice(0, 5)
                                        .map(uc => (
                                            <button
                                                key={uc.iddisciplina}
                                                type="button"
                                                className="list-group-item list-group-item-action"
                                                onClick={() => {
                                                    setFieldValue("ucsSelecionadas", [...values.ucsSelecionadas, uc.iddisciplina.toString()]);
                                                    setSearch("");
                                                }}
                                            >
                                                {uc.nome}
                                            </button>
                                        ))}
                                </div>
                            )}
                            <ErrorMessage name="ucsSelecionadas" component="div" className="text-danger" />
                        </div>

                        <button type="submit" className="btn btn-success">Adicionar Docente</button>
                    </Form>
                )}
            </Formik>

            <div className="mt-4">
                <h4>Lista de Utilizadores</h4>
                <table className="table table-bordered">
                    <thead className="table-dark">
                        <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Tipo de Utilizador</th>
                            <th>Curso (Alunos)</th>
                            <th>Unidade Curricular (Docentes)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {utilizadores.map((user) => (
                            <tr key={user.id}>
                                <td>{user.username}</td>
                                <td>{user.email}</td>
                                <td>{user.tipo_conta}</td>
                                <td>{user.tipo_conta === "aluno" ? obterNomeCurso(user.idcurso) : "—"}</td>
                                <td>{user.tipo_conta === "docente" ? obterNomeDisciplinasPorDocente(user.id) : "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdicionarDocente;
