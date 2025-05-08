import React, { useState, useEffect } from "react";
import {
  Form, Tab, Nav, Card, ProgressBar, Badge, Spinner
} from "react-bootstrap";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList } from "recharts";
import supabase from "../../helper/supabaseconfig"; // ajusta o caminho se necessário

const unidadesCurriculares = {
  "Matemática": [
    { materia: "Álgebra", pontuacao: 15 },
    { materia: "Trigonometria", pontuacao: 90 },
    { materia: "Geometria Analítica", pontuacao: 50 },
    { materia: "Cálculo Diferencial", pontuacao: 25 },
    { materia: "Cálculo Integral", pontuacao: 18 },
    { materia: "Probabilidades", pontuacao: 7 },
  ],
  "Programação": [
    { materia: "Algoritmos", pontuacao: 85 },
    { materia: "Estruturas de Dados", pontuacao: 70 },
    { materia: "POO", pontuacao: 65 },
    { materia: "React", pontuacao: 90 },
    { materia: "Node.js", pontuacao: 50 },
    { materia: "Testes", pontuacao: 60 },
  ]
};

const Perfil = () => {
  const ucs = Object.keys(unidadesCurriculares);
  const [ucSelecionada, setUcSelecionada] = useState(ucs[0]);
  const [tipoAvaliacao, setTipoAvaliacao] = useState("exame");
  const [materiasSelecionadas, setMateriasSelecionadas] = useState([]);
  const [nome, setNome] = useState("");
  const [apelido, setApelido] = useState("");
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoURL, setFotoURL] = useState("");
  const [passAtual, setPassAtual] = useState("");
  const [novaPass, setNovaPass] = useState("");
  const [confNovaPass, setConfNovaPass] = useState("");
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const dadosMaterias = unidadesCurriculares[ucSelecionada];

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data, error } = await supabase
          .from("utilizadores")
          .select("nome, apelido, foto")
          .eq("id", user.id)
          .single();

        if (data) {
          setNome(data.nome || "");
          setApelido(data.apelido || "");
          setFotoURL(data.foto || "");
        }

        if (error) {
          setErro("Erro ao carregar perfil");
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const handleSelecionarMaterias = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setMateriasSelecionadas([...materiasSelecionadas, value]);
    } else {
      setMateriasSelecionadas(materiasSelecionadas.filter((mat) => mat !== value));
    }
  };

  const materiasParaCalculo = tipoAvaliacao === "exame"
    ? dadosMaterias
    : dadosMaterias.filter((mat) => materiasSelecionadas.includes(mat.materia));

  const mediaUC = materiasParaCalculo.length > 0
    ? Math.round(materiasParaCalculo.reduce((acc, mat) => acc + mat.pontuacao, 0) / materiasParaCalculo.length)
    : 0;

  const estaApto = mediaUC >= 70;

  const handleGuardar = async (e) => {
    e.preventDefault();

    // Atualizar nome e apelido
    const updates = {
      nome,
      apelido
    };

    // Upload da imagem
    if (fotoFile) {
      const { data, error } = await supabase
        .storage
        .from("imagens") // nome do bucket
        .upload(`fotos/${userId}.jpg`, fotoFile, { upsert: true });

      if (!error) {
        const { data: urlData } = supabase
          .storage
          .from("imagens")
          .getPublicUrl(`fotos/${userId}.jpg`);
        updates.foto = urlData.publicUrl;
        setFotoURL(urlData.publicUrl);
      }
    }

    // Atualizar utilizador
    await supabase
      .from("utilizadores")
      .update(updates)
      .eq("id", userId);

    // Alterar palavra-passe se aplicável
    if (novaPass && novaPass === confNovaPass) {
      const { error: passError } = await supabase.auth.updateUser({
        password: novaPass
      });
      if (passError) alert("Erro ao atualizar a palavra-passe");
    }
  };

  return (
    <div className="container py-4">
      <h1 className="text-center mt-3 display-5 fw-bold" style={{ color: '#0056b3' }}>
        <span className="text-danger">Perfil do Aluno</span>
      </h1>

      <div className="d-flex flex-column align-items-center gap-3 mb-4">
        <img
          src={fotoURL || "/imagens/logo.png"}
          alt="avatar"
          width={100}
          height={100}
          style={{ borderRadius: "50%", objectFit: "cover", border: "3px solid #2d6baa" }}
        />
        <h4 className="fw-bold">{nome} {apelido}</h4>
      </div>

      <Tab.Container defaultActiveKey="progresso">
        <Nav variant="tabs" className="justify-content-center mb-4">
          <Nav.Item>
            <Nav.Link eventKey="progresso">Progresso</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="config">Configurações</Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="progresso">
            <div className="row justify-content-center mb-4">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-primary">Seleciona a Unidade Curricular</Form.Label>
                  <Form.Select
                    value={ucSelecionada}
                    onChange={(e) => setUcSelecionada(e.target.value)}
                  >
                    {ucs.map((uc, i) => (
                      <option key={i} value={uc}>{uc}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold text-primary">Tipo de Avaliação</Form.Label>
                  <Form.Select value={tipoAvaliacao} onChange={(e) => setTipoAvaliacao(e.target.value)}>
                    <option value="exame">Exame (todas as matérias)</option>
                    <option value="teste">Teste (matérias selecionadas)</option>
                  </Form.Select>
                </Form.Group>

                {tipoAvaliacao === 'teste' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Seleciona as matérias incluídas no teste:</Form.Label>
                    <div className="border rounded p-2">
                      {dadosMaterias.map((mat, idx) => (
                        <Form.Check
                          key={idx}
                          type="checkbox"
                          id={`${mat.materia}-${idx}`}
                          label={mat.materia}
                          value={mat.materia}
                          checked={materiasSelecionadas.includes(mat.materia)}
                          onChange={handleSelecionarMaterias}
                        />
                      ))}
                    </div>
                  </Form.Group>
                )}
              </div>
            </div>

            {/* Progresso e gráficos */}
            <div className="row mb-4">
              <div className="col-md-4">
                <Card className="text-center p-4 shadow-sm h-100 bg-light border-primary">
                  <h5 className="text-primary">Nível de Preparação para o {tipoAvaliacao === 'exame' ? 'Exame' : 'Teste'}</h5>
                  <h1 className="display-1 fw-bold text-danger">{mediaUC}%</h1>
                  <p className="text-muted small">
                    {materiasParaCalculo.length === 0 && tipoAvaliacao === 'teste'
                      ? "Seleciona pelo menos uma matéria para calcular o progresso."
                      : "Baseado na média das matérias selecionadas."}
                  </p>
                  <Badge bg={estaApto ? "success" : "danger"} className="fs-6 mt-2">
                    {estaApto ? "✅ Apto para Testes" : "❌ Não Apto para Testes"}
                  </Badge>
                </Card>
              </div>
            </div>
          </Tab.Pane>

          <Tab.Pane eventKey="config">
            {/* Configurações de perfil */}
            <div className="bg-white p-4 rounded shadow-sm border">
              <h4 className="text-primary mb-4 fw-bold">Configurações de Perfil</h4>
              <Form onSubmit={handleGuardar}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <Form.Label>Nome Próprio</Form.Label>
                    <Form.Control type="text" value={nome} onChange={(e) => setNome(e.target.value)} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <Form.Label>Apelido</Form.Label>
                    <Form.Control type="text" value={apelido} onChange={(e) => setApelido(e.target.value)} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <Form.Label>Username</Form.Label>
                    <Form.Control type="text" value="joaomartins123" readOnly disabled />
                  </div>
                  <div className="col-md-6 mb-3">
                    <Form.Label>Foto de Perfil</Form.Label>
                    <Form.Control type="file" accept="image/*" onChange={(e) => setFotoFile(e.target.files[0])} />
                  </div>
                </div>

                <hr className="my-4" />

                {/* Alterar palavra-passe */}
                <h5 className="text-danger fw-bold mb-3">Alterar Palavra-passe</h5>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <Form.Label>Palavra-passe Atual</Form.Label>
                    <Form.Control type="password" value={passAtual} onChange={(e) => setPassAtual(e.target.value)} />
                  </div>
                  <div className="col-md-4 mb-3">
                    <Form.Label>Nova Palavra-passe</Form.Label>
                    <Form.Control type="password" value={novaPass} onChange={(e) => setNovaPass(e.target.value)} />
                  </div>
                  <div className="col-md-4 mb-3">
                    <Form.Label>Confirmar Nova Palavra-passe</Form.Label>
                    <Form.Control type="password" value={confNovaPass} onChange={(e) => setConfNovaPass(e.target.value)} />
                  </div>
                </div>

                <div className="text-end mt-4">
                  <button type="submit" className="btn btn-primary px-4">Guardar Alterações</button>
                </div>
              </Form>
            </div>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </div>
  );
};

export default Perfil;
