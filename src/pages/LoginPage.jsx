import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../helper/supabaseconfig';
import 'bootstrap/dist/css/bootstrap.css';

function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [showMessage, setShowMessage] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");

        // Tentar autenticar no Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            setMessage("Erro: " + error.message);
            return;
        }

        // Se o login for bem-sucedido, redireciona para a página inicial
        navigate("/");
    };

    return (
        <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
                <div className="row w-100 align-items-center text-center">
                    {/* Lado Esquerdo - Texto e Imagem */}
                    <div className="col-md-6 d-flex flex-column align-items-center justify-content-center">
                        <img 
                            src="/imagens/logochat.png" 
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
                    {/* Lado Direito - Formulário de Login */}
                    <div className="col-md-6 d-flex justify-content-center">
                        <div className="p-4 bg-white shadow-lg rounded" style={{ maxWidth: '400px', width: '100%' }}>
                            <h2 className="text-center mb-4" style={{ color: '#0056b3' }}>Login</h2>

                            {/* Mensagem de erro */}
                            {message && <div className="alert alert-danger">{message}</div>}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="lead form-label">Email</label>
                                    <input 
                                        type="email" 
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
                                        className="form-control" 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        required 
                                    />
                                </div>
                                <button type="submit" className="lead btn w-100" style={{ backgroundColor: '#0056b3', color: '#fff' }}>
                                    Entrar
                                </button>
                            </form>

                            <div className="lead text-center mt-3">
                                <a href="#" style={{ color: '#0056b3' }} onClick={() => setShowMessage(true)}>
                                    Esqueceu sua senha?
                                </a>
                                {showMessage && (
                                    <div className="mt-2 text-danger">
                                        Por favor, contacte o apoio técnico da instituição.
                                    </div>
                                )}
                            </div>

                            <div className="mb-3 text-center mt-3">
                                <Link to="/registo" className="lead form-label text-danger">Criar Conta</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
