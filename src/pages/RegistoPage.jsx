import { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import supabase from '../helper/supabaseconfig';
import 'bootstrap/dist/css/bootstrap.css';

function RegistoPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCurso, setSelectedCurso] = useState("");
  const [message, setMessage] = useState("");
  const [listaCursos, setListaCursos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCursos = async () => {
      const { data, error } = await supabase
        .from("curso")
        .select();

      if (error) {
        console.error("Erro ao buscar cursos:", error.message);
      } else {
        setListaCursos(data || []);
      }
    };
    fetchCursos();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    // 1. Criar utilizador na autenticação do Supabase
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    // Verificação de segurança: garantir que o utilizador foi criado e tem um ID
    if (!data || !data.user) {
      setMessage("Erro ao criar a conta: ID do utilizador não disponível.");
      return;
    }

    // 2. Inserir dados na tabela utilizadores, utilizando o ID do auth.users
    const { error: dbError } = await supabase.from("utilizadores").insert([{
      id: data.user.id, // Chave estrangeira para auth.users.id
      username: username,
      email: email,
      idcurso: selectedCurso,
      tipo_conta: "aluno"
    }]);

    if (dbError) {
      setMessage(dbError.message);
      return;
    }

    setMessage("Conta criada com sucesso!");
    setTimeout(() => navigate("/login"), 2000);
  };

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="row w-100 align-items-center text-center">

          <div className="col-md-6 d-flex flex-column align-items-center justify-content-center">
            <img
              src="/imagens/logo.png"
              alt="Logo"
              className="img-fluid mb-4"
              style={{ maxHeight: '350px' }}
            />
            <h1 className="mb-4 display-5 fw-bold" style={{ color: '#0056b3' }}>
              Bem-vindo ao <span className="text-danger">ISCAcademy</span>
            </h1>
            <p className="lead text-dark">
              A tua plataforma que transforma o teu estudo numa experiência mais eficaz e divertida!
            </p>
          </div>

          <div className="col-md-6 d-flex justify-content-center">
            <div className="p-4 bg-white shadow-lg rounded" style={{ maxWidth: '400px', width: '100%' }}>
              <h2 className="text-center mb-4" style={{ color: '#0056b3' }}>Criar Conta</h2>
              {message && <span className="alert alert-success">{message}</span>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="lead form-label">Username</label>
                  <input
                    type="text"
                    placeholder='Nome de Utilizador'
                    className="form-control"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="lead form-label">Email</label>
                  <input
                    type="email"
                    placeholder='Email'
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="lead form-label">Senha</label>
                  <input
                    type="password"
                    placeholder='Senha'
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="lead form-label">Curso</label>
                  <select
                    className="form-control"
                    value={selectedCurso}
                    onChange={(e) => setSelectedCurso(e.target.value)}
                    required
                  >
                    <option value="">Selecione um curso</option>
                    {listaCursos.map((curso) => (
                      <option key={curso.idcurso} value={curso.idcurso}>{curso.nome}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="lead btn w-100" style={{ backgroundColor: '#0056b3', color: '#fff' }}>
                  Criar Conta
                </button>
              </form>
              <div className="mt-3 text-center">
                <p className="lead">Já tem uma conta?</p>
                <Link to="/login" className="lead form-label text-danger">Faça login aqui</Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default RegistoPage;
