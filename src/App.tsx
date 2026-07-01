import { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Network, 
  MapPinned, 
  Shield, 
  Download, 
  Upload, 
  AlertCircle,
  Car,
  UserCheck,
  RefreshCcw,
  Lock,
  UserPlus,
  FolderLock,
  FileWarning,
  LogOut,
  X
} from 'lucide-react';
import type { Gang, Suspect, Crime, SystemUser, SuspectVehicle } from './types';
import { 
  loadDatabase, 
  saveDatabase, 
  exportDatabaseToJson, 
  importDatabaseFromJson,
  getDemoDatabase,
  loadDatabaseFromSupabase,
  saveDatabaseToSupabase 
} from './utils/db';
import { hashPassword, verifyPassword } from './utils/auth';
import { isSupabaseConfigured } from './utils/supabaseClient';


// Importando componentes das abas
import DashboardTab from './components/DashboardTab';
import SuspectsTab from './components/SuspectsTab';
import GangsGraphTab from './components/GangsGraphTab';
import RoutesMapTab from './components/RoutesMapTab';
import UsersTab from './components/UsersTab';
import VehiclesTab from './components/VehiclesTab';
import GangsTab from './components/GangsTab';
import CrimesTab from './components/CrimesTab';

interface NexosState {
  gangs: Gang[];
  suspects: Suspect[];
  crimes: Crime[];
  users: SystemUser[];
  vehicles: SuspectVehicle[];
}

function App() {
  const [db, setDb] = useState<NexosState>({
    gangs: [],
    suspects: [],
    crimes: [],
    users: [],
    vehicles: []
  });
  
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'suspects' | 'gangs' | 'routes' | 'users' | 'vehicles' | 'gangs-list' | 'crimes-list'>('dashboard');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para identificação do Agente de Acesso (Login/Registro)
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loginName, setLoginName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');

  // 1. Carregar Banco (Servidor -> Fallback LocalStorage)
  const cleanAndFixDb = (database: NexosState): NexosState => {
    if (!database || !Array.isArray(database.crimes)) return database;
    let changed = false;
    const updatedCrimes = database.crimes.map(crime => {
      const normalizedCity = crime.city.trim().toLowerCase();
      if (crime.coordinates && crime.coordinates.length >= 2 && normalizedCity === 'lajeado' && crime.coordinates[0] === -29.8 && crime.coordinates[1] === -52.5) {
        changed = true;
        return {
          ...crime,
          coordinates: [-29.4665, -51.9619] as [number, number]
        };
      }
      return crime;
    });
    return changed ? { ...database, crimes: updatedCrimes } : database;
  };

  const fetchDb = async () => {
    // 1. Tenta carregar do Supabase
    try {
      const supabaseDb = await loadDatabaseFromSupabase();
      if (supabaseDb) {
        const cleanedDb = cleanAndFixDb(supabaseDb);
        setDb(cleanedDb);
        if (cleanedDb !== supabaseDb) {
          saveDatabaseToSupabase(cleanedDb).catch(console.error);
        }
        return cleanedDb;
      }
    } catch (err) {
      console.warn('Supabase offline ou não configurado. Tentando Express Server...');
    }

    // 2. Fallback para Express Server local
    try {
      const res = await fetch('/api/db');
      if (res.ok) {
        const serverDb = await res.json();
        const cleanedDb = cleanAndFixDb(serverDb);
        setDb(cleanedDb);
        if (cleanedDb !== serverDb) {
          fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleanedDb)
          }).catch(console.error);
        }
        return cleanedDb;
      }
    } catch (err) {
      console.warn('Servidor local offline, usando LocalStorage como fallback.');
    }
    
    // 3. Fallback final para LocalStorage
    const localData = loadDatabase();
    const cleanedDb = cleanAndFixDb(localData);
    setDb(cleanedDb);
    if (cleanedDb !== localData) {
      saveDatabase(cleanedDb);
    }
    return cleanedDb;
  };

  useEffect(() => {
    // Tenta carregar o usuário logado da sessão local
    const savedUser = sessionStorage.getItem('nexos_current_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    
    fetchDb();
  }, []);

  // Salvar no Banco (Servidor -> Fallback LocalStorage)
  const updateDb = async (newDb: NexosState) => {
    setDb(newDb);
    
    // 1. Tenta salvar no Supabase
    try {
      const success = await saveDatabaseToSupabase(newDb, db);
      if (success) return;
    } catch (err) {
      console.warn('Erro ao salvar no Supabase. Tentando Express Server...');
    }

    // 2. Tenta salvar no Express Server local
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDb)
      });
      if (res.ok) return;
    } catch (err) {
      console.warn('Servidor offline ao salvar, usando LocalStorage como backup.');
    }

    // 3. Fallback final para LocalStorage
    saveDatabase(newDb);
  };

  // Validador de senha forte
  const validatePassword = (pwd: string) => {
    const minLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[@$!%*?&.\-_#]/.test(pwd);
    return {
      isValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial,
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial
    };
  };

  // Identificar agente e registrar ou realizar o login
  const handleRegisterAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      return alert('Por favor, preencha todos os campos.');
    }

    if (!isLoginMode) {
      if (!loginName.trim()) {
        return alert('Por favor, preencha seu nome completo.');
      }
      const strength = validatePassword(loginPassword);
      if (!strength.isValid) {
        return alert('A senha inserida não cumpre os critérios fortes de segurança exigidos.');
      }
    }

    const payload = isLoginMode 
      ? { email: loginEmail, password: loginPassword }
      : { name: loginName, email: loginEmail, password: loginPassword };

    const endpoint = isLoginMode ? '/api/users/login' : '/api/users/register';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          if (data.user.status === 'inactive') {
            alert('Cadastro realizado com sucesso! Aguarde a aprovação do Administrador (1993lumendes@gmail.com).');
            return;
          }
          const { password: _p1, ...safeUser } = data.user;
          setCurrentUser(safeUser);
          sessionStorage.setItem('nexos_current_user', JSON.stringify(safeUser));
          await fetchDb();
          return;
        }
      } else {
        const errData = await res.json();
        return alert(errData.error || 'Erro de autenticação.');
      }
    } catch (err) {
      console.warn('Servidor central offline. Executando autenticação local no browser.');
    }

    // Fallback: Autenticação/Cadastro local (se servidor offline)
    const currentDb = await fetchDb();
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} - ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (isLoginMode) {
      const user = currentDb.users.find((u: SystemUser) => u.email.toLowerCase() === loginEmail.toLowerCase());
      if (!user) return alert('E-mail ou Senha incorretos.');

      const passwordMatch = await verifyPassword(loginPassword, user.password || '');
      if (!passwordMatch) return alert('E-mail ou Senha incorretos.');

      if (user.status === 'inactive') {
        return alert('Sua conta está inativa. Aguarde a aprovação do Administrador (1993lumendes@gmail.com).');
      }
      user.lastLogin = formattedDate;
      const { password: _pw, ...safeUser } = user;
      setCurrentUser(safeUser);
      sessionStorage.setItem('nexos_current_user', JSON.stringify(safeUser));
      updateDb(currentDb);
    } else {
      const isAlreadyInList = currentDb.users.some((u: SystemUser) => u.email.toLowerCase() === loginEmail.toLowerCase());
      if (isAlreadyInList) {
        return alert('Este e-mail já está cadastrado. Realize o login.');
      }

      const isLocalAdmin = loginEmail.toLowerCase() === '1993lumendes@gmail.com';

      // Hash da senha antes de armazenar — nunca guardar texto puro
      const hashedPwd = await hashPassword(loginPassword);
      const localUserObj: SystemUser = {
        id: `user-${Date.now()}`,
        name: loginName,
        email: loginEmail,
        password: hashedPwd,
        lastLogin: formattedDate,
        status: isLocalAdmin ? 'active' : 'inactive'
      };

      if (isLocalAdmin) {
        const { password: _p3, ...safeAdmin } = localUserObj;
        setCurrentUser(safeAdmin);
        sessionStorage.setItem('nexos_current_user', JSON.stringify(safeAdmin));
        alert('Administrador cadastrado e logado com sucesso!');
      } else {
        alert('Cadastro realizado com sucesso! Aguarde a aprovação do Administrador (1993lumendes@gmail.com).');
      }

      updateDb({
        ...currentDb,
        users: [...currentDb.users, localUserObj]
      });
    }
  };

  // Encerrar sessão
  const handleLogout = () => {
    if (window.confirm('Deseja encerrar sua sessão no Nexos?')) {
      sessionStorage.removeItem('nexos_current_user');
      setCurrentUser(null);
    }
  };

  // Recuperação de senha instrutiva com envio por e-mail (mailto)
  const handleForgotPassword = () => {
    setRecoveryEmail(loginEmail); // pré-preenche com o que já foi digitado
    setShowRecoveryModal(true);
  };

  const handleSendRecoveryEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim()) return alert('Por favor, informe seu e-mail.');

    // 1. Carrega o banco mais recente
    const currentDb = await fetchDb();
    const targetUser = currentDb.users.find(u => u.email.toLowerCase() === recoveryEmail.trim().toLowerCase());

    if (!targetUser) {
      return alert('Nenhum usuário cadastrado foi encontrado com este e-mail.');
    }

    // 2. Gera senha temporária numérica
    const tempPassword = `NX-${Math.floor(100000 + Math.random() * 900000)}`;

    // 3. Atualiza a senha no banco de dados (hashed)
    const hashedTemp = await hashPassword(tempPassword);
    
    const updatedUsers = currentDb.users.map(u => 
      u.email.toLowerCase() === recoveryEmail.trim().toLowerCase() 
        ? { ...u, password: hashedTemp } 
        : u
    );

    // Salva local e Supabase
    await updateDb({
      ...currentDb,
      users: updatedUsers
    });

    // 4. Prepara o e-mail (mailto)
    const subject = encodeURIComponent("Redefinição de Senha - Nexos RS");
    const emailBody = encodeURIComponent(
      `Olá ${targetUser.name},\n\n` +
      `Uma solicitação de redefinição de senha foi efetuada para a sua conta no Nexos RS.\n\n` +
      `Sua nova senha temporária é:\n` +
      `➡️ ${tempPassword}\n\n` +
      `Acesse o sistema e atualize sua senha na guia de usuários.\n\n` +
      `Atenciosamente,\n` +
      `Administração Nexos RS`
    );

    // Abre o cliente de e-mail padrão do sistema operacional
    window.open(`mailto:${targetUser.email}?subject=${subject}&body=${emailBody}`);

    alert(
      `E-mail de recuperação gerado!\n\n` +
      `Um e-mail foi preparado e aberto no seu aplicativo padrão para ser enviado para: ${targetUser.email}\n\n` +
      `Caso seu aplicativo de e-mail não tenha aberto automaticamente, utilize a senha temporária abaixo para acessar o sistema:\n` +
      `👉 ${tempPassword}`
    );

    setShowRecoveryModal(false);
  };

  // Exportar backup
  const handleExport = () => {
    exportDatabaseToJson(db);
  };

  // Importar backup
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importDatabaseFromJson(
      file,
      (importedDb) => {
        setDb(importedDb);
        setErrorMsg(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        alert('Banco de dados importado com sucesso!');
      },
      (error) => {
        setErrorMsg(error);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    );
  };

  // Carregar dados de demonstração/teste
  const handleLoadDemoData = () => {
    if (window.confirm('Isso irá substituir os dados atuais pelos dados de teste do Rio Grande do Sul. Deseja continuar?')) {
      const demoDb = getDemoDatabase();
      updateDb(demoDb);
      alert('Dados de demonstração carregados!');
    }
  };

  // Renders do conteúdo principal
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardTab 
            db={db} 
            onUpdateDb={updateDb}
            onViewSuspect={(suspectId) => {
              setCurrentTab('suspects');
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('select-suspect', { detail: suspectId }));
              }, 100);
            }}
          />
        );
      case 'suspects':
        return (
          <SuspectsTab 
            db={db} 
            onUpdateDb={updateDb} 
          />
        );
      case 'gangs':
        return (
          <GangsGraphTab 
            db={db} 
          />
        );
      case 'routes':
        return (
          <RoutesMapTab 
            db={db} 
          />
        );
      case 'users':
        return (
          <UsersTab 
            db={db} 
            onUpdateDb={updateDb} 
            currentUser={currentUser}
          />
        );
      case 'vehicles':
        return (
          <VehiclesTab 
            db={db} 
            onUpdateDb={updateDb} 
          />
        );
      case 'gangs-list':
        return (
          <GangsTab 
            db={db} 
            onUpdateDb={updateDb} 
          />
        );
      case 'crimes-list':
        return (
          <CrimesTab 
            db={db} 
            onUpdateDb={updateDb} 
          />
        );
      default:
        return <DashboardTab db={db} onUpdateDb={updateDb} onViewSuspect={() => {}} />;
    }
  };

  const getTabTitle = () => {
    switch (currentTab) {
      case 'dashboard': return 'Painel de Controle (Dashboard)';
      case 'suspects': return 'Cadastro de Suspeitos';
      case 'gangs': return 'Conexões de Quadrilhas (Obsidian)';
      case 'routes': return 'Mapeamento de Rotas RS';
      case 'users': return 'Colegas Autorizados no Sistema';
      case 'vehicles': return 'Cadastro de Veículos Suspeitos';
      case 'gangs-list': return 'Cadastro de Quadrilhas Especializadas';
      case 'crimes-list': return 'Ocorrências Criminais Registradas';
    }
  };

  // Se o agente de segurança não estiver identificado, exibe a tela de registro/login bloqueante
  if (!currentUser) {
    return (
      <div className="modal-backdrop" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="glass-panel" style={{ width: '90%', maxWidth: '440px', padding: '36px', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', border: '1px solid var(--border-glow)' }}>
              <Lock className="text-accent" size={26} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Acesso ao Sistema Nexos</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Ambiente de investigações criminais restrito (RS).
              </p>
            </div>
          </div>

          {/* Toggle de Login/Registro */}
          <div style={{ display: 'flex', width: '100%', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
            <button 
              type="button" 
              style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', borderBottom: isLoginMode ? '2px solid var(--accent)' : 'none', color: isLoginMode ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isLoginMode ? 'bold' : 'normal', cursor: 'pointer', outline: 'none' }}
              onClick={() => { setIsLoginMode(true); setErrorMsg(null); }}
            >
              Entrar (Login)
            </button>
            <button 
              type="button" 
              style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', borderBottom: !isLoginMode ? '2px solid var(--accent)' : 'none', color: !isLoginMode ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: !isLoginMode ? 'bold' : 'normal', cursor: 'pointer', outline: 'none' }}
              onClick={() => { setIsLoginMode(false); setErrorMsg(null); }}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleRegisterAgent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!isLoginMode && (
              <div className="form-group">
                <label>Nome Completo</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ex: Marcelo Rodrigues"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>E-mail Funcional</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="nome.sobrenome@pc.rs.gov.br"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: isLoginMode ? '8px' : '15px' }}>
              <label>Senha de Acesso</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Digite sua senha"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            {isLoginMode && (
              <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                <button 
                  type="button" 
                  onClick={handleForgotPassword} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--text-secondary)', 
                    fontSize: '0.75rem', 
                    cursor: 'pointer', 
                    textDecoration: 'underline',
                    padding: 0 
                  }}
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {/* Requisitos de senha forte (apenas no modo Registro) */}
            {!isLoginMode && (
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '6px' }}>Critérios para Senha Forte:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.65rem' }}>
                  <div style={{ color: loginPassword.length >= 8 ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{loginPassword.length >= 8 ? '✓' : '○'}</span>
                    <span>Mínimo de 8 caracteres</span>
                  </div>
                  <div style={{ color: /[A-Z]/.test(loginPassword) ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{/[A-Z]/.test(loginPassword) ? '✓' : '○'}</span>
                    <span>Pelo menos uma letra maiúscula (A-Z)</span>
                  </div>
                  <div style={{ color: /[a-z]/.test(loginPassword) ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{/[a-z]/.test(loginPassword) ? '✓' : '○'}</span>
                    <span>Pelo menos uma letra minúscula (a-z)</span>
                  </div>
                  <div style={{ color: /[0-9]/.test(loginPassword) ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{/[0-9]/.test(loginPassword) ? '✓' : '○'}</span>
                    <span>Pelo menos um número (0-9)</span>
                  </div>
                  <div style={{ color: /[@$!%*?&.\-_#]/.test(loginPassword) ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{/[@$!%*?&.\-_#]/.test(loginPassword) ? '✓' : '○'}</span>
                    <span>Pelo menos um caractere especial (@$!%*?&.-_#)</span>
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '10px' }}>
              <UserPlus size={18} />
              <span>{isLoginMode ? 'Acessar Sistema' : 'Cadastrar e Acessar'}</span>
            </button>
          </form>
        </div>

        {/* Modal de Recuperação de Senha */}
        {showRecoveryModal && (
          <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
              <div className="glass-panel-header" style={{ marginBottom: '20px' }}>
                <h2>Recuperar Senha de Acesso</h2>
                <button className="close-btn" onClick={() => setShowRecoveryModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
                Informe seu e-mail funcional cadastrado. O sistema gerará uma nova senha temporária e preparará um e-mail de redefinição para ser enviado.
              </p>
              <form onSubmit={handleSendRecoveryEmail} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>E-mail Funcional</label>
                  <input 
                    type="email"
                    className="form-input"
                    placeholder="nome.sobrenome@pc.rs.gov.br"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowRecoveryModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Gerar e Enviar E-mail
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Barra Lateral de Navegação */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Shield className="text-accent" size={24} />
          <h2>NEXOS RS</h2>
          <span className="sidebar-badge">INTEL</span>
        </div>

        <ul className="nav-list">
          <li className="nav-item">
            <button 
              className={`nav-button ${currentTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentTab('dashboard')}
            >
              <LayoutDashboard size={20} />
              <span>Painel</span>
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-button ${currentTab === 'crimes-list' ? 'active' : ''}`}
              onClick={() => setCurrentTab('crimes-list')}
            >
              <FileWarning size={20} />
              <span>Ocorrências</span>
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-button ${currentTab === 'suspects' ? 'active' : ''}`}
              onClick={() => setCurrentTab('suspects')}
            >
              <Users size={20} />
              <span>Suspeitos</span>
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-button ${currentTab === 'gangs-list' ? 'active' : ''}`}
              onClick={() => setCurrentTab('gangs-list')}
            >
              <FolderLock size={20} />
              <span>Quadrilhas</span>
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-button ${currentTab === 'gangs' ? 'active' : ''}`}
              onClick={() => setCurrentTab('gangs')}
            >
              <Network size={20} />
              <span>Conexões</span>
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-button ${currentTab === 'routes' ? 'active' : ''}`}
              onClick={() => setCurrentTab('routes')}
            >
              <MapPinned size={20} />
              <span>Rotas RS</span>
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-button ${currentTab === 'vehicles' ? 'active' : ''}`}
              onClick={() => setCurrentTab('vehicles')}
            >
              <Car size={20} />
              <span>Veículos</span>
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-button ${currentTab === 'users' ? 'active' : ''}`}
              onClick={() => setCurrentTab('users')}
            >
              <UserCheck size={20} />
              <span>Usuários</span>
            </button>
          </li>
        </ul>

        {/* Footer com botões de backup */}
        <div className="sidebar-footer">
          {errorMsg && (
            <div className="text-danger flex items-center gap-1 text-xs mb-2" style={{ padding: '0 4px' }}>
              <AlertCircle size={14} />
              <span>Erro no arquivo de importação.</span>
            </div>
          )}

          {/* Dados de identificação do policial logado */}
          <div style={{ padding: '8px 10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '8px', fontSize: '0.75rem' }}>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currentUser.name}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', marginTop: '2px', wordBreak: 'break-all' }}>
              {currentUser.email}
              {currentUser.role ? ` • ${currentUser.role}` : ''}
            </p>
          </div>

          <button 
            className="footer-btn" 
            onClick={handleLogout}
            style={{ color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.25)', backgroundColor: 'rgba(248, 113, 113, 0.05)', marginBottom: '8px' }}
          >
            <LogOut size={16} />
            <span>Encerrar Sessão</span>
          </button>

          <button className="footer-btn" onClick={handleLoadDemoData} style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', color: 'var(--text-primary)', borderColor: 'rgba(99, 102, 241, 0.2)', marginBottom: '4px' }}>
            <RefreshCcw size={16} />
            <span>Dados de Teste</span>
          </button>
          
          <div className="file-input-wrapper footer-btn">
            <Upload size={16} />
            <span>Importar Backup</span>
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef}
              onChange={handleImport}
            />
          </div>

          <button className="footer-btn" onClick={handleExport}>
            <Download size={16} />
            <span>Exportar Backup</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-title">
            <h1>{getTabTitle()}</h1>
          </div>
          <div className="badge-status" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
            <div 
              style={{ 
                backgroundColor: isSupabaseConfigured() ? '#10b981' : '#f59e0b',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                boxShadow: isSupabaseConfigured() ? '0 0 8px #10b981' : '0 0 8px #f59e0b'
              }}
            ></div>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
              {isSupabaseConfigured() ? 'NUVEM • SUPABASE' : 'MODO LOCAL • LOCALSTORAGE'}
            </span>
          </div>
        </header>

        {renderTabContent()}
      </main>
    </div>
  );
}

export default App;
