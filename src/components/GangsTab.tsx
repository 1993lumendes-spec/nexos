import { useState } from 'react';
import { Search, Plus, X, Edit, Trash2, ShieldAlert } from 'lucide-react';
import type { Gang, Suspect, Crime, SystemUser, SuspectVehicle } from '../types';
import { CITIES_RS } from '../utils/mockData';

interface NexosState {
  gangs: Gang[];
  suspects: Suspect[];
  crimes: Crime[];
  users: SystemUser[];
  vehicles: SuspectVehicle[];
}

interface GangsTabProps {
  db: NexosState;
  onUpdateDb: (newDb: NexosState) => void;
}

export default function GangsTab({ db, onUpdateDb }: GangsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Estados para formulário
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formOrigin, setFormOrigin] = useState('');
  const [formColor, setFormColor] = useState('#6366f1');
  const [formDescription, setFormDescription] = useState('');

  // Filtrar quadrilhas
  const filteredGangs = db.gangs.filter(g => {
    const query = searchQuery.toLowerCase();
    return (
      g.name.toLowerCase().includes(query) ||
      g.originCity.toLowerCase().includes(query) ||
      g.description.toLowerCase().includes(query)
    );
  });

  // Obter lista dinâmica de cidades sugeridas (RS)
  const getSuggestedCities = () => {
    const defaultCities = Object.keys(CITIES_RS);
    const gangCities = db.gangs.map(g => g.originCity);
    const crimeCities = db.crimes.map(c => c.city);
    const photoCities = db.suspects.flatMap(s => s.photos.map(p => p.location));
    
    const allCities = new Set([
      ...defaultCities,
      ...gangCities,
      ...crimeCities,
      ...photoCities
    ]);
    
    return Array.from(allCities).filter(Boolean).sort();
  };

  const suggestedCities = getSuggestedCities();

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormId(`gang-${Date.now()}`);
    setFormName('');
    setFormOrigin('');
    setFormColor('#6366f1');
    setFormDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (gang: Gang) => {
    setModalMode('edit');
    setFormId(gang.id);
    setFormName(gang.name);
    setFormOrigin(gang.originCity);
    setFormColor(gang.color);
    setFormDescription(gang.description);
    setIsModalOpen(true);
  };

  const handleSaveGang = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return alert('O nome da quadrilha é obrigatório!');

    let updatedGangs = [...db.gangs];

    if (modalMode === 'create') {
      const newGang: Gang = {
        id: formId,
        name: formName,
        originCity: formOrigin || 'Porto Alegre',
        color: formColor,
        description: formDescription || 'Sem detalhes fornecidos.'
      };
      updatedGangs.push(newGang);
    } else {
      updatedGangs = updatedGangs.map(g => {
        if (g.id === formId) {
          return {
            ...g,
            name: formName,
            originCity: formOrigin || 'Porto Alegre',
            color: formColor,
            description: formDescription
          };
        }
        return g;
      });
    }

    onUpdateDb({
      ...db,
      gangs: updatedGangs
    });

    setIsModalOpen(false);
    alert(modalMode === 'create' ? 'Quadrilha cadastrada com sucesso!' : 'Ficha da quadrilha atualizada com sucesso!');
  };

  const handleDeleteGang = (gangId: string, gangName: string) => {
    if (!window.confirm(`Tem certeza que deseja remover permanentemente a quadrilha "${gangName}"? Os suspeitos, veículos e ocorrências vinculadas a ela serão desassociados (ficarão independentes).`)) {
      return;
    }

    const updatedGangs = db.gangs.filter(g => g.id !== gangId);
    
    // Limpar gangId de suspeitos vinculados
    const updatedSuspects = db.suspects.map(s => {
      if (s.gangId === gangId) {
        return { ...s, gangId: '' };
      }
      return s;
    });

    // Limpar gangId de veículos vinculados
    const updatedVehicles = db.vehicles.map(v => {
      if (v.gangId === gangId) {
        return { ...v, gangId: '' };
      }
      return v;
    });

    // Limpar gangId de ocorrências vinculadas
    const updatedCrimes = db.crimes.map(c => {
      if (c.gangId === gangId) {
        return { ...c, gangId: '' };
      }
      return c;
    });

    onUpdateDb({
      ...db,
      gangs: updatedGangs,
      suspects: updatedSuspects,
      vehicles: updatedVehicles,
      crimes: updatedCrimes
    });

    alert(`Quadrilha "${gangName}" removida.`);
  };

  return (
    <div className="tab-container">
      {/* Busca e Botão Novo */}
      <div className="search-bar-row">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome, cidade de origem ou histórico..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <button className="btn-primary" onClick={handleOpenCreateModal}>
          <Plus size={18} />
          <span>Cadastrar Quadrilha</span>
        </button>
      </div>

      {/* Tabela de Quadrilhas */}
      <div className="glass-panel">
        <div className="glass-panel-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert className="text-accent" size={18} />
            Quadrilhas Especializadas Registradas
          </h3>
          <span className="text-xs text-secondary">{filteredGangs.length} quadrilhas</span>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Cor</th>
                <th>Nome da Quadrilha</th>
                <th>Cidade Sede</th>
                <th>Membros Ativos</th>
                <th>Ocorrências Relacionadas</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredGangs.map(gang => {
                const membersCount = db.suspects.filter(s => s.gangId === gang.id).length;
                const crimesCount = db.crimes.filter(c => c.gangId === gang.id).length;

                return (
                  <tr key={gang.id}>
                    <td>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: gang.color, boxShadow: `0 0 10px ${gang.color}` }}></div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{gang.name}</span>
                    </td>
                    <td>{gang.originCity}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)' }}>
                        {membersCount} suspeitos
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                        {crimesCount} furtos
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn-secondary" 
                          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                          onClick={() => handleOpenEditModal(gang)}
                        >
                          <Edit size={12} />
                          <span>Editar</span>
                        </button>
                        <button 
                          className="btn-danger" 
                          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                          onClick={() => handleDeleteGang(gang.id, gang.name)}
                        >
                          <Trash2 size={12} />
                          <span>Remover</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredGangs.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                    Nenhuma quadrilha encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Cadastro/Edição de Quadrilha */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="glass-panel-header" style={{ marginBottom: '24px' }}>
              <h2>{modalMode === 'create' ? 'Cadastrar Nova Quadrilha' : 'Editar Cadastro da Quadrilha'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveGang} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Nome da Quadrilha</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Ex: Os Caixeiros do Planalto"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cidade de Origem / Sede (RS)</label>
                  <input 
                    type="text" 
                    list="cidades-sugeridas-tab"
                    className="form-input"
                    placeholder="Digite ou escolha uma cidade"
                    value={formOrigin}
                    onChange={(e) => setFormOrigin(e.target.value)}
                    required
                  />
                  <datalist id="cidades-sugeridas-tab">
                    {suggestedCities.map(city => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group">
                  <label>Cor no Grafo e Mapa</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input 
                      type="color" 
                      className="form-input"
                      style={{ width: '60px', padding: '4px', height: '40px', cursor: 'pointer' }}
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                    />
                    <span style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{formColor}</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Histórico da Quadrilha / Modus Operandi Geral</label>
                <textarea 
                  className="form-textarea"
                  placeholder="Descreva a atuação, focos de crime preferenciais e ferramentas utilizadas..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{ minHeight: '120px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {modalMode === 'create' ? 'Cadastrar Quadrilha' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
