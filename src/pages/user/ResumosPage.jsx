import React, { useEffect, useState } from "react";
import supabase from "../../helper/supabaseconfig";
import "bootstrap-icons/font/bootstrap-icons.css";

const Resumos = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfResumoSelecionado, setPdfResumoSelecionado] = useState(null);
  const [ordenarPor, setOrdenarPor] = useState("");
  const [resumos, setResumos] = useState([]);

  // Formulário
  const [titulo, setTitulo] = useState("");
  const [file, setFile] = useState(null);
  const [disciplinas, setDisciplinas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [idDisciplina, setIdDisciplina] = useState("");
  const [idMateria, setIdMateria] = useState("");

  // Filtros
  const [unidadeCurricularFiltro, setUnidadeCurricularFiltro] = useState("");
  const [autorFiltro, setAutorFiltro] = useState("");

  // Buscar resumos da BD
  const fetchResumos = async () => {
    const { data, error } = await supabase
      .from("resumos")
      .select("*, utilizadores(username, tipo_conta), disciplinas(nome)")
      .eq("estado", "aprovado"); // <-- mostrar só aprovados
  
    if (!error) setResumos(data);
  };
  

  // Buscar disciplinas
  const fetchDisciplinas = async () => {
    const { data, error } = await supabase.from("disciplinas").select("*");
    if (!error) setDisciplinas(data);
  };

  // Buscar matérias da disciplina selecionada
  useEffect(() => {
    const fetchMaterias = async () => {
      if (!idDisciplina) return;
      const { data, error } = await supabase
        .from("materia")
        .select("*")
        .eq("iddisciplina", idDisciplina);
      if (!error) setMaterias(data);
    };
    fetchMaterias();
  }, [idDisciplina]);

  useEffect(() => {
    fetchResumos();
    fetchDisciplinas();
  }, []);

  const renderBadge = (tipo) => (
    <span className={`badge ${tipo === "aluno" ? "bg-primary" : "bg-danger"}`}>
      {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
    </span>
  );

  const abrirResumoPdf = (resumo) => {
    setPdfResumoSelecionado(resumo);
    setShowPdfModal(true);
  };

  const ordenarResumos = (lista) => {
    const novaLista = [...lista];
    switch (ordenarPor) {
      case "aluno":
        return novaLista.sort((a, b) => (a.utilizadores.tipo_conta === "aluno" ? -1 : 1));
      case "docente":
        return novaLista.sort((a, b) => (a.utilizadores.tipo_conta === "docente" ? -1 : 1));
      case "antigo":
        return novaLista.sort((a, b) => new Date(a.data_envio) - new Date(b.data_envio));
      case "recente":
        return novaLista.sort((a, b) => new Date(b.data_envio) - new Date(a.data_envio));
      default:
        return novaLista;
    }
  };

  const resumosFiltrados = resumos.filter((resumo) => {
    const unidadeMatch = resumo.disciplinas?.nome?.toLowerCase().includes(unidadeCurricularFiltro.toLowerCase());
    const autorMatch = resumo.utilizadores?.username?.toLowerCase().includes(autorFiltro.toLowerCase());
    return unidadeMatch && autorMatch;
  });

  const resumosOrdenados = ordenarResumos(resumosFiltrados);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !titulo || !idDisciplina || !idMateria) return;

    const user = await supabase.auth.getUser();
    const userId = user.data.user.id;

    const sanitizedName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-zA-Z0-9.\-_]/g, "_"); // substitui espaços e símbolos
    const filePath = `${Date.now()}_${sanitizedName}`;


    const { error: uploadError } = await supabase.storage
      .from("resumos")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Erro ao fazer upload:", uploadError.message);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("resumos")
      .getPublicUrl(filePath);

    const pdfUrl = urlData.publicUrl;

    const { error: insertError } = await supabase.from("resumos").insert([
      {
        titulo,
        idutilizador: userId,
        iddisciplina: parseInt(idDisciplina),
        idmateria: parseInt(idMateria),
        ficheiro: pdfUrl,
        data_envio: new Date().toISOString(),
        estado: "pendente",
      },
    ]);

    if (!insertError) {
      setShowAddModal(false);
      setTitulo("");
      setFile(null);
      setIdDisciplina("");
      setIdMateria("");
      fetchResumos();
    }
  };

  return (
    <div className="container my-4">
      <h3>Resumos</h3>

      {/* Filtros */}
      <div className="d-flex justify-content-between align-items-start flex-wrap p-3 border rounded bg-white shadow-sm mt-3">
        <div className="d-flex gap-2 flex-wrap">
          <input type="text" className="form-control" placeholder="Unidade Curricular"
            value={unidadeCurricularFiltro} onChange={(e) => setUnidadeCurricularFiltro(e.target.value)} />
          <input type="text" className="form-control" placeholder="Autor"
            value={autorFiltro} onChange={(e) => setAutorFiltro(e.target.value)} />
          <select className="form-select" value={ordenarPor} onChange={(e) => setOrdenarPor(e.target.value)}>
            <option value="">Ordenar por</option>
            <option value="aluno">Aluno</option>
            <option value="docente">Docente</option>
            <option value="antigo">Mais Antigo</option>
            <option value="recente">Mais Recente</option>
          </select>
        </div>
        <button className="btn btn-primary mt-2 mt-md-0" onClick={() => setShowAddModal(true)}>
          <i className="bi bi-plus-circle me-1"></i> Adicionar Resumo
        </button>
      </div>

      {/* Lista de Resumos */}
      <div className="row mt-4">
        {resumosOrdenados.map((resumo, idx) => (
          <div key={idx} className="col-md-4 mb-4">
            <div className="card h-100 shadow-sm" onClick={() => abrirResumoPdf(resumo)} style={{ cursor: "pointer" }}>
              <div className="card-body">
                <h6 className="card-title fw-bold">{resumo.titulo}</h6>
                <p className="mb-1">
                  <i className="bi bi-journal-text me-1"></i>
                  {resumo.disciplinas?.nome}
                </p>
                <p className="mb-0 d-flex align-items-center">
                  <i className="bi bi-person-circle me-1"></i>
                  <span className="me-2">{resumo.utilizadores?.username}</span>
                  {renderBadge(resumo.utilizadores?.tipo_conta || "")}
                </p>
              </div>
            </div>
          </div>
        ))}
        {resumosOrdenados.length === 0 && (
          <p className="text-muted mt-3">Nenhum resumo encontrado com os filtros aplicados.</p>
        )}
      </div>

      {/* Modal Adicionar Resumo */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content shadow">
              <div className="modal-header">
                <h5 className="modal-title">Adicionar Resumo</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleUpload}>
                  <div className="mb-3">
                    <label className="form-label">Título</label>
                    <input type="text" className="form-control" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
                  </div>

                  <div className="row mb-3">
                    <div className="col">
                      <label className="form-label">Disciplina</label>
                      <select className="form-select" value={idDisciplina} onChange={(e) => setIdDisciplina(e.target.value)} required>
                        <option value="">Seleciona uma disciplina</option>
                        {disciplinas.map((disc) => (
                          <option key={disc.iddisciplina} value={disc.iddisciplina}>
                            {disc.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col">
                      <label className="form-label">Matéria</label>
                      <select className="form-select" value={idMateria} onChange={(e) => setIdMateria(e.target.value)} required>
                        <option value="">Seleciona uma matéria</option>
                        {materias.map((mat) => (
                          <option key={mat.idmateria} value={mat.idmateria}>
                            {mat.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Ficheiro PDF</label>
                    <input type="file" className="form-control" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} required />
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-outline-dark" onClick={() => setShowAddModal(false)}>Cancelar</button>
                    <button type="submit" className="btn btn-primary">Criar</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal PDF */}
      {showPdfModal && pdfResumoSelecionado && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{pdfResumoSelecionado.titulo}</h5>
                <button type="button" className="btn-close" onClick={() => setShowPdfModal(false)}></button>
              </div>
              <div className="modal-body" style={{ height: "80vh" }}>
                <iframe src={pdfResumoSelecionado.ficheiro} title="Visualizador PDF" width="100%" height="100%" style={{ border: "none" }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resumos;
