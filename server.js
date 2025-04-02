const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Conexão com MySQL
const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "admin",
  database: "escola",
});

db.connect((err) => {
  if (err) {
    console.error("Erro ao conectar ao MySQL:", err);
    return;
  }
  console.log("Conectado ao MySQL");
});

// Rota para buscar cursos
app.get("/cursos", (req, res) => {
  db.query("SELECT * FROM cursos", (err, results) => {
    if (err) {
      res.status(500).json({ error: "Erro ao buscar cursos" });
    } else {
      res.json(results);
    }
  });
});

// Servidor rodando na porta 3000
app.listen(3000, () => {
  console.log("Servidor rodando em http://127.0.0.1:3000");
});
