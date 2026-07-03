import { useState } from 'react';
import { Search, Plus, X, Edit, Trash2, FileWarning, Shield, Car } from 'lucide-react';
import type { Gang, Suspect, Crime, SystemUser, SuspectVehicle } from '../types';
import { CITIES_RS, getCityCoords } from '../utils/mockData';

interface NexosState {
  gangs: Gang[];
  suspects: Suspect[];
  crimes: Crime[];
  users: SystemUser[];
  vehicles: SuspectVehicle[];
}

interface CrimesTabProps {
  db: NexosState;
  onUpdateDb: (newDb: NexosState) => void;
}

export default function CrimesTab({ db, onUpdateDb }: CrimesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Estados para formulário
  const [formId, setFormId] = useState('');
  const [formCrimeNumber, setFormCrimeNumber] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formEstablishment, setFormEstablishment] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formGangId, setFormGangId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStolenValue, setFormStolenValue] = useState('');
  const [formSuspects, setFormSuspects] = useState<string[]>([]);
  const [formVehicles, setFormVehicles] = useState<string[]>([]);

  // Filtros internos no modal para facilidade de associação
  const [suspectSearch, setSuspectSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');

  // Estados para cadastros inline
  const [showAddGangInline, setShowAddGangInline] = useState(false);
  const [newGangName, setNewGangName] = useState('');
  const [newGangOrigin, setNewGangOrigin] = useState('');
  const [newGangColor, setNewGangColor] = useState('#6366f1');

  const [showAddSuspectInline, setShowAddSuspectInline] = useState(false);
  const [newSuspectName, setNewSuspectName] = useState('');
  const [newSuspectAliases, setNewSuspectAliases] = useState('');
  const [newSuspectRg, setNewSuspectRg] = useState('');
  const [newSuspectIsUnidentified, setNewSuspectIsUnidentified] = useState(false);

  const [showAddVehicleInline, setShowAddVehicleInline] = useState(false);
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehicleColor, setNewVehicleColor] = useState('');

  // Filtrar ocorrências na tabela
  const filteredCrimes = db.crimes.filter(c => {
    const query = searchQuery.toLowerCase();
    const gangName = db.gangs.find(g => g.id === c.gangId)?.name.toLowerCase() || 'sem quadrilha';
    const boNumber = c.crimeNumber || '';
    return (
      c.establishment.toLowerCase().includes(query) ||
      c.city.toLowerCase().includes(query) ||
      gangName.includes(query) ||
      boNumber.includes(query)
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

  const resetInlineStates = () => {
    setShowAddGangInline(false);
    setNewGangName('');
    setNewGangOrigin('');
    setNewGangColor('#6366f1');
    setShowAddSuspectInline(false);
    setNewSuspectName('');
    setNewSuspectAliases('');
    setNewSuspectRg('');
    setNewSuspectIsUnidentified(false);
    setShowAddVehicleInline(false);
    setNewVehiclePlate('');
    setNewVehicleModel('');
    setNewVehicleColor('');
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormId(`crime-${Date.now()}`);
    setFormCrimeNumber('');
    setFormDate('');
    setFormEstablishment('');
    setFormCity('');
    setFormAddress('');
    setFormGangId('');
    setFormDescription('');
    setFormStolenValue('');
    setFormSuspects([]);
    setFormVehicles([]);
    setSuspectSearch('');
    setVehicleSearch('');
    resetInlineStates();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (crime: Crime) => {
    setModalMode('edit');
    setFormId(crime.id);
    setFormCrimeNumber(crime.crimeNumber || '');
    setFormDate(crime.date);
    setFormEstablishment(crime.establishment);
    setFormCity(crime.city);
    setFormAddress(crime.address || '');
    setFormGangId(crime.gangId);
    setFormDescription(crime.description || '');
    setFormStolenValue(crime.stolenValue ? String(crime.stolenValue) : '');
    setFormSuspects(crime.suspectsInvolved || []);
    setFormVehicles(crime.vehiclesInvolved || []);
    setSuspectSearch('');
    setVehicleSearch('');
    resetInlineStates();
    setIsModalOpen(true);
  };

  const handleSaveGangInline = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newGangName.trim()) return alert('O nome da quadrilha é obrigatório!');
    const newGang = {
      id: `gang-${Date.now()}`,
      name: newGangName.trim(),
      originCity: newGangOrigin.trim() || 'LAJEADO',
      color: newGangColor,
      description: 'CADASTRADA DE FORMA RÁPIDA VIA OCORRÊNCIA.'
    };
    onUpdateDb({
      ...db,
      gangs: [...db.gangs, newGang]
    });
    setFormGangId(newGang.id);
    setShowAddGangInline(false);
    setNewGangName('');
    setNewGangOrigin('');
    setNewGangColor('#6366f1');
  };

  const handleSaveSuspectInline = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newSuspectName.trim()) return alert('O nome do suspeito é obrigatório!');
    const defaultAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%232a2f3d"/><circle cx="100" cy="80" r="40" fill="%234b5563"/><path d="M40,160 C40,120 160,120 160,160 Z" fill="%234b5563"/></svg>`;
    const newSuspect = {
      id: `susp-${Date.now()}`,
      name: newSuspectName.trim(),
      rg: newSuspectRg.trim(),
      aliases: newSuspectAliases.trim(),
      primaryPhoto: defaultAvatar,
      photos: [],
      gangId: formGangId || '',
      criminalRecord: 'SEM ANTECEDENTES RELATADOS.',
      status: 'active' as const,
      isUnidentified: newSuspectIsUnidentified
    };
    onUpdateDb({
      ...db,
      suspects: [...db.suspects, newSuspect]
    });
    setFormSuspects([...formSuspects, newSuspect.id]);
    setShowAddSuspectInline(false);
    setNewSuspectName('');
    setNewSuspectAliases('');
    setNewSuspectRg('');
    setNewSuspectIsUnidentified(false);
  };

  const handleSaveVehicleInline = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newVehiclePlate.trim() || !newVehicleModel.trim()) {
      return alert('Placa e Modelo são obrigatórios!');
    }
    const newVehicle = {
      id: `veh-${Date.now()}`,
      plate: newVehiclePlate.trim(),
      brandModel: newVehicleModel.trim(),
      color: newVehicleColor.trim() || 'NÃO INFORMADA',
      gangId: formGangId || '',
      suspectId: '',
      description: 'CADASTRADO DE FORMA RÁPIDA VIA OCORRÊNCIA.'
    };
    onUpdateDb({
      ...db,
      vehicles: [...db.vehicles, newVehicle]
    });
    setFormVehicles([...formVehicles, newVehicle.id]);
    setShowAddVehicleInline(false);
    setNewVehiclePlate('');
    setNewVehicleModel('');
    setNewVehicleColor('');
  };

  const handleSaveCrime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEstablishment.trim() || !formCity.trim() || !formDate.trim()) {
      return alert('Data, Estabelecimento e Cidade são obrigatórios!');
    }

    // Calcula coordenadas automaticamente baseado na cidade
    const coords = getCityCoords(formCity);

    const newCrime: Crime = {
      id: formId,
      crimeNumber: formCrimeNumber.trim() || undefined,
      date: formDate,
      establishment: formEstablishment,
      city: formCity,
      address: formAddress,
      gangId: formGangId,
      suspectsInvolved: formSuspects,
      vehiclesInvolved: formVehicles,
      description: formDescription || 'Sem detalhes fornecidos.',
      coordinates: coords,
      stolenValue: formStolenValue ? parseFloat(formStolenValue) : undefined
    };

    let updatedCrimes = [...db.crimes];
    if (modalMode === 'create') {
      updatedCrimes.push(newCrime);
    } else {
      updatedCrimes = updatedCrimes.map(c => c.id === formId ? newCrime : c);
    }

    onUpdateDb({
      ...db,
      crimes: updatedCrimes
    });

    setIsModalOpen(false);
    alert(modalMode === 'create' ? 'Ocorrência cadastrada com sucesso!' : 'Ocorrência atualizada com sucesso!');
  };

  const handleDeleteCrime = (crimeId: string, establishment: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a ocorrência de "${establishment}"?`)) {
      onUpdateDb({
        ...db,
        crimes: db.crimes.filter(c => c.id !== crimeId)
      });
    }
  };

  // Listar suspeitos que batem com a busca ou que já estão selecionados
  const getFilteredSuspects = () => {
    const search = suspectSearch.toLowerCase();
    return db.suspects.filter(s => 
      formSuspects.includes(s.id) ||
      s.name.toLowerCase().includes(search) ||
      s.aliases.toLowerCase().includes(search) ||
      s.rg.includes(search)
    );
  };

  // Listar veículos que batem com a busca ou que já estão selecionados
  const getFilteredVehicles = () => {
    const search = vehicleSearch.toLowerCase();
    return db.vehicles.filter(v => 
      formVehicles.includes(v.id) ||
      v.plate.toLowerCase().includes(search) ||
      v.brandModel.toLowerCase().includes(search)
    );
  };

  return (
    <div className="tab-container">
      {/* Busca e Botão Novo */}
      <div className="search-bar-row">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por BO, estabelecimento, cidade ou quadrilha..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <button className="btn-primary" onClick={handleOpenCreateModal}>
          <Plus size={18} />
          <span>Cadastrar Ocorrência</span>
        </button>
      </div>

      {/* Tabela de Ocorrências */}
      <div className="glass-panel">
        <div className="glass-panel-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileWarning className="text-accent" size={18} />
            Ocorrências de Furtos Cadastradas
          </h3>
          <span className="text-xs text-secondary">{filteredCrimes.length} registros</span>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Nº Ocorrência (BO)</th>
                <th>Data</th>
                <th>Estabelecimento Alvo</th>
                <th>Cidade</th>
                <th>Quadrilha Suspeita</th>
                <th>Vínculos</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCrimes
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(crime => {
                  const gang = db.gangs.find(g => g.id === crime.gangId);
                  const suspectsCount = crime.suspectsInvolved.length;
                  const vehiclesCount = crime.vehiclesInvolved?.length || 0;

                  return (
                    <tr key={crime.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {crime.crimeNumber || 'Não informado'}
                        </span>
                      </td>
                      <td>
                        {new Date(crime.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td style={{ fontWeight: 600 }}>{crime.establishment}</td>
                      <td>{crime.city}</td>
                      <td>
                        {gang ? (
                          <span className="badge" style={{ backgroundColor: `${gang.color}20`, color: gang.color, border: `1px solid ${gang.color}30` }}>
                            {gang.name}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Sem Quadrilha</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }} title="Suspeitos vinculados">
                            <Shield size={10} style={{ marginRight: '4px' }} /> {suspectsCount}
                          </span>
                          <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }} title="Veículos vinculados">
                            <Car size={10} style={{ marginRight: '4px' }} /> {vehiclesCount}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                            onClick={() => handleOpenEditModal(crime)}
                          >
                            <Edit size={12} />
                            <span>Editar</span>
                          </button>
                          <button 
                            className="btn-danger" 
                            style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                            onClick={() => handleDeleteCrime(crime.id, crime.establishment)}
                          >
                            <Trash2 size={12} />
                            <span>Remover</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {filteredCrimes.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                    Nenhuma ocorrência encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Cadastro/Edição de Ocorrência */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="glass-panel-header" style={{ marginBottom: '24px' }}>
              <h2>{modalMode === 'create' ? 'Cadastrar Nova Ocorrência' : 'Editar Cadastro da Ocorrência'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveCrime} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Número da Ocorrência (BO)</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Ex: 100560/2026"
                    value={formCrimeNumber}
                    onChange={(e) => setFormCrimeNumber(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Data do Fato</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Estabelecimento Comercial Alvo</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Ex: Lojas Colombo"
                    value={formEstablishment}
                    onChange={(e) => setFormEstablishment(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Cidade (RS)</label>
                  <input 
                    type="text" 
                    list="cidades-sugeridas-crimes"
                    className="form-input"
                    placeholder="Digite ou escolha uma cidade"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    required
                  />
                  <datalist id="cidades-sugeridas-crimes">
                    {suggestedCities.map(city => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Endereço / Referência do Local</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Ex: Av. Brasil, 120"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Prejuízo Estimado (R$)</label>
                  <input 
                    type="number" 
                    className="form-input"
                    placeholder="Ex: 15000"
                    value={formStolenValue}
                    onChange={(e) => setFormStolenValue(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ marginBottom: 0 }}>Quadrilha Especializada Suspeita</label>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ padding: '2px 8px', fontSize: '0.75rem', height: 'auto' }}
                    onClick={() => setShowAddGangInline(!showAddGangInline)}
                  >
                    {showAddGangInline ? '✕ Fechar' : '+ Nova Quadrilha'}
                  </button>
                </div>
                {!showAddGangInline ? (
                  <select 
                    className="form-select"
                    value={formGangId}
                    onChange={(e) => setFormGangId(e.target.value)}
                  >
                    <option value="">Nenhuma / Sem Quadrilha Definida (Independente)</option>
                    {db.gangs.map(g => (
                      <option key={g.id} value={g.id}>{g.name} (Sede: {g.originCity})</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ padding: '12px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)' }}>CADASTRAR QUADRILHA INLINE</span>
                    <div className="form-group">
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Nome da Quadrilha" 
                        value={newGangName} 
                        onChange={e => setNewGangName(e.target.value)} 
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Cidade Sede (Ex: Porto Alegre)" 
                        value={newGangOrigin} 
                        onChange={e => setNewGangOrigin(e.target.value)} 
                        style={{ flex: 2 }}
                      />
                      <input 
                        type="color" 
                        className="form-input" 
                        value={newGangColor} 
                        onChange={e => setNewGangColor(e.target.value)} 
                        style={{ flex: 1, padding: '4px', height: '40px', cursor: 'pointer' }} 
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setShowAddGangInline(false)}>Cancelar</button>
                      <button type="button" className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem', backgroundColor: 'var(--accent)' }} onClick={handleSaveGangInline}>Salvar</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Vínculo Múltiplo de Suspeitos */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ marginBottom: 0 }}>Vincular Suspeitos Relacionados</label>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ padding: '2px 8px', fontSize: '0.75rem', height: 'auto' }}
                    onClick={() => setShowAddSuspectInline(!showAddSuspectInline)}
                  >
                    {showAddSuspectInline ? '✕ Fechar' : '+ Novo Suspeito'}
                  </button>
                </div>
                {showAddSuspectInline ? (
                  <div style={{ padding: '12px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)' }}>CADASTRAR SUSPEITO INLINE</span>
                    <div className="form-group">
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Nome Completo do Suspeito" 
                        value={newSuspectName} 
                        onChange={e => setNewSuspectName(e.target.value)} 
                      />
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '-4px' }}>
                      <input 
                        type="checkbox" 
                        id="newSuspectIsUnidentified" 
                        checked={newSuspectIsUnidentified} 
                        onChange={e => {
                          setNewSuspectIsUnidentified(e.target.checked);
                          if (e.target.checked) {
                            setNewSuspectName(`DESCONHECIDO - ${String(Date.now()).slice(-6).toUpperCase()}`);
                          } else {
                            setNewSuspectName('');
                          }
                        }} 
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <label htmlFor="newSuspectIsUnidentified" style={{ marginBottom: 0, fontSize: '0.8rem', cursor: 'pointer' }}>Ainda não identificado (Desconhecido)</label>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="RG (Opcional)" 
                        value={newSuspectRg} 
                        onChange={e => setNewSuspectRg(e.target.value)} 
                      />
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Apelidos (Opcional)" 
                        value={newSuspectAliases} 
                        onChange={e => setNewSuspectAliases(e.target.value)} 
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setShowAddSuspectInline(false)}>Cancelar</button>
                      <button type="button" className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem', backgroundColor: 'var(--accent)' }} onClick={handleSaveSuspectInline}>Salvar</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <Search size={16} className="text-muted" style={{ alignSelf: 'center' }} />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Filtrar suspeitos por nome, vulgo ou RG..." 
                      value={suspectSearch}
                      onChange={e => setSuspectSearch(e.target.value)}
                    />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '140px', overflowY: 'auto', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                  {getFilteredSuspects().map(suspect => (
                    <label key={suspect.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input 
                        type="checkbox" 
                        checked={formSuspects.includes(suspect.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormSuspects([...formSuspects, suspect.id]);
                          } else {
                            setFormSuspects(formSuspects.filter(id => id !== suspect.id));
                          }
                        }}
                      />
                      <span>{suspect.name} {suspect.aliases ? `("${suspect.aliases}")` : ''} - RG: {suspect.rg || 'Não informado'}</span>
                    </label>
                  ))}
                  {getFilteredSuspects().length === 0 && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nenhum suspeito encontrado.</span>
                  )}
                </div>
              </div>

              {/* Vínculo Múltiplo de Veículos */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ marginBottom: 0 }}>Vincular Veículos Suspeitos</label>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ padding: '2px 8px', fontSize: '0.75rem', height: 'auto' }}
                    onClick={() => setShowAddVehicleInline(!showAddVehicleInline)}
                  >
                    {showAddVehicleInline ? '✕ Fechar' : '+ Novo Veículo'}
                  </button>
                </div>
                {showAddVehicleInline ? (
                  <div style={{ padding: '12px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)' }}>CADASTRAR VEÍCULO INLINE</span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Placa" 
                        value={newVehiclePlate} 
                        onChange={e => setNewVehiclePlate(e.target.value)} 
                        style={{ flex: 1 }}
                      />
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Modelo (Ex: VW Gol)" 
                        value={newVehicleModel} 
                        onChange={e => setNewVehicleModel(e.target.value)} 
                        style={{ flex: 2 }}
                      />
                    </div>
                    <div className="form-group">
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Cor (Ex: Prata)" 
                        value={newVehicleColor} 
                        onChange={e => setNewVehicleColor(e.target.value)} 
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setShowAddVehicleInline(false)}>Cancelar</button>
                      <button type="button" className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem', backgroundColor: 'var(--accent)' }} onClick={handleSaveVehicleInline}>Salvar</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <Search size={16} className="text-muted" style={{ alignSelf: 'center' }} />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Filtrar veículos por placa ou modelo..." 
                      value={vehicleSearch}
                      onChange={e => setVehicleSearch(e.target.value)}
                    />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '140px', overflowY: 'auto', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                  {getFilteredVehicles().map(veh => (
                    <label key={veh.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input 
                        type="checkbox" 
                        checked={formVehicles.includes(veh.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormVehicles([...formVehicles, veh.id]);
                          } else {
                            setFormVehicles(formVehicles.filter(id => id !== veh.id));
                          }
                        }}
                      />
                      <span>{veh.plate} ({veh.brandModel} - {veh.color})</span>
                    </label>
                  ))}
                  {getFilteredVehicles().length === 0 && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nenhum veículo encontrado.</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Descrição do Fato / Relato Narrativo</label>
                <textarea 
                  className="form-textarea"
                  placeholder="Relatório ou observações adicionais..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {modalMode === 'create' ? 'Cadastrar Ocorrência' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
