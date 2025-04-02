import { supabase } from './supabaseconfig';

async function buscarCursoDisciplinasComInfo() {
  const { data, error } = await supabase
    .from('curso_disciplinas')
    .select(`
      idcurso,
      disciplinas (
        iddisciplina,
        nome,
        ano,
        semestre
      ),
      utilizadores: idcurso (
        id,
        nome,
        username,
        apelido
      )
    `);

  if (error) {
    console.error("Erro ao buscar dados:", error);
    return null;
  }

  console.log("Dados encontrados:", data);
  return data;
}

buscarCursoDisciplinasComInfo();
