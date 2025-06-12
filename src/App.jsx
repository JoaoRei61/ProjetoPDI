import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import RegistoPage from "./pages/RegistoPage";
import LoginPage from "./pages/LoginPage";

import UserPage from "./pages/user/UserPage";
import Redirecionar from "./pages/Redirecionar";
import Inicio from "./pages/user/Inicio";
import AdicionarExercicios from "./pages/user/AdicionarExercicios";
import ValidarResumos from "./pages/user/ValidarResumos";
import QuestoesPage from "./pages/user/QuestoesPage";
import ResolverQuestoes from "./pages/user/ResolverQuestoes";
import ModoExamePage from "./pages/user/ModoExamePage";
import ResumosPage from "./pages/user/ResumosPage";
import Perfil from "./pages/user/Perfil";
import Leaderboard from "./pages/user/LeaderBoard";
import HistoricoExercicios from "./pages/user/HistoricoExercicios";
import TestePage from "./pages/user/TestePage";
import DisciplinaPage from "./pages/user/DisciplinaPage";

import AdminPage from "./pages/admin/AdminPage";
import Dashboard from "./pages/admin/Dashboard";
import AdicionarCursos from "./pages/admin/AdicionarCursos";
import AdicionarDocentes from "./pages/admin/AdicionarDocentes";
import AdicionarUnidadesCurriculares from "./pages/admin/AdicionarUnidadesCurriculares";

import Wrapper from "./pages/Wrapper";

function App() {
  return (
    <Router>
      <Routes>
        {/* Redireciona com base no tipo de conta */}
        <Route path="/" element={<Redirecionar />} />

        {/* Rotas protegidas - Utilizador */}
        <Route path="/user" element={
          <Wrapper>
            <UserPage />
          </Wrapper>
        }>
          <Route index element={<Inicio />} />
          <Route path="adicionar-exercicios" element={<AdicionarExercicios />} />
          <Route path="historico-exercicios" element={<HistoricoExercicios />} />
          <Route path="validar-resumos" element={<ValidarResumos />} />
          <Route path="questoes" element={<QuestoesPage />} />
          <Route path="questoes-resolver" element={<ResolverQuestoes />} />
          <Route path="modo-exame" element={<ModoExamePage />} />
          <Route path="resumos" element={<ResumosPage />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="teste" element={<TestePage />} />
          <Route path="disciplina/:nome" element={<DisciplinaPage />} /> 
        </Route>

        {/* Rotas protegidas - Admin */}
        <Route path="/admin" element={
          <Wrapper>
            <AdminPage />
          </Wrapper>
        }>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="adicionar-curso" element={<AdicionarCursos />} />
          <Route path="adicionar-docente" element={<AdicionarDocentes />} />
          <Route path="adicionar-unidade-curricular" element={<AdicionarUnidadesCurriculares />} />
        </Route>

        {/* Páginas públicas */}
        <Route path="/registo" element={<RegistoPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;
