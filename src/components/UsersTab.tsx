import { useState } from 'react';
import { Search, UserPlus, X, Shield, Calendar } from 'lucide-react';
import type { Gang, Suspect, Crime, SystemUser, SuspectVehicle } from '../types';
import { hashPassword } from '../utils/auth';

interface NexosState {
  gangs: Gang[];
  suspects: Suspect[];
  crimes: Crime[];
  users: SystemUser[];
  vehicles: SuspectVehicle[];
}

interface UsersTabProps {
  db: NexosState;
  onUpdateDb: (newDb: NexosState) => void;
  currentUser?: SystemUser | null;
}

export default function UsersTab({ db, onUpdateDb, currentUser }: UsersTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados para formulário
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');

  // Validador de senha forte
  const isPasswordValid = (pwd: string) => {
    const minLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[@$!%*?&.\-_#]/.test(pwd);
    return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
  };

  // Filtrar usuários
  const filteredUsers = db.users.filter(u => {
    const query = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  });

  // Salvar novo usuário com senha hashed
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim() || !userPassword.trim()) {
      return alert('Todos os campos são obrigatórios!');
    }

    if (!isPasswordValid(userPassword)) {
      return alert('A senha informada não atende aos critérios de segurança exigidos.');
    }

    const isAdminCreating = currentUser?.email?.toLowerCase() === '1993lumendes@gmail.com';
    const isNewUserAdmin = userEmail.toLowerCase() === '1993lumendes@gmail.com';

    // Hash da senha antes de persistir — nunca armazenar em texto puro
    const hashedPwd = await hashPassword(userPassword);

    const newUser: SystemUser = {
      id: `user-${Date.now()}`,
      name: userName,
      email: userEmail,
      password: hashedPwd,
      lastLogin: 'Nunca (Aguardando primeiro acesso)',
      status: (isAdminCreating || isNewUserAdmin) ? 'active' : 'inactive'
    };

    onUpdateDb({
      ...db,
      users: [...db.users, newUser]
    });

    // Limpar e fechar
    setUserName('');
    setUserEmail('');
    setUserPassword('');
    setIsModalOpen(false);

    if (isAdminCreating || isNewUserAdmin) {
      alert(`Acesso autorizado para ${userName}!`);
    } else {
      alert(`Cadastro de ${userName} realizado com sucesso! Aguarda aprovação do Administrador (1993lumendes@gmail.com).`);
    }
  };

  // Aprovar acesso de usuário
  const handleApproveUser = (userId: string, userName: string) => {
    onUpdateDb({
      ...db,
      users: db.users.map(u => u.id === userId ? { ...u, status: 'active' as const } : u)
    });
    alert(`Acesso autorizado para ${userName}!`);
  };

  // Excluir acesso de usuário
  const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`Tem certeza que deseja revogar o acesso de segurança de ${userName}?`)) {
      onUpdateDb({
        ...db,
        users: db.users.filter(u => u.id !== userId)
      });
    }
  };

  return (
    <div className="tab-container">
      {/* Busca e Botão de Inserção */}
      <div className="search-bar-row">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Buscar colega por nome ou e-mail..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <UserPlus size={18} />
          <span>Autorizar Colega</span>
        </button>
      </div>

      {/* Tabela de Usuários */}
      <div className="glass-panel">
        <div className="glass-panel-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield className="text-accent" size={18} />
            Agentes e Investigadores com Acesso Autorizado
          </h3>
          <span className="text-xs text-secondary">Registro de Auditoria RS</span>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail Funcional</th>
                <th>Último Acesso ao Sistema</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <span style={{ fontWeight: 600 }}>{user.name}</span>
                    {user.status === 'inactive' && (
                      <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', marginLeft: '8px', fontSize: '0.7rem' }}>
                        Pendente de Aprovação
                      </span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      {user.email}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                      <Calendar size={12} className="text-muted" />
                      <span>{user.lastLogin}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {user.status === 'inactive' && currentUser?.email?.toLowerCase() === '1993lumendes@gmail.com' && (
                        <button 
                          className="btn-primary" 
                          style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#10b981' }}
                          onClick={() => handleApproveUser(user.id, user.name)}
                        >
                          Aprovar
                        </button>
                      )}
                      {user.email?.toLowerCase() !== '1993lumendes@gmail.com' && user.id !== 'user-1' ? (
                        <button 
                          className="btn-danger" 
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          onClick={() => handleDeleteUser(user.id, user.name)}
                        >
                          Revogar Acesso
                        </button>
                      ) : (
                        <span className="badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)' }}>
                          Administrador
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                    Nenhum policial encontrado com estes termos de busca.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Autorizar Novo Colega */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="glass-panel-header" style={{ marginBottom: '24px' }}>
              <h2>Autorizar Novo Colega de Investigação</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Nome Completo do Policial</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Ex: Roberto Ferreira"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>E-mail Funcional</label>
                <input 
                  type="email" 
                  className="form-input"
                  placeholder="roberto.ferreira@pc.rs.gov.br"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Senha de Acesso</label>
                <input 
                  type="password" 
                  className="form-input"
                  placeholder="Defina uma senha forte"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  required
                />
              </div>

              {/* Critérios de senha forte */}
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '6px' }}>Critérios para Senha Forte:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.65rem' }}>
                  <div style={{ color: userPassword.length >= 8 ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{userPassword.length >= 8 ? '✓' : '○'}</span>
                    <span>Mínimo de 8 caracteres</span>
                  </div>
                  <div style={{ color: /[A-Z]/.test(userPassword) ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{/[A-Z]/.test(userPassword) ? '✓' : '○'}</span>
                    <span>Pelo menos uma letra maiúscula (A-Z)</span>
                  </div>
                  <div style={{ color: /[a-z]/.test(userPassword) ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{/[a-z]/.test(userPassword) ? '✓' : '○'}</span>
                    <span>Pelo menos uma letra minúscula (a-z)</span>
                  </div>
                  <div style={{ color: /[0-9]/.test(userPassword) ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{/[0-9]/.test(userPassword) ? '✓' : '○'}</span>
                    <span>Pelo menos um número (0-9)</span>
                  </div>
                  <div style={{ color: /[@$!%*?&.\-_#]/.test(userPassword) ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{/[@$!%*?&.\-_#]/.test(userPassword) ? '✓' : '○'}</span>
                    <span>Pelo menos um caractere especial (@$!%*?&.-_#)</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Liberar Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
