import React, { useState, useEffect } from "react";
import { Container, Form, Button, Row, Col } from "react-bootstrap";
import { uploadImagemCloudinary } from "../../helper/uploadcloudinary";
import supabase from "../../helper/supabaseconfig";

const AdicionarExercicio = () => {
  const [disciplinas, setDisciplinas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState("");
  const [materia, setMateria] = useState("");
  const [tipoPergunta, setTipoPergunta] = useState("multipla");
  const [perguntaTexto, setPerguntaTexto] = useState("");
  const [ficheiroPergunta, setFicheiroPergunta] = useState(null);
  const [explicacaoTexto, setExplicacaoTexto] = useState("");
  const [ficheiroResolucao, setFicheiroResolucao] = useState(null);
  const [comentario, setComentario] = useState("");
  const [opcoes, setOpcoes] = useState([""]);
  const [opcaoCorreta, setOpcaoCorreta] = useState(null);

  useEffect(() => {
    const fetchDisciplinas = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      const { data: ligacoes, error } = await supabase
        .from("docente_disciplina")
        .select("iddisciplina")
        .eq("iddocente", userId);

      if (error || !ligacoes) return;

      const idsDisciplinas = ligacoes.map(l => l.iddisciplina);
      if (idsDisciplinas.length === 0) return setDisciplinas([]);

      const { data: disciplinasValidas } = await supabase
        .from("disciplinas")
        .select("iddisciplina, nome")
        .in("iddisciplina", idsDisciplinas);

      setDisciplinas(disciplinasValidas);
      if (disciplinasValidas.length === 1) {
        setDisciplinaSelecionada(disciplinasValidas[0].iddisciplina);
        fetchMaterias(disciplinasValidas[0].iddisciplina);
      }
    };

    fetchDisciplinas();
  }, []);

  const fetchMaterias = async (iddisciplina) => {
    const { data } = await supabase
      .from("materia")
      .select("idmateria, nome")
      .eq("iddisciplina", iddisciplina);
    setMaterias(data || []);
  };

  const handleAdicionarOpcao = () => setOpcoes([...opcoes, ""]);
  const handleRemoverOpcao = (index) => {
    const novas = [...opcoes];
    novas.splice(index, 1);
    setOpcoes(novas);
  };
  const handleChangeOpcao = (index, value) => {
    const novas = [...opcoes];
    novas[index] = value;
    setOpcoes(novas);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return alert("Utilizador não autenticado.");

      let idMateria;
      const { data: materiaExistente } = await supabase
        .from("materia")
        .select("idmateria")
        .eq("nome", materia.trim())
        .eq("iddisciplina", disciplinaSelecionada);

      if (materiaExistente?.length > 0) {
        idMateria = materiaExistente[0].idmateria;
      } else {
        const { data: nova } = await supabase
          .from("materia")
          .insert([{ nome: materia.trim(), iddisciplina: disciplinaSelecionada }])
          .select();
        idMateria = nova[0].idmateria;
      }

      const urlPergunta = ficheiroPergunta
        ? await uploadImagemCloudinary(ficheiroPergunta)
        : null;
      const urlResolucao = ficheiroResolucao
        ? await uploadImagemCloudinary(ficheiroResolucao)
        : null;

      const { data: perguntaInserida, error: erroPergunta } = await supabase
        .from("perguntas")
        .insert({
          texto: perguntaTexto || null,
          enunciado: urlPergunta || null,
          explicacao: explicacaoTexto || null,
          resolucao: urlResolucao || null,
          tipo_pergunta: tipoPergunta === "multipla" ? "EM" : "Desenvolvimento",
          comentario: comentario || null,
          idmateria: idMateria,
          idutilizador: userId,
        })
        .select()
        .single();

      if (erroPergunta) throw erroPergunta;

      if (tipoPergunta === "multipla") {
        const alternativas = opcoes.map((texto, i) => ({
          idpergunta: perguntaInserida.idpergunta,
          texto,
          correta: i === opcaoCorreta,
        }));
        await supabase.from("alternativas").insert(alternativas);
      }

      alert("Exercício adicionado com sucesso!");
      setPerguntaTexto("");
      setExplicacaoTexto("");
      setFicheiroPergunta(null);
      setFicheiroResolucao(null);
      setOpcoes([""]);
      setOpcaoCorreta(null);
      setMateria("");
      setTipoPergunta("multipla");
      setComentario("");

    } catch (err) {
      console.error("Erro ao adicionar exercício:", err);
      alert("Erro ao adicionar exercício.");
    }
  };

  return (
    <Container className="py-5">
      <h3 className="mb-4 text-primary fw-bold">Adicionar Novo Exercício</h3>
      <Form onSubmit={handleSubmit}>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Disciplina</Form.Label>
              <Form.Select
                value={disciplinaSelecionada}
                onChange={(e) => {
                  setDisciplinaSelecionada(e.target.value);
                  fetchMaterias(e.target.value);
                }}
                required
              >
                <option value="">Selecione a disciplina</option>
                {disciplinas.map((d) => (
                  <option key={d.iddisciplina} value={d.iddisciplina}>
                    {d.nome}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
                <Form.Label>Matéria</Form.Label>
                <Form.Control
                    type="text"
                    list="materia-options"
                    value={materia}
                    placeholder="Ex: Funções"
                    onChange={(e) => setMateria(e.target.value)}
                    required
                />
                <datalist id="materia-options">
                    {materias.map((m) => (
                    <option key={m.idmateria} value={m.nome} />
                    ))}
                </datalist>
            </Form.Group>   
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label>Tipo de Pergunta</Form.Label>
          <Form.Select
            value={tipoPergunta}
            onChange={(e) => setTipoPergunta(e.target.value)}
          >
            <option value="multipla">Escolha Múltipla</option>
            <option value="desenvolvimento">Desenvolvimento</option>
          </Form.Select>
        </Form.Group>

        <hr />

        <Form.Group className="mb-3">
          <Form.Label>Enunciado (texto)</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={perguntaTexto}
            onChange={(e) => setPerguntaTexto(e.target.value)}
            disabled={!!ficheiroPergunta}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Ou carregar ficheiro</Form.Label>
          <Form.Control
            type="file"
            onChange={(e) => setFicheiroPergunta(e.target.files[0])}
            disabled={!!perguntaTexto}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Explicação/Resolução (texto)</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={explicacaoTexto}
            onChange={(e) => setExplicacaoTexto(e.target.value)}
            disabled={!!ficheiroResolucao}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Ou carregar resolução (imagem)</Form.Label>
          <Form.Control
            type="file"
            onChange={(e) => setFicheiroResolucao(e.target.files[0])}
            disabled={!!explicacaoTexto}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Comentário do Docente</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="Ex: Esta pergunta é semelhante à do exame de 2022."
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />
        </Form.Group>

        {tipoPergunta === "multipla" && (
          <>
            <Form.Label>Opções de Resposta</Form.Label>
            {opcoes.map((opcao, index) => (
              <div key={index} className="d-flex align-items-center mb-2">
                <Form.Check
                  type="radio"
                  name="respostaCorreta"
                  checked={opcaoCorreta === index}
                  onChange={() => setOpcaoCorreta(index)}
                  className="me-2"
                />
                <Form.Control
                  type="text"
                  placeholder={`Opção ${index + 1}`}
                  value={opcao}
                  onChange={(e) => handleChangeOpcao(index, e.target.value)}
                />
                <Button
                  variant="outline-danger"
                  className="ms-2"
                  onClick={() => handleRemoverOpcao(index)}
                  disabled={opcoes.length <= 1}
                >
                  Remover
                </Button>
              </div>
            ))}
            <Button variant="outline-primary" onClick={handleAdicionarOpcao}>
              Adicionar Opção
            </Button>
          </>
        )}

        <div className="mt-4">
          <Button type="submit" variant="primary">
            Adicionar Exercício
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default AdicionarExercicio;
