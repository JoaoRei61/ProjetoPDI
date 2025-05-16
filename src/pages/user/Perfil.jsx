import React, { useState, useEffect } from "react";
import {
  Form, Tab, Nav, Card, Badge, Spinner
} from "react-bootstrap";
import supabase from "../../helper/supabaseconfig";
import { Radar, Bar } from "react-chartjs-2";
import { Chart, RadialLinearScale, BarElement, CategoryScale, LinearScale, Tooltip, Legend, PointElement, LineElement, Filler } from 'chart.js';

Chart.register(
  RadialLinearScale,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
);

const Perfil = () => {
  const [ucs, setUcs] = useState([]);
  const [resultados, setResultados] = useState({});
  const [ucSelecionada, setUcSelecionada] = useState("");
  const [loading, setLoading] = useState(true);
  const [sugestoes, setSugestoes] = useState([]);
  const [nome, setNome] = useState("");
  const [apelido, setApelido] = useState("");
  const [username, setUsername] = useState("");
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoURL, setFotoURL] = useState("");
  const [novaPass, setNovaPass] = useState("");
  const [confNovaPass, setConfNovaPass] = useState("");
  const [userId, setUserId] = useState(null);

  const [modoAnalise, setModoAnalise] = useState("exame"); // "exame" ou "teste"
  const [materiasSelecionadas, setMateriasSelecionadas] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUsername(user.user_metadata?.username || user.email);

        const { data: utilizadorData } = await supabase
          .from("utilizadores")
          .select("nome, apelido, foto")
          .eq("id", user.id)
          .single();

        if (utilizadorData) {
          setNome(utilizadorData.nome || "");
          setApelido(utilizadorData.apelido || "");
          setFotoURL(utilizadorData.foto || "");
        }

        const { data: progresso } = await supabase
          .from("resolucao")
          .select(`
            idmateria,
            correta,
            materia (
              nome,
              iddisciplina,
              disciplinas (
                nome
              )
            )
          `)
          .eq("idutilizador", user.id);

        const tempResultados = {};
        const ucsSet = new Set();

        progresso.forEach((item) => {
          const ucNome = item.materia.disciplinas?.nome;
          const materiaNome = item.materia.nome;
          const correta = item.correta;

          if (!ucNome) return;

          if (!tempResultados[ucNome]) tempResultados[ucNome] = {};
          if (!tempResultados[ucNome][materiaNome]) {
            tempResultados[ucNome][materiaNome] = { acertos: 0, total: 0 };
          }

          tempResultados[ucNome][materiaNome].total += 1;
          if (correta) tempResultados[ucNome][materiaNome].acertos += 1;

          ucsSet.add(ucNome);
        });

        const ucsArray = Array.from(ucsSet);
        setResultados(tempResultados);
        setUcs(ucsArray);
        if (ucsArray.length > 0) setUcSelecionada(ucsArray[0]);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!resultados[ucSelecionada]) {
      setSugestoes([]);
      return;
    }
    const dadosParaSugestoes = Object.entries(resultados[ucSelecionada]).map(([materia, { acertos, total }]) => ({
      materia,
      media: total > 0 ? Math.round((acertos / total) * 100) : 0
    }));

    const novasSugestoes = dadosParaSugestoes.map(({ materia, media }) => {
      if (media >= 80) return `Excelente desempenho em ${materia}, continua assim! 💪`;
      if (media >= 50) return `Bom progresso em ${materia}, mas ainda há margem para melhorar.`;
      return `Recomenda-se revisão em ${materia}, precisas reforçar! 📚`;
    });

    setSugestoes(novasSugestoes);
  }, [resultados, ucSelecionada]);

  const prepararDadosGraficos = () => {
    if (!resultados[ucSelecionada]) return { materiasData: [], medias: [] };
    const dados = Object.entries(resultados[ucSelecionada]).map(([materia, { acertos, total }]) => ({
      materia,
      media: total > 0 ? Math.round((acertos / total) * 100) : 0
    }));

    return {
      materiasData: dados.map((d) => d.materia),
      medias: dados.map((d) => d.media)
    };
  };

  const calcularMediaSelecionada = () => {
    let total = 0;
    let soma = 0;

    if (modoAnalise === "exame") {
      const materias = resultados[ucSelecionada] || {};
      Object.values(materias).forEach(({ acertos, total: t }) => {
        if (t > 0) {
          soma += (acertos / t) * 100;
          total++;
        }
      });
    } else if (modoAnalise === "teste") {
      const materias = resultados[ucSelecionada] || {};
      materiasSelecionadas.forEach((mat) => {
        if (materias[mat]) {
          const { acertos, total: t } = materias[mat];
          if (t > 0) {
            soma += (acertos / t) * 100;
            total++;
          }
        }
      });
    }

    return total > 0 ? Math.round(soma / total) : null;
  };

  const { materiasData, medias } = prepararDadosGraficos();

  const radarData = {
    labels: materiasData,
    datasets: [{
      label: 'Aptidão (%)',
      data: medias,
      fill: true,
      borderColor: '#0056b3',
      backgroundColor: 'rgba(0, 86, 179, 0.2)',
      pointBackgroundColor: '#0056b3'
    }]
  };

  const barData = {
    labels: materiasData,
    datasets: [{
      label: 'Percentagem de Sucesso',
      data: medias,
      backgroundColor: 'rgba(220,53,69,0.6)',
      borderColor: 'rgba(220,53,69,1)',
      borderWidth: 1
    }]
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    const updates = { nome, apelido };
    if (fotoFile) {
      const { error } = await supabase
        .storage
        .from("imagens")
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
    await supabase.from("utilizadores").update(updates).eq("id", userId);
    if (novaPass && novaPass === confNovaPass) {
      const { error: passError } = await supabase.auth.updateUser({ password: novaPass });
      if (passError) alert("Erro ao atualizar a palavra-passe");
    }
  };

  if (loading) {
    return <div className="text-center my-5"><Spinner animation="border" variant="primary" /></div>;
  }

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
              </div>
            </div>

            {materiasData.length === 0 ? (
              <p className="text-center text-muted">Ainda não há progresso registado nesta UC.</p>
            ) : (
              <>
                {/* SECÇÃO DE APTIDÃO — AGORA NO TOPO */}
                <div className="bg-white p-4 rounded shadow-sm mb-4">
                  <h5 className="fw-bold text-primary">Análise de Aptidão</h5>

                  <Form.Group className="mb-3">
                    <Form.Label>Modo de análise</Form.Label>
                    <Form.Select value={modoAnalise} onChange={(e) => setModoAnalise(e.target.value)}>
                      <option value="exame">Apto a Exame (todas as matérias)</option>
                      <option value="teste">Apto a Teste (matérias selecionadas)</option>
                    </Form.Select>
                  </Form.Group>

                  {modoAnalise === "teste" && (
                    <Form.Group className="mb-3">
                      <Form.Label>Seleciona as matérias</Form.Label>
                      <div className="d-flex flex-wrap gap-2">
                        {Object.keys(resultados[ucSelecionada] || {}).map((mat, idx) => (
                          <Form.Check
                            key={idx}
                            inline
                            label={mat}
                            type="checkbox"
                            id={`mat-${idx}`}
                            checked={materiasSelecionadas.includes(mat)}
                            onChange={(e) => {
                              setMateriasSelecionadas((prev) =>
                                e.target.checked
                                  ? [...prev, mat]
                                  : prev.filter((m) => m !== mat)
                              );
                            }}
                          />
                        ))}
                      </div>
                    </Form.Group>
                  )}

                  <div className="mt-3">
                    {(() => {
                      const media = calcularMediaSelecionada();
                      if (media === null) return <p className="text-muted">Seleciona matérias com progresso.</p>;

                      return (
                        <Card className="shadow-sm p-3">
                          <h6>Média de desempenho: <strong>{media}%</strong></h6>
                          <Badge bg={media >= 50 ? "success" : "danger"}>
                            {media >= 70 ? "Apto ✅" : "Não Apto ❌"}
                          </Badge>
                        </Card>
                      );
                    })()}
                  </div>
                </div>

                {/* GRÁFICOS */}
                <div className="row">
                  <div className="col-md-6 mb-4">
                    <Card className="p-3 shadow-sm h-100">
                      <h5 className="text-center text-primary">Radar - Aptidão por Matéria</h5>
                      <Radar data={radarData} />
                    </Card>
                  </div>
                  <div className="col-md-6 mb-4">
                    <Card className="p-3 shadow-sm h-100">
                      <h5 className="text-center text-primary">Gráfico de Barras - Percentagens</h5>
                      <Bar data={barData} options={{ scales: { y: { beginAtZero: true, max: 100 } } }} />
                    </Card>
                  </div>
                </div>

                {/* SUGESTÕES */}
                <div className="mt-4">
                  <h5 className="fw-bold text-primary">Sugestões Personalizadas</h5>
                  <ul>
                    {sugestoes.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </Tab.Pane>

          <Tab.Pane eventKey="config">
            {/* Configurações */}
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
                    <Form.Control type="text" value={username} readOnly disabled />
                  </div>
                  <div className="col-md-6 mb-3">
                    <Form.Label>Foto de Perfil</Form.Label>
                    <Form.Control type="file" accept="image/*" onChange={(e) => setFotoFile(e.target.files[0])} />
                  </div>
                </div>

                <hr className="my-4" />

                <h5 className="text-danger fw-bold mb-3">Alterar Palavra-passe</h5>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <Form.Label>Nova Palavra-passe</Form.Label>
                    <Form.Control type="password" value={novaPass} onChange={(e) => setNovaPass(e.target.value)} />
                  </div>
                  <div className="col-md-6 mb-3">
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
