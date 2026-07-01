import { useState } from 'react';
import { Search, X, Car, Trash2, Edit3, Shield, User, FileText } from 'lucide-react';
import type { Gang, Suspect, Crime, SystemUser, SuspectVehicle } from '../types';

interface NexosState {
  gangs: Gang[];
  suspects: Suspect[];
  crimes: Crime[];
  users: SystemUser[];
  vehicles: SuspectVehicle[];
}

interface VehiclesTabProps {
  db: NexosState;
  onUpdateDb: (newDb: NexosState) => void;
}

export default function VehiclesTab({ db, onUpdateDb }: VehiclesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Estados para formulário
  const [formId, setFormId] = useState('');
  const [formPlate, setFormPlate] = useState('');
  const [formBrandModel, setFormBrandModel] = useState('');
  const [formColor, setFormColor] = useState('');
  const [formGangId, setFormGangId] = useState('');
  const [formSuspectId, setFormSuspectId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPhoto, setFormPhoto] = useState('');

  // Filtrar veículos
  const filteredVehicles = db.vehicles.filter(v => {
    const query = searchQuery.toLowerCase();
    const gangName = db.gangs.find(g => g.id === v.gangId)?.name.toLowerCase() || 'sem quadrilha';
    const suspectName = db.suspects.find(s => s.id === v.suspectId)?.name.toLowerCase() || 'sem motorista';
    
    return (
      v.plate.toLowerCase().includes(query) ||
      v.brandModel.toLowerCase().includes(query) ||
      v.color.toLowerCase().includes(query) ||
      gangName.includes(query) ||
      suspectName.includes(query)
    );
  });

  // Abrir modal de cadastro
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormId(`veh-${Date.now()}`);
    setFormPlate('');
    setFormBrandModel('');
    setFormColor('');
    setFormGangId('');
    setFormSuspectId('');
    setFormDescription('');
    setFormPhoto('');
    setIsModalOpen(true);
  };

  // Abrir modal de edição
  const handleOpenEditModal = (veh: SuspectVehicle) => {
    setModalMode('edit');
    setFormId(veh.id);
    setFormPlate(veh.plate);
    setFormBrandModel(veh.brandModel);
    setFormColor(veh.color);
    setFormGangId(veh.gangId);
    setFormSuspectId(veh.suspectId);
    setFormDescription(veh.description);
    setFormPhoto(veh.photo || '');
    setIsModalOpen(true);
  };

  // Salvar veículo
  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPlate.trim() || !formBrandModel.trim()) {
      return alert('Placa e modelo são obrigatórios!');
    }

    // Normalizar a placa (Sem traços, maiúscula)
    const normalizedPlate = formPlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    let updatedVehicles = [...db.vehicles];

    if (modalMode === 'create') {
      const newVeh: SuspectVehicle = {
        id: formId,
        plate: normalizedPlate,
        brandModel: formBrandModel,
        color: formColor,
        gangId: formGangId,
        suspectId: formSuspectId,
        description: formDescription,
        photo: formPhoto
      };
      updatedVehicles.push(newVeh);
    } else {
      updatedVehicles = updatedVehicles.map(v => {
        if (v.id === formId) {
          return {
            ...v,
            plate: normalizedPlate,
            brandModel: formBrandModel,
            color: formColor,
            gangId: formGangId,
            suspectId: formSuspectId,
            description: formDescription,
            photo: formPhoto
          };
        }
        return v;
      });
    }

    onUpdateDb({
      ...db,
      vehicles: updatedVehicles
    });

    setIsModalOpen(false);
    alert('Veículo salvo com sucesso!');
  };

  // Excluir veículo
  const handleDeleteVehicle = (vehId: string, plate: string) => {
    if (window.confirm(`Tem certeza que deseja remover o veículo de placa ${plate} da lista de suspeitos?`)) {
      onUpdateDb({
        ...db,
        vehicles: db.vehicles.filter(v => v.id !== vehId)
      });
    }
  };

  // Upload da foto do veículo em base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setFormPhoto(base64);
    };
    reader.readAsDataURL(file);
  };

  // Formatar placa para exibição (Coloca o traço se for padrão antigo de 7 dígitos e 3 letras)
  const formatPlate = (plate: string) => {
    const clean = plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (clean.length === 7) {
      // Se o quarto caractere for um número, é padrão antigo (ex: AAA1234 -> AAA-1234)
      // Se for letra, é Mercosul (ex: AAA1A23 -> AAA1A23)
      const isOldPattern = /^[A-Z]{3}[0-9]{4}$/.test(clean);
      if (isOldPattern) {
        return `${clean.slice(0, 3)}-${clean.slice(3)}`;
      }
    }
    return clean;
  };

  return (
    <div className="tab-container">
      {/* Busca e Cadastro */}
      <div className="search-bar-row">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Buscar veículo por placa, modelo, cor, quadrilha ou motorista..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <button className="btn-primary" onClick={handleOpenCreateModal}>
          <Car size={18} />
          <span>Cadastrar Veículo</span>
        </button>
      </div>

      {/* Listagem de Veículos */}
      <div className="glass-panel">
        <div className="glass-panel-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Car className="text-accent" size={18} />
            Veículos Identificados em Ações Suspeitas / Furtos
          </h3>
          <span className="text-xs text-secondary">Frota sob monitoramento</span>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Marca / Modelo / Cor</th>
                <th>Quadrilha Vinculada</th>
                <th>Motorista / Suspeito Associado</th>
                <th>Observações</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map(veh => {
                const gang = db.gangs.find(g => g.id === veh.gangId);
                const suspect = db.suspects.find(s => s.id === veh.suspectId);
                const plateText = formatPlate(veh.plate);

                return (
                  <tr key={veh.id}>
                    <td>
                      {/* Estilo Placa Mercosul Realista */}
                      <div style={{
                        display: 'inline-flex',
                        flexDirection: 'column',
                        border: '2px solid #1e293b',
                        borderRadius: '5px',
                        backgroundColor: '#ffffff',
                        color: '#000000',
                        fontFamily: '"Impact", "Arial Black", sans-serif',
                        fontWeight: 'bold',
                        overflow: 'hidden',
                        width: '115px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
                        userSelect: 'none',
                        borderCollapse: 'separate'
                      }}>
                        <div style={{
                          backgroundColor: '#002f6c', // Azul Mercosul
                          height: '14px',
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.55rem',
                          color: '#ffffff',
                          fontFamily: 'sans-serif',
                          fontWeight: 'bold',
                          letterSpacing: '0.08em',
                          textShadow: '0 1px 1px rgba(0,0,0,0.5)'
                        }}>
                          BRASIL
                        </div>
                        <div style={{
                          fontSize: '1.2rem',
                          textAlign: 'center',
                          padding: '2px 0',
                          letterSpacing: '0.06em',
                          lineHeight: '1.1',
                          textTransform: 'uppercase'
                        }}>
                          {plateText}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {veh.photo ? (
                          <img 
                            src={veh.photo} 
                            alt={veh.brandModel} 
                            style={{ 
                              width: '46px', 
                              height: '46px', 
                              borderRadius: '6px', 
                              objectFit: 'cover', 
                              border: '1.5px solid var(--border-color)',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)' 
                            }}
                          />
                        ) : (
                          <div style={{ 
                            width: '46px', 
                            height: '46px', 
                            borderRadius: '6px', 
                            backgroundColor: 'rgba(255,255,255,0.03)', 
                            border: '1.5px dashed var(--border-color)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}>
                            <Car size={18} className="text-muted" />
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{veh.brandModel}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cor: {veh.color || 'Não informada'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {gang ? (
                        <span 
                          className="badge" 
                          style={{ 
                            backgroundColor: `${gang.color}20`, 
                            color: gang.color,
                            border: `1px solid ${gang.color}40`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Shield size={12} />
                          {gang.name}
                        </span>
                      ) : (
                        <span className="badge" style={{ backgroundColor: '#2e303a', color: '#94a3b8' }}>
                          Nenhum vínculo
                        </span>
                      )}
                    </td>
                    <td>
                      {suspect ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <img 
                            src={suspect.primaryPhoto} 
                            alt={suspect.name} 
                            style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{suspect.name}</span>
                            {suspect.aliases && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>"{suspect.aliases}"</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-secondary" style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} className="text-muted" />
                          Não Identificado
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', maxWidth: '300px' }}>
                        <FileText size={12} className="text-muted" style={{ marginTop: '4px', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {veh.description || 'Sem anotações adicionais.'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          onClick={() => handleOpenEditModal(veh)}
                        >
                          <Edit3 size={12} />
                        </button>
                        <button 
                          className="btn-danger" 
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          onClick={() => handleDeleteVehicle(veh.id, veh.plate)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                    Nenhum veículo registrado no banco de dados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Cadastrar ou Editar Veículo */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="glass-panel-header" style={{ marginBottom: '24px' }}>
              <h2>{modalMode === 'create' ? 'Cadastrar Veículo Suspeito' : 'Editar Dados de Veículo'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle}>
              <div className="form-group">
                <label>Placa do Veículo</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Ex: IPO9281 ou IPO9A21"
                  value={formPlate}
                  onChange={(e) => setFormPlate(e.target.value)}
                  maxLength={8}
                  style={{ textTransform: 'uppercase' }}
                  required
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Padrões aceitos: Mercosul (ABC1D23) ou Antigo (ABC-1234)</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Marca / Modelo</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Ex: VW Gol G5"
                    value={formBrandModel}
                    onChange={(e) => setFormBrandModel(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Cor Predominante</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Ex: Vermelho, Prata, Preto"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quadrilha Vinculada</label>
                  <select 
                    className="form-select"
                    value={formGangId}
                    onChange={(e) => setFormGangId(e.target.value)}
                  >
                    <option value="">Sem Vínculo Específico</option>
                    {db.gangs.map(g => (
                      <option key={g.id} value={g.id}>{g.name} (Origem: {g.originCity})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Motorista / Suspeito Associado</label>
                  <select 
                    className="form-select"
                    value={formSuspectId}
                    onChange={(e) => setFormSuspectId(e.target.value)}
                  >
                    <option value="">Não Identificado / Desconhecido</option>
                    {db.suspects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} {s.aliases ? `("${s.aliases}")` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Foto do Veículo (Opcional)</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {formPhoto ? (
                    <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
                      <img 
                        src={formPhoto} 
                        alt="Preview do veículo" 
                        style={{ width: '100%', height: '100%', borderRadius: '6px', objectFit: 'cover', border: '1.5px solid var(--border-color)' }}
                      />
                      <button 
                        type="button" 
                        onClick={() => setFormPhoto('')}
                        style={{ 
                          position: 'absolute', 
                          top: '-6px', 
                          right: '-6px', 
                          backgroundColor: '#ef4444', 
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: '50%', 
                          width: '18px', 
                          height: '18px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          cursor: 'pointer', 
                          fontSize: '9px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div style={{ 
                      width: '64px', 
                      height: '64px', 
                      borderRadius: '6px', 
                      backgroundColor: 'rgba(255,255,255,0.02)', 
                      border: '1.5px dashed var(--border-color)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Car size={20} className="text-muted" />
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Observações / Ocorrências Vinculadas</label>
                <textarea 
                  className="form-textarea"
                  placeholder="Detalhe onde o veículo foi visto, modus operandi, se possui alertas de furto/roubo..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{ minHeight: '100px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar Veículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
