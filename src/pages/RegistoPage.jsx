import { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import supabase from '../helper/supabaseconfig';
import 'bootstrap/dist/css/bootstrap.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function RegistoPage() {
  const [nome, setNome] = useState("");
  const [apelido, setApelido] = useState("");
  const [telemovel, setTelemovel] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCurso, setSelectedCurso] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [listaCursos, setListaCursos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCursos = async () => {
      const { data, error } = await supabase.from("curso").select();
      if (!error) setListaCursos(data || []);
    };
    fetchCursos();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!aceitouTermos) {
      toast.warn("Tens de aceitar os termos e condições para criar uma conta.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password
    });

    if (error || !data?.user) {
      toast.error(error?.message || "Erro ao criar a conta.");
      return;
    }

    const { error: dbError } = await supabase.from("utilizadores").insert([{
      id: data.user.id,
      username,
      nome,
      apelido,
      telefone: telemovel || null,
      email,
      idcurso: selectedCurso,
      tipo_conta: "aluno"
    }]);

    if (dbError) {
      toast.error(dbError.message);
      return;
    }

    toast.success("Conta criada com sucesso!");
    setTimeout(() => navigate("/login"), 2000);
  };

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <div className="container d-flex justify-content-between align-items-center" style={{ maxWidth: '1400px' }}>

        {/* LADO ESQUERDO: LOGO + TEXTO */}
        <div className="d-flex flex-column align-items-start justify-content-center" style={{ flex: 1 }}>
          <img
            src="/imagens/logo.png"
            alt="Logo"
            className="img-fluid mb-3"
            style={{ maxHeight: '200px' }}
          />
          <h1 className="mb-3 display-6 fw-bold text-start" style={{ color: '#0056b3' }}>
            Bem-vindo ao <span className="text-danger">ISCAcademy</span>
          </h1>
          <p className="lead text-dark small text-start">
            A tua plataforma que transforma o teu estudo numa experiência mais eficaz e divertida!
          </p>
        </div>

        {/* CAIXA DE REGISTO */}
        <div className="d-flex justify-content-center" style={{ flex: 1.5 }}>
          <div className="p-4 bg-white shadow-lg rounded w-100" style={{ maxWidth: '650px' }}>
            <h2 className="text-center mb-4" style={{ color: '#0056b3' }}>Criar Conta</h2>

            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Nome</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nome próprio"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Apelido</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Apelido"
                    value={apelido}
                    onChange={(e) => setApelido(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Telemóvel (opcional)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="form-control"
                  placeholder="Nº de Telemóvel"
                  value={telemovel}
                  onChange={(e) => {
                    const apenasNumeros = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setTelemovel(apenasNumeros);
                  }}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nome de Utilizador"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Senha</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Curso</label>
                <select
                  className="form-select"
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

              <div className="mb-3 form-check text-start">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="termosCondicoes"
                  checked={aceitouTermos}
                  onChange={(e) => setAceitouTermos(e.target.checked)}
                  required
                />
                <label className="form-check-label" htmlFor="termosCondicoes">
                  Aceito os <span className="text-danger fw-bold">termos e condições</span> do ISCAcademy. Sou o único responsável por qualquer conteúdo que venha a partilhar, incluindo ficheiros, resumos ou textos.
                </label>
              </div>

              <button type="submit" className="btn w-100" style={{ backgroundColor: '#0056b3', color: '#fff' }}>
                Criar Conta
              </button>
            </form>

            <div className="mt-3 text-center">
              <p className="lead">Já tem uma conta?</p>
              <Link to="/login" className="form-label text-danger">Faça login aqui</Link>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default RegistoPage;
