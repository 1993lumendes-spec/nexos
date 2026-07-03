import { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  X, 
  Image as ImageIcon, 
  Trash2, 
  Edit3, 
  FileText, 
  AlertTriangle,
  Upload,
  CheckCircle
} from 'lucide-react';
import type { Gang, Suspect, Crime, SystemUser, SuspectVehicle } from '../types';

const DEFAULT_CRIME_TYPES = [
  'Furto',
  'Furto Qualificado',
  'Roubo',
  'Roubo Majorado',
  'Tráfico de Drogas',
  'Associação para o Tráfico',
  'Receptação',
  'Homicídio',
  'Tentativa de Homicídio',
  'Porte Ilegal de Arma de Fogo',
  'Posse de Arma de Fogo',
  'Associação Criminosa',
  'Estelionato',
  'Corrupção de Menores',
  'Lesão Corporal',
  'Ameaça',
  'Desobediência',
  'Resistência'
];

interface NexosState {
  gangs: Gang[];
  suspects: Suspect[];
  crimes: Crime[];
  users: SystemUser[];
  vehicles: SuspectVehicle[];
}

interface SuspectsTabProps {
  db: NexosState;
  onUpdateDb: (newDb: NexosState) => void;
}

export default function SuspectsTab({ db, onUpdateDb }: SuspectsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSuspect, setSelectedSuspect] = useState<Suspect | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [cardSize, setCardSize] = useState<'small' | 'medium' | 'large'>('medium');
  
  // Estados para filtros avançados
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterGangId, setFilterGangId] = useState<string>('');
  const [filterCrimeId, setFilterCrimeId] = useState<string>('');
  const [filterCity, setFilterCity] = useState<string>('');
  
  // Estado para ocorrências selecionadas no modal
  const [formCrimes, setFormCrimes] = useState<string[]>([]);
  
  // Estados para o seletor de crimes rápidos nos antecedentes
  const [selectedRecordCrime, setSelectedRecordCrime] = useState('');
  
  // Estados para formulário de cadastro/edição
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formIsUnidentified, setFormIsUnidentified] = useState(false);
  const [formRg, setFormRg] = useState('');
  const [formAliases, setFormAliases] = useState('');
  const [formGangId, setFormGangId] = useState('');
  const [formCriminalRecord, setFormCriminalRecord] = useState('');
  const [formModusOperandi, setFormModusOperandi] = useState('');
  const [formStatus, setFormStatus] = useState<Suspect['status']>('active');
  const [formBirthDate, setFormBirthDate] = useState('');

  // Estados para upload de fotos adicionais
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newPhotoDesc, setNewPhotoDesc] = useState('');
  const [newPhotoLoc, setNewPhotoLoc] = useState('');
  const [newPhotoDate, setNewPhotoDate] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Escutar evento do Dashboard para abrir a ficha de um suspeito específico
  useEffect(() => {
    const handleSelectSuspect = (e: Event) => {
      const suspectId = (e as CustomEvent).detail;
      const suspect = db.suspects.find(s => s.id === suspectId);
      if (suspect) {
        setSelectedSuspect(suspect);
      }
    };

    window.addEventListener('select-suspect', handleSelectSuspect);
    return () => {
      window.removeEventListener('select-suspect', handleSelectSuspect);
    };
  }, [db.suspects]);

  // Filtrar suspeitos com base na busca e filtros avançados
  const filteredSuspects = db.suspects.filter(s => {
    const query = searchQuery.toLowerCase();
    const gang = db.gangs.find(g => g.id === s.gangId);
    const gangName = gang?.name.toLowerCase() || 'sem quadrilha';
    const gangOriginCity = gang?.originCity || '';
    
    // Match busca textual
    const matchesSearch = s.name.toLowerCase().includes(query) ||
      s.rg.includes(query) ||
      s.aliases.toLowerCase().includes(query) ||
      gangName.includes(query);
      
    // Match status operacional
    const matchesStatus = !filterStatus || s.status === filterStatus;
    
    // Match quadrilha
    const matchesGang = !filterGangId || s.gangId === filterGangId;
    
    // Match ocorrência vinculada
    const matchesCrime = !filterCrimeId || db.crimes.some(c => c.id === filterCrimeId && c.suspectsInvolved.includes(s.id));
    
    // Match cidade de origem da quadrilha
    const matchesCity = !filterCity || gangOriginCity.toLowerCase() === filterCity.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesGang && matchesCrime && matchesCity;
  });

  const getSuggestedCrimes = () => {
    const list = new Set(DEFAULT_CRIME_TYPES);
    
    // Extrai crimes já cadastrados nos antecedentes dos suspeitos
    db.suspects.forEach(s => {
      if (!s.criminalRecord) return;
      const lines = s.criminalRecord.split('\n');
      lines.forEach(line => {
        let clean = line.replace(/^[-*•\s]+/, '').trim();
        clean = clean.replace(/\s*[-–]?\s*\d+\s*x\s*$/i, '').trim();
        if (clean && clean.length > 2 && clean.length < 50) {
          list.add(clean);
        }
      });
    });
    
    return Array.from(list).sort();
  };

  // Abrir modal para novo cadastro
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormId(`susp-${Date.now()}`);
    setFormName('');
    setFormRg('');
    setFormAliases('');
    setFormGangId('');
    setFormCriminalRecord('');
    setFormModusOperandi('');
    setFormStatus('active');
    setFormBirthDate('');
    setFormCrimes([]);
    setSelectedRecordCrime('');
    setFormIsUnidentified(false);
    setIsModalOpen(true);
  };

  // Abrir modal para editar cadastro existente
  const handleOpenEditModal = (suspect: Suspect) => {
    setModalMode('edit');
    setFormId(suspect.id);
    setFormName(suspect.name);
    setFormRg(suspect.rg);
    setFormAliases(suspect.aliases);
    setFormGangId(suspect.gangId);
    setFormCriminalRecord(suspect.criminalRecord);
    setFormModusOperandi(suspect.modusOperandi || '');
    setFormStatus(suspect.status);
    setFormBirthDate(suspect.birthDate || '');
    
    // Puxa ocorrências que já possuem esse suspeito na lista suspectsInvolved
    const linkedCrimes = db.crimes
      .filter(c => c.suspectsInvolved.includes(suspect.id))
      .map(c => c.id);
    setFormCrimes(linkedCrimes);
    setSelectedRecordCrime('');
    setFormIsUnidentified(suspect.isUnidentified || false);
    
    setIsModalOpen(true);
  };

  // Salvar formulário (Criar ou Editar)
  const handleSaveSuspect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return alert('O nome é obrigatório!');

    let updatedSuspects = [...db.suspects];

    if (modalMode === 'create') {
      const defaultAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%232a2f3d"/><circle cx="100" cy="80" r="40" fill="%234b5563"/><path d="M40,160 C40,120 160,120 160,160 Z" fill="%234b5563"/></svg>`;
      const newSuspect: Suspect = {
        id: formId,
        name: formName,
        rg: formRg,
        aliases: formAliases,
        primaryPhoto: defaultAvatar,
        photos: [],
        gangId: formGangId,
        criminalRecord: formCriminalRecord,
        status: formStatus,
        birthDate: formBirthDate,
        modusOperandi: formModusOperandi,
        isUnidentified: formIsUnidentified
      };
      updatedSuspects.push(newSuspect);
      setSelectedSuspect(newSuspect); // Abre a ficha do suspeito cadastrado
    } else {
      updatedSuspects = updatedSuspects.map(s => {
        if (s.id === formId) {
          const updated = {
            ...s,
            name: formName,
            rg: formRg,
            aliases: formAliases,
            gangId: formGangId,
            criminalRecord: formCriminalRecord,
            status: formStatus,
            birthDate: formBirthDate,
            modusOperandi: formModusOperandi,
            isUnidentified: formIsUnidentified
          };
          if (selectedSuspect?.id === formId) {
            setSelectedSuspect(updated);
          }
          return updated;
        }
        return s;
      });
    }

    // Sincroniza vínculos de crimes no banco de dados central
    const updatedCrimes = db.crimes.map(crime => {
      const isChecked = formCrimes.includes(crime.id);
      const hasSuspect = crime.suspectsInvolved.includes(formId);
      
      if (isChecked && !hasSuspect) {
        return { ...crime, suspectsInvolved: [...crime.suspectsInvolved, formId] };
      } else if (!isChecked && hasSuspect) {
        return { ...crime, suspectsInvolved: crime.suspectsInvolved.filter(id => id !== formId) };
      }
      return crime;
    });

    onUpdateDb({
      ...db,
      suspects: updatedSuspects,
      crimes: updatedCrimes
    });
    setIsModalOpen(false);
  };

  // Excluir Suspeito
  const handleDeleteSuspect = (suspectId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir permanentemente este suspeito do banco de dados?')) return;
    
    const updatedSuspects = db.suspects.filter(s => s.id !== suspectId);
    
    // Opcionalmente limpa referências em crimes
    const updatedCrimes = db.crimes.map(c => ({
      ...c,
      suspectsInvolved: c.suspectsInvolved.filter(id => id !== suspectId)
    }));

    onUpdateDb({
      ...db,
      suspects: updatedSuspects,
      crimes: updatedCrimes
    });

    setSelectedSuspect(null);
  };

  // Adicionar Foto Adicional ao Suspeito (Conversão base64 local)
  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoFile || !selectedSuspect) return;

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      const newPhoto = {
        id: `photo-${Date.now()}`,
        url: base64Url,
        description: newPhotoDesc || 'Sem descrição',
        location: newPhotoLoc || 'Não informada',
        date: newPhotoDate || ''
      };

      const updatedSuspects = db.suspects.map(s => {
        if (s.id === selectedSuspect.id) {
          const updated = {
            ...s,
            photos: [...s.photos, newPhoto]
          };
          // Se for a primeira foto cadastrada, define automaticamente como principal
          if (s.primaryPhoto.includes('data:image/svg+xml') && s.photos.length === 0) {
            updated.primaryPhoto = base64Url;
          }
          setSelectedSuspect(updated);
          return updated;
        }
        return s;
      });

      onUpdateDb({
        ...db,
        suspects: updatedSuspects
      });

      // Limpar campos
      setNewPhotoFile(null);
      setNewPhotoDesc('');
      setNewPhotoLoc('');
      setNewPhotoDate('');
      setIsUploadingPhoto(false);
    };
    reader.readAsDataURL(newPhotoFile);
  };

  // Definir uma foto da galeria como a Principal
  const handleSetPrimaryPhoto = (photoUrl: string) => {
    if (!selectedSuspect) return;

    const updatedSuspects = db.suspects.map(s => {
      if (s.id === selectedSuspect.id) {
        const updated = {
          ...s,
          primaryPhoto: photoUrl
        };
        setSelectedSuspect(updated);
        return updated;
      }
      return s;
    });

    onUpdateDb({
      ...db,
      suspects: updatedSuspects
    });
  };

  // Excluir foto da galeria
  const handleDeletePhoto = (photoId: string) => {
    if (!selectedSuspect || !window.confirm('Excluir esta foto?')) return;

    const updatedSuspects = db.suspects.map(s => {
      if (s.id === selectedSuspect.id) {
        const updatedPhotos = s.photos.filter(p => p.id !== photoId);
        const photoToDelete = s.photos.find(p => p.id === photoId);
        
        let newPrimary = s.primaryPhoto;
        // Se a foto apagada era a principal, muda para a próxima foto ou para o avatar padrão
        if (photoToDelete && s.primaryPhoto === photoToDelete.url) {
          newPrimary = updatedPhotos.length > 0 
            ? updatedPhotos[0].url 
            : `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%232a2f3d"/><circle cx="100" cy="80" r="40" fill="%234b5563"/><path d="M40,160 C40,120 160,120 160,160 Z" fill="%234b5563"/></svg>`;
        }

        const updated = {
          ...s,
          photos: updatedPhotos,
          primaryPhoto: newPrimary
        };
        setSelectedSuspect(updated);
        return updated;
      }
      return s;
    });

    onUpdateDb({
      ...db,
      suspects: updatedSuspects
    });
  };

  const getStatusBadge = (status: Suspect['status']) => {
    switch (status) {
      case 'active':
        return <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>Ativo</span>;
      case 'arrested':
        return <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>Preso</span>;
      case 'investigating':
        return <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}>Investigando</span>;
    }
  };

  const getGridMinMax = () => {
    if (cardSize === 'small') return '200px';
    if (cardSize === 'large') return '380px';
    return '280px';
  };



  return (
    <div className="tab-container">
      {/* Barra de Busca e Botão de Cadastro */}
      <div className="search-bar-row">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome, RG, apelido ou quadrilha..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Seletor de tamanho das fotos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', height: '42px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fotos:</span>
          <button 
            type="button" 
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.75rem', border: 'none', minWidth: '32px', backgroundColor: cardSize === 'small' ? 'var(--accent)' : 'transparent', color: cardSize === 'small' ? 'white' : 'var(--text-secondary)', cursor: 'pointer' }}
            onClick={() => setCardSize('small')}
          >
            P
          </button>
          <button 
            type="button" 
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.75rem', border: 'none', minWidth: '32px', backgroundColor: cardSize === 'medium' ? 'var(--accent)' : 'transparent', color: cardSize === 'medium' ? 'white' : 'var(--text-secondary)', cursor: 'pointer' }}
            onClick={() => setCardSize('medium')}
          >
            M
          </button>
          <button 
            type="button" 
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.75rem', border: 'none', minWidth: '32px', backgroundColor: cardSize === 'large' ? 'var(--accent)' : 'transparent', color: cardSize === 'large' ? 'white' : 'var(--text-secondary)', cursor: 'pointer' }}
            onClick={() => setCardSize('large')}
          >
            G
          </button>
        </div>
        
        <button className="btn-primary" onClick={handleOpenCreateModal}>
          <UserPlus size={18} />
          <span>Cadastrar Suspeito</span>
        </button>
      </div>

      {/* Filtros Avançados */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px', backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        {/* Filtro Status */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>Status Operacional</label>
          <select className="form-select" style={{ padding: '6px 10px', fontSize: '0.85rem' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos os Status</option>
            <option value="active">Somente Ativos</option>
            <option value="arrested">Somente Presos</option>
            <option value="investigating">Somente em Investigação</option>
          </select>
        </div>
        
        {/* Filtro Quadrilha */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>Quadrilha</label>
          <select className="form-select" style={{ padding: '6px 10px', fontSize: '0.85rem' }} value={filterGangId} onChange={e => setFilterGangId(e.target.value)}>
            <option value="">Todas as Quadrilhas</option>
            {db.gangs.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        {/* Filtro Ocorrência */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>Ocorrência Vinculada</label>
          <select className="form-select" style={{ padding: '6px 10px', fontSize: '0.85rem' }} value={filterCrimeId} onChange={e => setFilterCrimeId(e.target.value)}>
            <option value="">Todas as Ocorrências</option>
            {db.crimes.map(c => (
              <option key={c.id} value={c.id}>[{new Date(c.date + 'T00:00:00').toLocaleDateString('pt-BR')}] {c.establishment}</option>
            ))}
          </select>
        </div>

        {/* Filtro Cidade de Origem da Quadrilha */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>Cidade de Origem (Quadrilha)</label>
          <select className="form-select" style={{ padding: '6px 10px', fontSize: '0.85rem' }} value={filterCity} onChange={e => setFilterCity(e.target.value)}>
            <option value="">Todas as Cidades</option>
            {Array.from(new Set(db.gangs.map(g => g.originCity))).filter(Boolean).sort().map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Suspeitos */}
      <div className="suspects-grid" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${getGridMinMax()}, 1fr))` }}>
        {filteredSuspects.map(suspect => {
          const gang = db.gangs.find(g => g.id === suspect.gangId);
          const crimesCount = db.crimes.filter(c => c.suspectsInvolved.includes(suspect.id)).length;
          const isUnidentified = suspect.isUnidentified || suspect.name.toUpperCase().startsWith('DESCONHECIDO');
          
          return (
            <div 
              key={suspect.id} 
              className="suspect-card"
              onClick={() => setSelectedSuspect(suspect)}
              style={isUnidentified ? {
                border: '1.5px dashed var(--warning)',
                backgroundColor: 'rgba(245, 158, 11, 0.03)',
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.05)'
              } : undefined}
            >
              <div style={{ position: 'relative' }}>
                <img 
                  src={suspect.primaryPhoto} 
                  alt={suspect.name} 
                  className="suspect-card-image"
                  style={{ aspectRatio: '3/4', objectFit: 'cover', display: 'block', width: '100%' }}
                />
                {isUnidentified && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    backgroundColor: 'var(--warning)',
                    color: '#000',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    letterSpacing: '0.05em',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    pointerEvents: 'none'
                  }}>
                    NÃO IDENTIFICADO
                  </div>
                )}
              </div>
              <div className="suspect-card-content">
                <div className="suspect-card-header">
                  <div>
                    <h3 style={{ fontSize: '1rem' }}>{suspect.name}</h3>
                    {suspect.aliases && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>"{suspect.aliases}"</p>
                    )}
                  </div>
                  {getStatusBadge(suspect.status)}
                </div>

                <div style={{ marginTop: '4px' }}>
                  <div className="suspect-info-row">
                    <span>RG:</span>
                    <span>{suspect.rg || 'Não informado'}</span>
                  </div>
                  <div className="suspect-info-row">
                    <span>Quadrilha:</span>
                    <span style={{ color: gang?.color, fontWeight: gang ? '600' : 'normal' }}>
                      {gang ? gang.name : 'Independente'}
                    </span>
                  </div>
                  <div className="suspect-info-row">
                    <span>Furtos Relacionados:</span>
                    <span>{crimesCount} ocorrências</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredSuspects.length === 0 && (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            <p className="text-secondary">Nenhum suspeito encontrado com os termos digitados.</p>
          </div>
        )}
      </div>

      {/* Drawer: Ficha Criminal Completa do Suspeito Selecionado */}
      {selectedSuspect && (
        <div className="modal-backdrop" onClick={() => setSelectedSuspect(null)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <span className="text-xs text-muted">FICHA DE INVESTIGAÇÃO</span>
                <h2 style={{ fontSize: '1.4rem' }}>{selectedSuspect.name}</h2>
              </div>
              <button className="close-btn" onClick={() => setSelectedSuspect(null)}>
                <X size={24} />
              </button>
            </div>

            <div className="drawer-body">
              {/* Informações Básicas e Foto Principal */}
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '20px', alignItems: 'start' }}>
                <img 
                  src={selectedSuspect.primaryPhoto} 
                  alt={selectedSuspect.name} 
                  style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                />
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {getStatusBadge(selectedSuspect.status)}
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Nascimento: {selectedSuspect.birthDate ? new Date(selectedSuspect.birthDate).toLocaleDateString('pt-BR') : 'Não cadastrado'}
                    </span>
                  </div>
                  
                  <p><b>Apelidos:</b> {selectedSuspect.aliases || 'Nenhum'}</p>
                  <p><b>RG:</b> {selectedSuspect.rg || 'Não cadastrado'}</p>
                  <p>
                    <b>Quadrilha:</b>{' '}
                    <span style={{ color: db.gangs.find(g => g.id === selectedSuspect.gangId)?.color, fontWeight: 'bold' }}>
                      {db.gangs.find(g => g.id === selectedSuspect.gangId)?.name || 'Sem vínculo/Independente'}
                    </span>
                  </p>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleOpenEditModal(selectedSuspect)}>
                      <Edit3 size={14} />
                      Editar Ficha
                    </button>
                    <button className="btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleDeleteSuspect(selectedSuspect.id)}>
                      <Trash2 size={14} />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>

              {/* Antecedentes Criminais */}
              <div className="glass-panel" style={{ padding: '16px' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <FileText size={16} className="text-accent" />
                  Antecedentes Criminais (RS)
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                  {selectedSuspect.criminalRecord || 'Sem antecedentes relatados.'}
                </p>
              </div>

              {/* Modus Operandi */}
              <div className="glass-panel" style={{ padding: '16px' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <AlertTriangle size={16} className="text-warning" />
                  Modus Operandi / Comportamento
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                  {selectedSuspect.modusOperandi || 'Modus operandi não detalhado.'}
                </p>
              </div>

              {/* Galeria de Fotos e Cadastro de Novas Fotos */}
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                  Fotos Associadas / Registros Fotográficos
                </h3>

                {/* Grid Galeria */}
                <div className="photo-gallery-grid" style={{ marginBottom: '20px' }}>
                  {selectedSuspect.photos.map(photo => (
                    <div key={photo.id} className="photo-gallery-item">
                      <img src={photo.url} alt={photo.description} />
                      {selectedSuspect.primaryPhoto === photo.url && (
                        <span className="photo-gallery-badge">Capa</span>
                      )}
                      
                      <div className="photo-gallery-info">
                        <p style={{ fontWeight: 'bold' }}>{photo.location} {photo.date ? ` - ${new Date(photo.date + 'T00:00:00').toLocaleDateString('pt-BR')}` : ''}</p>
                        <p style={{ fontSize: '0.65rem', opacity: 0.8 }}>Origem: {photo.description}</p>
                      </div>

                      {/* Ações Rápidas na Foto */}
                      <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                        {selectedSuspect.primaryPhoto !== photo.url && (
                          <button 
                            style={{ padding: '4px', backgroundColor: 'rgba(16, 185, 129, 0.9)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            onClick={() => handleSetPrimaryPhoto(photo.url)}
                            title="Definir como foto principal"
                          >
                            <CheckCircle size={12} />
                          </button>
                        )}
                        <button 
                          style={{ padding: '4px', backgroundColor: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          onClick={() => handleDeletePhoto(photo.id)}
                          title="Excluir foto"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {selectedSuspect.photos.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Nenhuma foto adicional cadastrada. Use o formulário abaixo para enviar fotos de câmeras ou flagrantes.
                    </div>
                  )}
                </div>

                {/* Form Adicionar Foto */}
                <form onSubmit={handleAddPhoto} className="glass-panel" style={{ padding: '16px' }}>
                  <h4 style={{ fontSize: '0.85rem', marginBottom: '12px' }}>Vincular Nova Foto / Evidência Visual</h4>
                  
                  <div className="form-group">
                    <label>Arquivo de Imagem</label>
                    <div className="file-input-wrapper form-input" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', cursor: 'pointer' }}>
                      <Upload size={16} />
                      <span style={{ fontSize: '0.8rem' }}>
                        {newPhotoFile ? newPhotoFile.name : 'Selecionar Imagem do Computador'}
                      </span>
                      <input 
                        type="file" 
                        accept="image/*"
                        required
                        onChange={(e) => setNewPhotoFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>

                  <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                    <div className="form-group">
                      <label>Data do Fato</label>
                      <input 
                        type="date" 
                        className="form-input"
                        value={newPhotoDate}
                        onChange={(e) => setNewPhotoDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Cidade (Campo Livre)</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Passo Fundo"
                        className="form-input"
                        value={newPhotoLoc}
                        onChange={(e) => setNewPhotoLoc(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Origem (Campo Livre)</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Câmera Panvel"
                        className="form-input"
                        value={newPhotoDesc}
                        onChange={(e) => setNewPhotoDesc(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
                    disabled={isUploadingPhoto}
                  >
                    <ImageIcon size={16} />
                    <span>{isUploadingPhoto ? 'Enviando...' : 'Adicionar Foto à Galeria'}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cadastrar ou Editar Suspeito */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="glass-panel-header" style={{ marginBottom: '24px' }}>
              <h2>{modalMode === 'create' ? 'Cadastrar Novo Suspeito' : 'Editar Ficha do Suspeito'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveSuspect}>
              <div className="form-group">
                <label>Nome Completo do Suspeito</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Nome do indivíduo"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '-8px', marginBottom: '16px' }}>
                <input 
                  type="checkbox" 
                  id="isUnidentified" 
                  checked={formIsUnidentified} 
                  onChange={(e) => {
                    setFormIsUnidentified(e.target.checked);
                    if (e.target.checked) {
                      if (!formName.trim() || formName.toUpperCase().startsWith('DESCONHECIDO')) {
                        setFormName(`DESCONHECIDO - ${formId.slice(-6).toUpperCase()}`);
                      }
                    } else {
                      if (formName.toUpperCase().startsWith('DESCONHECIDO')) {
                        setFormName('');
                      }
                    }
                  }} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="isUnidentified" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '0.85rem', userSelect: 'none' }}>
                  Suspeito ainda não identificado (Desconhecido)
                </label>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Documento RG</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Somente números"
                    value={formRg}
                    onChange={(e) => setFormRg(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Data de Nascimento</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={formBirthDate}
                    onChange={(e) => setFormBirthDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Apelidos / Vulgo</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Vírgulas se múltiplos. Ex: Beto, Maçarico"
                    value={formAliases}
                    onChange={(e) => setFormAliases(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Status Operacional</label>
                  <select 
                    className="form-select"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as Suspect['status'])}
                  >
                    <option value="active">Ativo (Solto/Procurado)</option>
                    <option value="investigating">Em Investigação</option>
                    <option value="arrested">Preso / Custodiado</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Quadrilha / Facção de Vínculo</label>
                <select 
                  className="form-select"
                  value={formGangId}
                  onChange={(e) => setFormGangId(e.target.value)}
                >
                  <option value="">Sem Vínculo Definido (Independente)</option>
                  {db.gangs.map(g => (
                    <option key={g.id} value={g.id}>{g.name} (Origem: {g.originCity})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Antecedentes Criminais (Resumo Policial)</label>
                
                {/* Seletor rápido de crimes */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1', minWidth: '200px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Selecionar/Digitar Antecedente</span>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="Selecione ou digite um crime..."
                      list="antecedentes-crimes-sugeridos"
                      value={selectedRecordCrime}
                      onChange={(e) => setSelectedRecordCrime(e.target.value)}
                    />
                    <datalist id="antecedentes-crimes-sugeridos">
                      {getSuggestedCrimes().map(c => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    style={{ height: '38px', padding: '0 16px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                    onClick={() => {
                      if (!selectedRecordCrime.trim()) return alert('Selecione ou digite um crime para adicionar!');
                      
                      const formattedLine = `- ${selectedRecordCrime.trim()}`;
                      
                      if (formCriminalRecord.trim()) {
                        setFormCriminalRecord(formCriminalRecord.trim() + '\n' + formattedLine);
                      } else {
                        setFormCriminalRecord(formattedLine);
                      }
                      
                      setSelectedRecordCrime('');
                    }}
                  >
                    + Adicionar
                  </button>
                </div>

                <textarea 
                  className="form-textarea"
                  placeholder="Liste passagens, inquéritos e condenações principais..."
                  value={formCriminalRecord}
                  onChange={(e) => setFormCriminalRecord(e.target.value)}
                  style={{ minHeight: '120px' }}
                />
              </div>

              <div className="form-group">
                <label>Modus Operandi (Comportamento em Crime)</label>
                <textarea 
                  className="form-textarea"
                  placeholder="Ex: Arromba portas traseiras com ferramentas manuais..."
                  value={formModusOperandi}
                  onChange={(e) => setFormModusOperandi(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Ocorrências Vinculadas a este Suspeito</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                  {db.crimes.map(crime => (
                    <label key={crime.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <input 
                        type="checkbox" 
                        checked={formCrimes.includes(crime.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormCrimes([...formCrimes, crime.id]);
                          } else {
                            setFormCrimes(formCrimes.filter(id => id !== crime.id));
                          }
                        }}
                      />
                      <span>
                        [{new Date(crime.date + 'T00:00:00').toLocaleDateString('pt-BR')}] {crime.establishment} - {crime.city}
                      </span>
                    </label>
                  ))}
                  {db.crimes.length === 0 && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Nenhuma ocorrência registrada no banco para vincular.
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
