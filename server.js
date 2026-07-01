const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5181;
const DB_FILE = path.join(__dirname, 'database.json');

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Permitir uploads de imagens em base64 grandes

// Estrutura de banco limpa inicial
const cleanDbTemplate = {
  gangs: [],
  suspects: [],
  crimes: [],
  users: [],
  vehicles: []
};

// Carrega o banco de dados do arquivo JSON
function getDatabase() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(cleanDbTemplate, null, 2), 'utf-8');
      return cleanDbTemplate;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return {
      gangs: parsed.gangs || [],
      suspects: parsed.suspects || [],
      crimes: parsed.crimes || [],
      users: parsed.users || [],
      vehicles: parsed.vehicles || []
    };
  } catch (error) {
    console.error('Erro ao ler database.json, usando modelo limpo:', error);
    return cleanDbTemplate;
  }
}

// Salva o banco de dados no arquivo JSON
function saveDatabase(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Erro ao escrever no database.json:', error);
    return false;
  }
}

// Endpoint para ler todo o banco
app.get('/api/db', (req, res) => {
  const db = getDatabase();
  res.json(db);
});

// Endpoint para salvar todo o banco
app.post('/api/db', (req, res) => {
  const newDb = req.body;
  if (newDb && Array.isArray(newDb.gangs) && Array.isArray(newDb.suspects)) {
    const success = saveDatabase(newDb);
    if (success) {
      return res.json({ success: true });
    }
  }
  res.status(400).json({ error: 'Dados inválidos ou erro ao salvar.' });
});

// Endpoint para auto-registro de agente policial
app.post('/api/users/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, E-mail e Senha são obrigatórios.' });
  }

  const db = getDatabase();
  
  // Verifica se o usuário já existe pelo e-mail
  let existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: 'E-mail já cadastrado. Por favor, realize o login.' });
  }

  const now = new Date();
  const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} - ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const isAdmin = email.toLowerCase() === '1993lumendes@gmail.com';

  // Cria novo usuário
  const user = {
    id: `user-${Date.now()}`,
    name,
    email,
    password, // Armazenando a senha (como é local-first e simples, texto plano ou hash leve é suficiente)
    lastLogin: formattedDate,
    status: isAdmin ? 'active' : 'inactive'
  };
  
  db.users.push(user);
  saveDatabase(db);
  res.json({ success: true, user });
});

// Endpoint para login de usuário existente
app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e Senha são obrigatórios.' });
  }

  const db = getDatabase();
  let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user || user.password !== password) {
    return res.status(400).json({ error: 'E-mail ou Senha incorretos.' });
  }

  if (user.status === 'inactive') {
    return res.status(403).json({ error: 'Sua conta está inativa. Aguarde a aprovação do Administrador (1993lumendes@gmail.com).' });
  }

  const now = new Date();
  const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} - ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Atualiza último login
  user.lastLogin = formattedDate;

  saveDatabase(db);
  res.json({ success: true, user });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`   NEXOS BACKEND - SERVIDOR DE COLABORAÇÃO LOCAL`);
  console.log(`   Rodando em: http://localhost:${PORT}`);
  console.log(`   Gravando em: ${DB_FILE}`);
  console.log(`==================================================`);
});
