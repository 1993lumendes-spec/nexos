const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const app = express();
const PORT = 5181;
const DB_FILE = path.join(__dirname, 'database.json');

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:5181'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
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
    let db;
    if (!fs.existsSync(DB_FILE)) {
      db = {
        gangs: [],
        suspects: [],
        crimes: [],
        users: [],
        vehicles: []
      };
    } else {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      db = {
        gangs: parsed.gangs || [],
        suspects: parsed.suspects || [],
        crimes: parsed.crimes || [],
        users: parsed.users || [],
        vehicles: parsed.vehicles || []
      };
    }

    // Auto-semeia o usuário administrador se não existir
    const adminUser = db.users.find(u => u.email.toLowerCase() === '1993lumendes@gmail.com');
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || '#Arla$15582#';
    if (!adminUser) {
      const adminHash = bcrypt.hashSync(defaultPassword, SALT_ROUNDS);
      db.users.push({
        id: 'user-admin',
        name: 'Administrador Nexos',
        email: '1993lumendes@gmail.com',
        password: adminHash,
        role: 'Administrador do Sistema',
        assignmentCity: 'Lajeado',
        lastLogin: 'Nunca (Acesso Inicial)',
        status: 'active'
      });
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } else {
      // Se a senha armazenada for a antiga default (NexosAdmin2026!), atualiza para a nova
      const isOldPassword = bcrypt.compareSync('NexosAdmin2026!', adminUser.password);
      if (isOldPassword) {
        adminUser.password = bcrypt.hashSync(defaultPassword, SALT_ROUNDS);
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
      }
    }
    return db;
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

  // Cria novo usuário com senha hashed
  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
  const user = {
    id: `user-${Date.now()}`,
    name,
    email,
    password: passwordHash, // Armazenado como bcrypt hash — nunca em texto puro
    lastLogin: formattedDate,
    status: isAdmin ? 'active' : 'inactive'
  };
  
  db.users.push(user);
  saveDatabase(db);
  // Nunca retornar o hash da senha na resposta
  const { password: _omit, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// Endpoint para login de usuário existente
app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e Senha são obrigatórios.' });
  }

  const db = getDatabase();
  let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(400).json({ error: 'E-mail ou Senha incorretos.' });
  }

  if (user.status === 'inactive') {
    return res.status(403).json({ error: 'Sua conta está inativa. Aguarde a aprovação do Administrador (1993lumendes@gmail.com).' });
  }

  const now = new Date();
  const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} - ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Atualiza último login e salva
  user.lastLogin = formattedDate;
  saveDatabase(db);

  // Nunca retornar o hash da senha na resposta
  const { password: _hash, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`   NEXOS BACKEND - SERVIDOR DE COLABORAÇÃO LOCAL`);
  console.log(`   Rodando em: http://localhost:${PORT}`);
  console.log(`   Gravando em: ${DB_FILE}`);
  console.log(`==================================================`);
});
