import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  ShieldAlert, 
  Users, 
  Network, 
  MapPin, 
  Calendar, 
  ArrowRight,
  UserCheck,
  Plus,
  X
} from 'lucide-react';
import type { Gang, Suspect, Crime, SystemUser, SuspectVehicle } from '../types';
import { CITIES_RS, getCityCoords } from '../utils/mockData';

// Ajuste para carregar imagens dos marcadores Leaflet no Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface NexosState {
  gangs: Gang[];
  suspects: Suspect[];
  crimes: Crime[];
  users: SystemUser[];
  vehicles: SuspectVehicle[];
}

interface DashboardTabProps {
  db: NexosState;
  onUpdateDb: (newDb: NexosState) => void;
  onViewSuspect: (suspectId: string) => void;
}

export default function DashboardTab({ db, onUpdateDb, onViewSuspect }: DashboardTabProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  // Estados para modal de nova quadrilha
  const [isGangModalOpen, setIsGangModalOpen] = useState(false);
  const [gangName, setGangName] = useState('');
  const [gangOrigin, setGangOrigin] = useState('');
  const [gangColor, setGangColor] = useState('#6366f1'); // Cor padrão Indigo
  const [gangDescription, setGangDescription] = useState('');

  // Estados para modal de nova ocorrência (Crime)
  const [isCrimeModalOpen, setIsCrimeModalOpen] = useState(false);
  const [crimeNumber, setCrimeNumber] = useState('');
  const [crimeDate, setCrimeDate] = useState('');
  const [crimeEstablishment, setCrimeEstablishment] = useState('');
  const [crimeCity, setCrimeCity] = useState('');
  const [crimeAddress, setCrimeAddress] = useState('');
  const [crimeGangId, setCrimeGangId] = useState('');
  const [crimeDescription, setCrimeDescription] = useState('');
  const [crimeStolenValue, setCrimeStolenValue] = useState('');
  const [crimeSuspects, setCrimeSuspects] = useState<string[]>([]);
  const [crimeVehicles, setCrimeVehicles] = useState<string[]>([]);
  const [searchSuspectInput, setSearchSuspectInput] = useState('');
  const [searchVehicleInput, setSearchVehicleInput] = useState('');

  // Estados para cadastros inline no modal de ocorrência
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

  // Estados para modal de novo suspeito
  const [isSuspectModalOpen, setIsSuspectModalOpen] = useState(false);
  const [suspName, setSuspName] = useState('');
  const [suspRg, setSuspRg] = useState('');
  const [suspAliases, setSuspAliases] = useState('');
  const [suspGangId, setSuspGangId] = useState('');
  const [suspCriminalRecord, setSuspCriminalRecord] = useState('');
  const [suspModusOperandi, setSuspModusOperandi] = useState('');
  const [suspStatus, setSuspStatus] = useState<'active' | 'arrested' | 'investigating'>('active');
  const [suspBirthDate, setSuspBirthDate] = useState('');

  // Estados para modal de novo veículo
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehPlate, setVehPlate] = useState('');
  const [vehBrandModel, setVehBrandModel] = useState('');
  const [vehColor, setVehColor] = useState('');
  const [vehGangId, setVehGangId] = useState('');
  const [vehSuspectId, setVehSuspectId] = useState('');
  const [vehDescription, setVehDescription] = useState('');



  // 1. Estatísticas Rápidas
  const totalCrimes = db.crimes.length;
  const totalSuspects = db.suspects.length;
  const totalGangs = db.gangs.length;
  const affectedCitiesCount = new Set(db.crimes.map(c => c.city)).size;

  // 2. Suspeitos mais ativos (Top Alvos)
  const getSuspectCrimesCount = (suspectId: string) => {
    return db.crimes.filter(c => c.suspectsInvolved.includes(suspectId)).length;
  };

  const topSuspects = [...db.suspects]
    .map(s => ({
      ...s,
      crimesCount: getSuspectCrimesCount(s.id),
      gangName: db.gangs.find(g => g.id === s.gangId)?.name || 'Sem Quadrilha'
    }))
    .sort((a, b) => b.crimesCount - a.crimesCount)
    .slice(0, 4);

  // 3. Inicialização e atualização do Mapa
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        center: [-29.8, -52.5],
        zoom: 7,
        minZoom: 6,
        maxZoom: 12,
        scrollWheelZoom: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    db.crimes.forEach(crime => {
      const gang = db.gangs.find(g => g.id === crime.gangId);
      const gangNameName = gang?.name || 'Desconhecida';
      const gangColorColor = gang?.color || '#94a3b8';
      
      const suspectsList = crime.suspectsInvolved
        .map(id => db.suspects.find(s => s.id === id)?.name || id)
        .join(', ') || 'Não Identificados';

      const popupHtml = `
        <div style="font-family: sans-serif; color: #f8fafc; padding: 4px;">
          <h4 style="margin: 0 0 6px 0; color: #6366f1; font-size: 14px; font-weight: 600;">${crime.establishment}</h4>
          <p style="margin: 0 0 4px 0; font-size: 12px;"><b>Cidade:</b> ${crime.city}</p>
          <p style="margin: 0 0 4px 0; font-size: 11px;"><b>Data:</b> ${crime.date}</p>
          <p style="margin: 0 0 4px 0; font-size: 11px;">
            <b style="color: ${gangColorColor}">Quadrilha:</b> ${gangNameName}
          </p>
          <p style="margin: 0 0 0 0; font-size: 11px; color: #94a3b8;"><b>Suspeitos:</b> ${suspectsList}</p>
        </div>
      `;

      const coords = crime.coordinates && crime.coordinates.length >= 2 ? crime.coordinates : getCityCoords(crime.city);
      const marker = L.circleMarker(coords, {
        radius: 9,
        fillColor: gangColorColor,
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.95
      })
        .bindPopup(popupHtml)
        .addTo(map);

      markersRef.current.push(marker);
    });

    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [db.crimes, db.gangs, db.suspects]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Preencher coordenadas a partir da cidade selecionada
  const handleCityChange = (val: string) => {
    setCrimeCity(val);
  };

  // Vincular suspeito existente ao digitar ou submeter
  const handleLinkSuspect = (suspectId: string) => {
    if (!crimeSuspects.includes(suspectId)) {
      setCrimeSuspects([...crimeSuspects, suspectId]);
    }
    setSearchSuspectInput('');
  };

  const handleSearchSuspectSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!searchSuspectInput.trim()) return;

    // Busca exata ou parcial por Nome, apelido ou RG
    const found = db.suspects.find(s => 
      s.name.toLowerCase() === searchSuspectInput.trim().toLowerCase() ||
      s.rg === searchSuspectInput.trim() ||
      s.aliases.toLowerCase() === searchSuspectInput.trim().toLowerCase()
    );

    if (found) {
      if (window.confirm(`O suspeito "${found.name}" (RG: ${found.rg || 'Não cadastrado'}) já está registrado. Deseja vinculá-lo a esta ocorrência?`)) {
        handleLinkSuspect(found.id);
      }
    } else {
      alert(`Nenhum suspeito encontrado com o Nome, RG ou Apelido "${searchSuspectInput}". Cadastre-o primeiro através do botão "+ Suspeito" na guia principal.`);
    }
  };

  // Vincular veículo existente ao digitar ou submeter
  const handleLinkVehicle = (vehicleId: string) => {
    if (!crimeVehicles.includes(vehicleId)) {
      setCrimeVehicles([...crimeVehicles, vehicleId]);
    }
    setSearchVehicleInput('');
  };

  const handleSearchVehicleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!searchVehicleInput.trim()) return;

    // Busca exata por placa
    const found = db.vehicles.find(v => 
      v.plate.toUpperCase() === searchVehicleInput.trim().toUpperCase()
    );

    if (found) {
      if (window.confirm(`O veículo com placa "${found.plate}" (${found.brandModel}) já está registrado. Deseja vinculá-lo a esta ocorrência?`)) {
        handleLinkVehicle(found.id);
      }
    } else {
      alert(`Nenhum veículo encontrado com a placa "${searchVehicleInput}". Cadastre-o primeiro através do botão "+ Veículo" na guia principal.`);
    }
  };

  const handleSaveGangInline = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newGangName.trim()) return alert('O nome da quadrilha é obrigatório!');
    const newGang = {
      id: `gang-${Date.now()}`,
      name: newGangName.trim().toUpperCase(),
      originCity: newGangOrigin.trim().toUpperCase() || 'LAJEADO',
      color: newGangColor,
      description: 'CADASTRADA DE FORMA RÁPIDA VIA OCORRÊNCIA.'
    };
    onUpdateDb({
      ...db,
      gangs: [...db.gangs, newGang]
    });
    setCrimeGangId(newGang.id);
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
      gangId: crimeGangId || '',
      criminalRecord: 'SEM ANTECEDENTES RELATADOS.',
      status: 'active' as const,
      isUnidentified: newSuspectIsUnidentified
    };
    onUpdateDb({
      ...db,
      suspects: [...db.suspects, newSuspect]
    });
    setCrimeSuspects([...crimeSuspects, newSuspect.id]);
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
      gangId: crimeGangId || '',
      suspectId: '',
      description: 'CADASTRADO DE FORMA RÁPIDA VIA OCORRÊNCIA.'
    };
    onUpdateDb({
      ...db,
      vehicles: [...db.vehicles, newVehicle]
    });
    setCrimeVehicles([...crimeVehicles, newVehicle.id]);
    setShowAddVehicleInline(false);
    setNewVehiclePlate('');
    setNewVehicleModel('');
    setNewVehicleColor('');
  };

  // Handler para criar nova ocorrência
  const handleSaveCrime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!crimeEstablishment.trim() || !crimeCity.trim() || !crimeDate.trim()) {
      return alert('Data, Estabelecimento e Cidade são obrigatórios!');
    }

    const coords = getCityCoords(crimeCity);

    const newCrime: Crime = {
      id: `crime-${Date.now()}`,
      crimeNumber: crimeNumber.trim() || undefined,
      date: crimeDate,
      establishment: crimeEstablishment,
      city: crimeCity,
      address: crimeAddress,
      gangId: crimeGangId,
      suspectsInvolved: crimeSuspects,
      vehiclesInvolved: crimeVehicles,
      description: crimeDescription || 'Sem detalhes fornecidos.',
      coordinates: coords,
      stolenValue: crimeStolenValue ? parseFloat(crimeStolenValue) : undefined
    };

    onUpdateDb({
      ...db,
      crimes: [...db.crimes, newCrime]
    });

    // Limpar campos
    setCrimeNumber('');
    setCrimeDate('');
    setCrimeEstablishment('');
    setCrimeCity('');
    setCrimeAddress('');
    setCrimeGangId('');
    setCrimeDescription('');
    setCrimeStolenValue('');
    setCrimeSuspects([]);
    setCrimeVehicles([]);

    // Limpar estados inline
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

    setIsCrimeModalOpen(false);
    alert('Nova ocorrência cadastrada com sucesso!');
  };



  // Handler para criar novo suspeito
  const handleSaveSuspect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspName.trim()) return alert('O nome do suspeito é obrigatório!');

    const defaultAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%232a2f3d"/><circle cx="100" cy="80" r="40" fill="%234b5563"/><path d="M40,160 C40,120 160,120 160,160 Z" fill="%234b5563"/></svg>`;

    const newSuspect: Suspect = {
      id: `susp-${Date.now()}`,
      name: suspName,
      rg: suspRg,
      aliases: suspAliases,
      primaryPhoto: defaultAvatar,
      photos: [],
      gangId: suspGangId,
      criminalRecord: suspCriminalRecord || 'Sem antecedentes informados.',
      status: suspStatus,
      birthDate: suspBirthDate,
      modusOperandi: suspModusOperandi
    };

    onUpdateDb({
      ...db,
      suspects: [...db.suspects, newSuspect]
    });

    // Limpar campos
    setSuspName('');
    setSuspRg('');
    setSuspAliases('');
    setSuspGangId('');
    setSuspCriminalRecord('');
    setSuspModusOperandi('');
    setSuspStatus('active');
    setSuspBirthDate('');
    setIsSuspectModalOpen(false);
    alert('Novo suspeito cadastrado com sucesso!');
  };

  // Handler para criar novo veículo
  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehPlate.trim() || !vehBrandModel.trim()) {
      return alert('Placa e Marca/Modelo são obrigatórios!');
    }

    const newVehicle: SuspectVehicle = {
      id: `veh-${Date.now()}`,
      plate: vehPlate.toUpperCase(),
      brandModel: vehBrandModel,
      color: vehColor || 'Não informada',
      gangId: vehGangId,
      suspectId: vehSuspectId,
      description: vehDescription
    };

    onUpdateDb({
      ...db,
      vehicles: [...db.vehicles, newVehicle]
    });

    // Limpar campos
    setVehPlate('');
    setVehBrandModel('');
    setVehColor('');
    setVehGangId('');
    setVehSuspectId('');
    setVehDescription('');
    setIsVehicleModalOpen(false);
    alert('Novo veículo suspeito cadastrado com sucesso!');
  };

  // Handler para criar nova quadrilha
  const handleSaveGang = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gangName.trim()) return alert('O nome da quadrilha é obrigatório!');

    const newGang: Gang = {
      id: `gang-${Date.now()}`,
      name: gangName.trim().toUpperCase(),
      originCity: (gangOrigin || 'Porto Alegre').trim().toUpperCase(),
      color: gangColor,
      description: gangDescription || 'Sem detalhes fornecidos.'
    };

    onUpdateDb({
      ...db,
      gangs: [...db.gangs, newGang]
    });

    // Limpar e fechar
    setGangName('');
    setGangOrigin('');
    setGangColor('#6366f1');
    setGangDescription('');
    setIsGangModalOpen(false);
    alert('Nova quadrilha cadastrada com sucesso!');
  };

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

  return (
    <div className="tab-container">
      {/* Cabeçalho da Aba com Ações Rápidas de Cadastro */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end', width: '100%', marginBottom: '16px' }}>

        <button className="btn-primary" style={{ backgroundColor: '#ef4444' }} onClick={() => setIsCrimeModalOpen(true)}>
          <Plus size={18} />
          <span>+ Ocorrência</span>
        </button>
        <button className="btn-primary" style={{ backgroundColor: 'var(--accent)' }} onClick={() => setIsGangModalOpen(true)}>
          <Plus size={18} />
          <span>+ Quadrilha</span>
        </button>
        <button className="btn-primary" style={{ backgroundColor: '#10b981' }} onClick={() => setIsSuspectModalOpen(true)}>
          <Plus size={18} />
          <span>+ Suspeito</span>
        </button>
        <button className="btn-primary" style={{ backgroundColor: '#f59e0b' }} onClick={() => setIsVehicleModalOpen(true)}>
          <Plus size={18} />
          <span>+ Veículo</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-container danger">
            <ShieldAlert size={24} />
          </div>
          <div className="kpi-info">
            <h4>Total de Furtos</h4>
            <p>{totalCrimes}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-container warning">
            <Users size={24} />
          </div>
          <div className="kpi-info">
            <h4>Suspeitos Identificados</h4>
            <p>{totalSuspects}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-container primary">
            <Network size={24} />
          </div>
          <div className="kpi-info">
            <h4>Quadrilhas Mapeadas</h4>
            <p>{totalGangs}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-container success">
            <MapPin size={24} />
          </div>
          <div className="kpi-info">
            <h4>Cidades Atingidas</h4>
            <p>{affectedCitiesCount}</p>
          </div>
        </div>
      </div>

      {/* Seção Principal do Painel */}
      <div className="dashboard-layout">
        {/* Lado Esquerdo: Mapa Geral e Tabela de Ocorrências */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel">
            <div className="glass-panel-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin className="text-accent" size={18} />
                Mapeamento das Ocorrências no Estado
              </h3>
              <span className="text-xs text-secondary">OSM Tiles • RS</span>
            </div>
            <div style={{ position: 'relative' }}>
              <div className="map-wrapper dark-map" ref={mapContainerRef}></div>
              
              {/* Legenda do Mapa */}
              <div style={{ 
                position: 'absolute', 
                bottom: '16px', 
                left: '16px', 
                backgroundColor: 'rgba(19, 27, 46, 0.95)', 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-sm)', 
                padding: '10px 14px', 
                zIndex: 1000, 
                pointerEvents: 'none', 
                boxShadow: 'var(--shadow-lg)'
              }}>
                <h5 style={{ fontSize: '0.75rem', marginBottom: '6px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>
                  Legenda / Quadrilhas
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {db.gangs.map(g => (
                    <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: g.color }}></div>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{g.name}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#94a3b8' }}></div>
                    <span style={{ color: 'var(--text-secondary)' }}>Sem Quadrilha Vinculada</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel">
            <div className="glass-panel-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar className="text-accent" size={18} />
                Últimos Furtos Registrados
              </h3>
              <span className="text-xs text-secondary">Ordem cronológica</span>
            </div>
            
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Estabelecimento</th>
                    <th>Cidade</th>
                    <th>Quadrilha</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {[...db.crimes]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(crime => {
                      const gang = db.gangs.find(g => g.id === crime.gangId);
                      return (
                        <tr key={crime.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {new Date(crime.date).toLocaleDateString('pt-BR')}
                          </td>
                          <td style={{ fontWeight: 600 }}>{crime.establishment}</td>
                          <td>{crime.city}</td>
                          <td>
                            {gang ? (
                              <span 
                                className="badge" 
                                style={{ 
                                  backgroundColor: `${gang.color}20`, 
                                  color: gang.color,
                                  border: `1px solid ${gang.color}40`
                                }}
                              >
                                {gang.name}
                              </span>
                            ) : (
                              <span className="badge" style={{ backgroundColor: '#2e303a', color: '#94a3b8' }}>
                                Desconhecida
                              </span>
                            )}
                          </td>
                          <td>
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', gap: '4px' }}
                              onClick={() => {
                                const idx = db.crimes.findIndex(c => c.id === crime.id);
                                if (idx !== -1 && markersRef.current[idx] && mapInstanceRef.current) {
                                  const coords = crime.coordinates && crime.coordinates.length >= 2 ? crime.coordinates : getCityCoords(crime.city);
                                  mapInstanceRef.current.setView(coords, 10);
                                  markersRef.current[idx].openPopup();
                                }
                              }}
                            >
                              Focar no Mapa
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  {db.crimes.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        Nenhum crime registrado no banco de dados. Use a aba "Suspeitos" e crie ocorrências, ou carregue os dados de teste no rodapé da barra lateral.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Lado Direito: Principais Alvos Investigados */}
        <div className="glass-panel" style={{ height: 'fit-content' }}>
          <div className="glass-panel-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck className="text-danger" size={18} />
              Principais Alvos
            </h3>
            <span className="text-xs text-secondary">Furtos Vinculados</span>
          </div>

          <div className="target-list">
            {topSuspects.map(suspect => (
              <div key={suspect.id} className="target-item">
                <img 
                  src={suspect.primaryPhoto} 
                  alt={suspect.name} 
                  className="target-avatar"
                />
                <div className="target-details">
                  <h4>{suspect.name}</h4>
                  <p>{suspect.aliases ? `"${suspect.aliases}"` : 'Sem apelido'}</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                    Quadrilha: <span style={{ color: db.gangs.find(g => g.id === suspect.gangId)?.color }}>{suspect.gangName}</span>
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    {suspect.crimesCount} Crimes
                  </span>
                  <button 
                    className="close-btn"
                    style={{ color: '#6366f1', padding: '2px', cursor: 'pointer' }}
                    onClick={() => onViewSuspect(suspect.id)}
                    title="Ver Ficha Criminal"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
            {topSuspects.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                Nenhum suspeito cadastrado na base de dados.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Cadastro de Nova Quadrilha */}
      {isGangModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="glass-panel-header" style={{ marginBottom: '24px' }}>
              <h2>Cadastrar Nova Quadrilha Especializada</h2>
              <button className="close-btn" onClick={() => setIsGangModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveGang}>
              <div className="form-group">
                <label>Nome da Quadrilha</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Ex: Os Caixeiros do Planalto"
                  value={gangName}
                  onChange={(e) => setGangName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cidade de Origem (RS)</label>
                  <input 
                    type="text" 
                    list="cidades-sugeridas"
                    className="form-input"
                    placeholder="Digite ou selecione uma cidade"
                    value={gangOrigin}
                    onChange={(e) => setGangOrigin(e.target.value)}
                    required
                  />
                  <datalist id="cidades-sugeridas">
                    {suggestedCities.map(city => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group">
                  <label>Cor de Identificação no Grafo/Mapa</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input 
                      type="color" 
                      className="form-input"
                      style={{ width: '60px', padding: '4px', height: '40px', cursor: 'pointer' }}
                      value={gangColor}
                      onChange={(e) => setGangColor(e.target.value)}
                    />
                    <span style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{gangColor}</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Histórico da Quadrilha / Modus Operandi Geral</label>
                <textarea 
                  className="form-textarea"
                  placeholder="Descreva a atuação, focos de crime preferenciais e ferramentas utilizadas..."
                  value={gangDescription}
                  onChange={(e) => setGangDescription(e.target.value)}
                  style={{ minHeight: '120px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsGangModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Cadastrar Quadrilha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cadastro de Nova Ocorrência */}
      {isCrimeModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="glass-panel-header" style={{ marginBottom: '20px' }}>
              <h2>Cadastrar Nova Ocorrência Policial</h2>
              <button className="close-btn" onClick={() => setIsCrimeModalOpen(false)}>
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
                    value={crimeNumber}
                    onChange={(e) => setCrimeNumber(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Data do Fato</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={crimeDate}
                    onChange={(e) => setCrimeDate(e.target.value)}
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
                    placeholder="Ex: Lojas Renner / Banco Banrisul"
                    value={crimeEstablishment}
                    onChange={(e) => setCrimeEstablishment(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Cidade (RS)</label>
                  <input 
                    type="text" 
                    list="cidades-sugeridas"
                    className="form-input"
                    placeholder="Digite ou escolha a cidade"
                    value={crimeCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Endereço / Referência do Local</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Ex: Av. Brasil, 450"
                    value={crimeAddress}
                    onChange={(e) => setCrimeAddress(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Prejuízo Estimado (R$)</label>
                  <input 
                    type="number" 
                    className="form-input"
                    placeholder="Ex: 15000"
                    value={crimeStolenValue}
                    onChange={(e) => setCrimeStolenValue(e.target.value)}
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
                    value={crimeGangId}
                    onChange={(e) => setCrimeGangId(e.target.value)}
                  >
                    <option value="">Nenhuma / Sem Quadrilha Definida</option>
                    {db.gangs.map(g => (
                      <option key={g.id} value={g.id}>{g.name} (Origem: {g.originCity})</option>
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

              {/* Vínculo de Suspeitos com Autocompletar */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ marginBottom: 0 }}>Vincular Suspeitos do Banco</label>
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
                    <input 
                      type="text" 
                      className="form-input"
                      placeholder="Digite o Nome, RG ou Apelido do suspeito..."
                      value={searchSuspectInput}
                      onChange={(e) => setSearchSuspectInput(e.target.value)}
                    />
                    <button type="button" className="btn-secondary" onClick={handleSearchSuspectSubmit}>
                      Buscar e Vincular
                    </button>
                  </div>
                )}

                {/* Lista de Sugestões de Suspeito */}
                {searchSuspectInput.trim().length > 1 && (
                  <div style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '6px', maxHeight: '120px', overflowY: 'auto', marginBottom: '8px' }}>
                    {db.suspects
                      .filter(s => !crimeSuspects.includes(s.id) && (s.name.toLowerCase().includes(searchSuspectInput.toLowerCase()) || s.rg.includes(searchSuspectInput) || s.aliases.toLowerCase().includes(searchSuspectInput.toLowerCase())))
                      .slice(0, 5)
                      .map(s => (
                        <div 
                          key={s.id} 
                          style={{ padding: '6px 10px', fontSize: '0.8rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between' }}
                          onClick={() => handleLinkSuspect(s.id)}
                        >
                          <span>{s.name} {s.aliases ? `("${s.aliases}")` : ''}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>RG: {s.rg || 'Sem RG'}</span>
                        </div>
                      ))}
                  </div>
                )}

                {/* Exibição dos Suspeitos Vinculados */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {crimeSuspects.map(id => {
                    const susp = db.suspects.find(s => s.id === id);
                    return (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                        <span>{susp ? susp.name : id}</span>
                        <button type="button" style={{ border: 'none', background: 'transparent', color: '#10b981', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setCrimeSuspects(crimeSuspects.filter(x => x !== id))}>
                          ×
                        </button>
                      </div>
                    );
                  })}
                  {crimeSuspects.length === 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nenhum suspeito vinculado a esta ocorrência ainda.</span>
                  )}
                </div>
              </div>

              {/* Vínculo de Veículos com Autocompletar */}
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
                    <input 
                      type="text" 
                      className="form-input"
                      placeholder="Digite a Placa do veículo..."
                      value={searchVehicleInput}
                      onChange={(e) => setSearchVehicleInput(e.target.value)}
                    />
                    <button type="button" className="btn-secondary" onClick={handleSearchVehicleSubmit}>
                      Buscar e Vincular
                    </button>
                  </div>
                )}

                {/* Sugestões de Placas */}
                {searchVehicleInput.trim().length > 1 && (
                  <div style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '6px', maxHeight: '120px', overflowY: 'auto', marginBottom: '8px' }}>
                    {db.vehicles
                      .filter(v => !crimeVehicles.includes(v.id) && v.plate.toLowerCase().includes(searchVehicleInput.toLowerCase()))
                      .slice(0, 5)
                      .map(v => (
                        <div 
                          key={v.id} 
                          style={{ padding: '6px 10px', fontSize: '0.8rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between' }}
                          onClick={() => handleLinkVehicle(v.id)}
                        >
                          <span>{v.plate}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{v.brandModel} ({v.color})</span>
                        </div>
                      ))}
                  </div>
                )}

                {/* Exibição dos Veículos Vinculados */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {crimeVehicles.map(id => {
                    const veh = db.vehicles.find(v => v.id === id);
                    return (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                        <span>{veh ? `${veh.plate} (${veh.brandModel})` : id}</span>
                        <button type="button" style={{ border: 'none', background: 'transparent', color: '#f59e0b', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setCrimeVehicles(crimeVehicles.filter(x => x !== id))}>
                          ×
                        </button>
                      </div>
                    );
                  })}
                  {crimeVehicles.length === 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nenhum veículo vinculado a esta ocorrência ainda.</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Detalhamento da Ocorrência</label>
                <textarea 
                  className="form-textarea"
                  placeholder="Relatório ou narrativa resumida do furto..."
                  value={crimeDescription}
                  onChange={(e) => setCrimeDescription(e.target.value)}
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsCrimeModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Registrar Ocorrência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cadastro de Novo Suspeito */}
      {isSuspectModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="glass-panel-header" style={{ marginBottom: '20px' }}>
              <h2>Cadastrar Novo Suspeito</h2>
              <button className="close-btn" onClick={() => setIsSuspectModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveSuspect} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Nome Completo</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Nome do indivíduo"
                  value={suspName}
                  onChange={(e) => setSuspName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Documento RG</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Apenas números"
                    value={suspRg}
                    onChange={(e) => setSuspRg(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Data de Nascimento</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={suspBirthDate}
                    onChange={(e) => setSuspBirthDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Apelidos / Vulgo</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Ex: Alemão, Gordão"
                    value={suspAliases}
                    onChange={(e) => setSuspAliases(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Status Operacional</label>
                  <select 
                    className="form-select"
                    value={suspStatus}
                    onChange={(e) => setSuspStatus(e.target.value as any)}
                  >
                    <option value="active">Ativo / Solto</option>
                    <option value="arrested">Preso / Custodiado</option>
                    <option value="investigating">Sob Investigação</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Quadrilha de Vínculo</label>
                <select 
                  className="form-select"
                  value={suspGangId}
                  onChange={(e) => setSuspGangId(e.target.value)}
                >
                  <option value="">Sem Vínculo (Independente)</option>
                  {db.gangs.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Antecedentes Criminais (Resumo)</label>
                <textarea 
                  className="form-textarea"
                  placeholder="Inquéritos, passagens anteriores..."
                  value={suspCriminalRecord}
                  onChange={(e) => setSuspCriminalRecord(e.target.value)}
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div className="form-group">
                <label>Modus Operandi</label>
                <textarea 
                  className="form-textarea"
                  placeholder="Ex: Utiliza chave mixa, atua de madrugada..."
                  value={suspModusOperandi}
                  onChange={(e) => setSuspModusOperandi(e.target.value)}
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsSuspectModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar Suspeito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cadastro de Novo Veículo */}
      {isVehicleModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="glass-panel-header" style={{ marginBottom: '20px' }}>
              <h2>Cadastrar Veículo Suspeito</h2>
              <button className="close-btn" onClick={() => setIsVehicleModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Placa do Veículo</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Ex: IQO-4580 ou ABC1D23"
                    value={vehPlate}
                    onChange={(e) => setVehPlate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Marca / Modelo</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Ex: VW Gol G5"
                    value={vehBrandModel}
                    onChange={(e) => setVehBrandModel(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cor</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Ex: Prata, Preto"
                    value={vehColor}
                    onChange={(e) => setVehColor(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Quadrilha Associada</label>
                  <select 
                    className="form-select"
                    value={vehGangId}
                    onChange={(e) => setVehGangId(e.target.value)}
                  >
                    <option value="">Sem Vínculo (Independente)</option>
                    {db.gangs.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Motorista / Suspeito Proprietário</label>
                <select 
                  className="form-select"
                  value={vehSuspectId}
                  onChange={(e) => setVehSuspectId(e.target.value)}
                >
                  <option value="">Não Identificado</option>
                  {db.suspects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (RG: {s.rg || 'Sem RG'})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Observações / Histórico de Uso</label>
                <textarea 
                  className="form-textarea"
                  placeholder="Indique onde foi avistado, rotas conhecidas ou envolvimento em apoio..."
                  value={vehDescription}
                  onChange={(e) => setVehDescription(e.target.value)}
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsVehicleModalOpen(false)}>
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
