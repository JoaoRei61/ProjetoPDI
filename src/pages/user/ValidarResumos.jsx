import React, { useEffect, useState } from "react";
import supabase from "../../helper/supabaseconfig";
import "bootstrap-icons/font/bootstrap-icons.css";

const ValidarResumos = () => {
  const [resumosPendentes, setResumosPendentes] = useState([]);
  const [resumosValidados, setResumosValidados] = useState([]);
  const [tipoConta, setTipoConta] = useState("");
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfResumoSelecionado, setPdfResumoSelecionado] = useState(null);

  useEffect(() => {
    obterTipoConta();
  }, []);

  useEffect(() => {
    if (tipoConta) fetchResumos();
  }, [tipoConta]);

  const obterTipoConta = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const { data, error } = await supabase
      .from("utilizadores")
      .select("tipo_conta")
      .eq("id", userId)
      .single();

    if (!error && data) setTipoConta(data.tipo_conta);
  };

  const fetchResumos = async () => {
    const user = await supabase.auth.getUser();
    const userId = user.data.user.id;

    const { data: disciplinasDoDocente } = await supabase
      .from("docente_disciplina")
      .select("iddisciplina")
      .eq("iddocente", userId);

    const idsDisciplinas = disciplinasDoDocente?.map((d) => d.iddisciplina);

    const { data, error } = await supabase
      .from("resumos")
      .select("*, utilizadores(username), disciplinas(nome)")
      .order("data_envio", { ascending: false });

    if (!error && data) {
      const visiveis = tipoConta === "admin"
        ? data
        : data.filter((r) => idsDisciplinas.includes(r.iddisciplina));

      setResumosPendentes(visiveis.filter((r) => r.estado === "pendente"));
      setResumosValidados(visiveis.filter((r) => r.estado !== "pendente"));
    }
  };

  const atualizarEstado = async (idResumo, novoEstado) => {
    const { error } = await supabase
      .from("resumos")
      .update({ estado: novoEstado })
      .eq("idresumo", idResumo);

    if (!error) fetchResumos();
  };

  const abrirResumoPdf = async (resumo) => {
    const ficheiroPath = resumo.ficheiro.split("/").pop();
    const { data } = supabase.storage.from("resumos").getPublicUrl(ficheiroPath);
    setPdfResumoSelecionado({ ...resumo, url: data.publicUrl });
    setShowPdfModal(true);
  };

  const renderResumoCard = (resumo, aValidar = false) => (
    <div className="card mb-3 shadow-sm" key={resumo.idresumo}>
      <div className="card-body">
        <h5 className="card-title">{resumo.titulo}</h5>
        <p className="mb-1"><strong>Disciplina:</strong> {resumo.disciplinas?.nome}</p>
        <p className="mb-1"><strong>Autor:</strong> {resumo.utilizadores?.username}</p>
        <button className="btn btn-outline-primary btn-sm mb-2" onClick={() => abrirResumoPdf(resumo)}>
          Visualizar Resumo
        </button>
        {aValidar ? (
          <div className="d-flex gap-2 mt-2">
            <button className="btn btn-success btn-sm" onClick={() => atualizarEstado(resumo.idresumo, "aprovado")}>Aceitar</button>
            <button className="btn btn-danger btn-sm" onClick={() => atualizarEstado(resumo.idresumo, "recusado")}>Recusar</button>
          </div>
        ) : (
          <span className={`badge bg-${resumo.estado === "aprovado" ? "success" : "danger"}`}>{resumo.estado}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="container my-4">
      <h3>Validação de Resumos</h3>

      {/* Pendentes */}
      <section className="mt-4">
        <h5>Resumos pendentes</h5>
        {resumosPendentes.length === 0 ? (
          <p className="text-muted">Nenhum resumo pendente para validação.</p>
        ) : (
          resumosPendentes.map((resumo) => renderResumoCard(resumo, true))
        )}
      </section>

      {/* Validados */}
      <section className="mt-5">
        <h5>Histórico de resumos</h5>
        {resumosValidados.length === 0 ? (
          <p className="text-muted">Ainda não existem resumos validados.</p>
        ) : (
          resumosValidados.map((resumo) => renderResumoCard(resumo))
        )}
      </section>

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
                <iframe
                  src={pdfResumoSelecionado.url}
                  title="Visualizador PDF"
                  width="100%"
                  height="100%"
                  style={{ border: "none" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidarResumos;
