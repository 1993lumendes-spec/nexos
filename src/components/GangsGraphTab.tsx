import { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network/standalone';
import { 
  HelpCircle, 
  Search,
  Maximize2
} from 'lucide-react';
import type { Gang, Suspect, Crime, SystemUser, SuspectVehicle } from '../types';

const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%232a2f3d"/><circle cx="100" cy="80" r="40" fill="%234b5563"/><path d="M40,160 C40,120 160,120 160,160 Z" fill="%234b5563"/></svg>`;

interface NexosState {
  gangs: Gang[];
  suspects: Suspect[];
  crimes: Crime[];
  users: SystemUser[];
  vehicles: SuspectVehicle[];
}

interface GangsGraphTabProps {
  db: NexosState;
}

export default function GangsGraphTab({ db }: GangsGraphTabProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [graphMode, setGraphMode] = useState<'gangs' | 'hybrid'>('hybrid');
  const [suspectViewMode, setSuspectViewMode] = useState<'photo' | 'icon' | 'name'>('photo');
  const [selectedNodeInfo, setSelectedNodeInfo] = useState<{
    type: 'gang' | 'suspect' | 'vehicle';
    name: string;
    details: string;
    connections: string[];
  } | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');

  // Mapear associações de quadrilhas para cada suspeito
  const getSuspectGangs = (suspect: Suspect): string[] => {
    const gangs = new Set<string>();
    if (suspect.gangId) {
      gangs.add(suspect.gangId);
    }
    db.crimes.forEach(crime => {
      if (crime.gangId && crime.suspectsInvolved.includes(suspect.id)) {
        gangs.add(crime.gangId);
      }
    });
    return Array.from(gangs);
  };

  // Recriar o grafo sempre que o banco de dados ou o modo mudar
  useEffect(() => {
    if (!containerRef.current) return;

    const nodes: any[] = [];
    const edges: any[] = [];

    if (graphMode === 'gangs') {
      // MODO 1: Apenas Quadrilhas
      db.gangs.forEach(gang => {
        nodes.push({
          id: gang.id,
          label: gang.name,
          title: `Quadrilha: ${gang.name}\nOrigem: ${gang.originCity}`,
          color: {
            background: gang.color,
            border: '#ffffff',
            highlight: { background: gang.color, border: '#6366f1' }
          },
          shape: 'dot',
          size: 30,
          font: { color: '#f8fafc', size: 14, face: 'Inter' },
          borderWidth: 2
        });
      });

      // Calcular conexões com base em membros compartilhados
      const gangConnections: Record<string, Set<string>> = {};

      db.suspects.forEach(suspect => {
        const associatedGangs = getSuspectGangs(suspect);
        if (associatedGangs.length > 1) {
          for (let i = 0; i < associatedGangs.length; i++) {
            for (let j = i + 1; j < associatedGangs.length; j++) {
              const gA = associatedGangs[i];
              const gB = associatedGangs[j];
              const key = [gA, gB].sort().join('--');
              if (!gangConnections[key]) {
                gangConnections[key] = new Set();
              }
              gangConnections[key].add(suspect.name);
            }
          }
        }
      });

      Object.entries(gangConnections).forEach(([key, suspectsSet]) => {
        const [from, to] = key.split('--');
        const listNames = Array.from(suspectsSet).join(', ');
        edges.push({
          from,
          to,
          width: Math.min(suspectsSet.size * 3, 10),
          color: { color: 'rgba(99, 102, 241, 0.4)', highlight: '#6366f1' },
          title: `Elo: ${suspectsSet.size} integrante(s) compartilhado(s): ${listNames}`,
          label: `${suspectsSet.size}`,
          font: { color: '#94a3b8', size: 11, align: 'top' },
          smooth: { type: 'continuous' }
        });
      });

    } else {
      // MODO 2: Híbrido (Quadrilhas + Suspeitos + Veículos)
      // Adiciona nós das quadrilhas (Tamanho maior)
      db.gangs.forEach(gang => {
        nodes.push({
          id: gang.id,
          label: gang.name,
          title: `Quadrilha: ${gang.name}\nOrigem: ${gang.originCity}`,
          color: {
            background: gang.color,
            border: '#ffffff',
            highlight: { background: gang.color, border: '#ffffff' }
          },
          shape: 'dot',
          size: 28,
          font: { color: '#f8fafc', size: 14, face: 'Inter', bold: true },
          borderWidth: 2
        });
      });

      // Adiciona nós dos suspeitos (Tamanho médio)
      db.suspects.forEach(suspect => {
        const associatedGangsList = getSuspectGangs(suspect);
        const isMultiGangSuspect = associatedGangsList.length > 1;

        let nodeColor = '#475569';
        let borderC = '#94a3b8';
        
        if (suspect.status === 'active') {
          nodeColor = '#ef4444';
          borderC = '#fca5a5';
        } else if (suspect.status === 'arrested') {
          nodeColor = '#10b981';
          borderC = '#6ee7b7';
        } else if (suspect.status === 'investigating') {
          nodeColor = '#f59e0b';
          borderC = '#fcd34d';
        }

        if (isMultiGangSuspect) {
          borderC = '#a855f7'; // Roxo neon
        }

        const suspectName = suspect.aliases ? `${suspect.name} (${suspect.aliases})` : suspect.name;
        const finalLabel = isMultiGangSuspect ? `🔗 ${suspectName}` : suspectName;
        
        const gangNames = associatedGangsList.map(gId => db.gangs.find(g => g.id === gId)?.name || gId).join(', ');
        const tooltipTitle = isMultiGangSuspect
          ? `[CONEXÃO MULTI-QUADRILHAS]\nSuspeito: ${suspect.name}\nRG: ${suspect.rg}\nStatus: ${suspect.status}\nQuadrilhas: ${gangNames}`
          : `Suspeito: ${suspect.name}\nRG: ${suspect.rg}\nStatus: ${suspect.status}`;

        let nodeShape: string = 'circularImage';
        let nodeImage: string | undefined = suspect.primaryPhoto || DEFAULT_AVATAR;
        let nodeSize: number = isMultiGangSuspect ? 26 : 16;
        let nodeFont = { color: '#cbd5e1', size: 11, face: 'Inter' };

        if (suspectViewMode === 'icon') {
          nodeShape = 'dot';
          nodeImage = undefined;
          nodeSize = isMultiGangSuspect ? 20 : 12;
        } else if (suspectViewMode === 'name') {
          nodeShape = 'text';
          nodeImage = undefined;
          nodeFont = { color: '#cbd5e1', size: isMultiGangSuspect ? 14 : 11, face: 'Inter' };
        }

        nodes.push({
          id: suspect.id,
          label: finalLabel,
          title: tooltipTitle,
          color: {
            background: nodeColor,
            border: borderC,
            highlight: { background: '#6366f1', border: '#ffffff' }
          },
          shape: nodeShape,
          image: nodeImage,
          size: nodeSize,
          font: nodeFont,
          borderWidth: isMultiGangSuspect ? 4 : 2
        });

        // Conecta suspeito às quadrilhas
        associatedGangsList.forEach(gId => {
          const gang = db.gangs.find(g => g.id === gId);
          edges.push({
            from: suspect.id,
            to: gId,
            width: 1.5,
            color: { color: gang ? `${gang.color}50` : 'rgba(148, 163, 184, 0.3)', highlight: '#6366f1' },
            arrows: { to: { enabled: false } },
            length: 120
          });
        });
      });

      // Adiciona nós dos veículos suspeitos (Formato Diamante/Triângulo invertido, tamanho menor)
      db.vehicles.forEach(vehicle => {
        nodes.push({
          id: vehicle.id,
          label: `${vehicle.brandModel} (${vehicle.plate})`,
          title: `Veículo: ${vehicle.brandModel}\nPlaca: ${vehicle.plate}\nCor: ${vehicle.color}`,
          color: {
            background: '#06b6d4', // Cyan
            border: '#22d3ee',
            highlight: { background: '#6366f1', border: '#ffffff' }
          },
          shape: 'triangleDown',
          size: 12,
          font: { color: '#e2e8f0', size: 10, face: 'Inter' },
          borderWidth: 1
        });

        // Conectar veículo à quadrilha
        if (vehicle.gangId) {
          const gang = db.gangs.find(g => g.id === vehicle.gangId);
          edges.push({
            from: vehicle.id,
            to: vehicle.gangId,
            width: 1,
            color: { color: gang ? `${gang.color}40` : 'rgba(148, 163, 184, 0.2)', highlight: '#6366f1' },
            arrows: { to: { enabled: false } },
            length: 110
          });
        }

        // Conectar veículo ao suspeito motorista
        if (vehicle.suspectId) {
          edges.push({
            from: vehicle.id,
            to: vehicle.suspectId,
            width: 1,
            color: { color: 'rgba(6, 182, 212, 0.3)', highlight: '#6366f1' },
            arrows: { to: { enabled: false } },
            length: 80
          });
        }
      });
    }

    // Configuração do motor físico (Obsidian-like)
    const options = {
      nodes: {
        scaling: { min: 10, max: 30 }
      },
      edges: {
        arrows: { to: { enabled: false } },
        smooth: {
          enabled: true,
          type: 'dynamic',
          roundness: 0.5
        }
      },
      physics: {
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -60,
          centralGravity: 0.015,
          springLength: 90,
          springConstant: 0.08,
          damping: 0.4
        },
        stabilization: {
          enabled: true,
          iterations: 150,
          updateInterval: 25
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        selectable: true
      }
    };

    const data = { nodes, edges };
    const network = new Network(containerRef.current, data, options);
    networkRef.current = network;

    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        
        // 1. Quadrilha
        const gang = db.gangs.find(g => g.id === nodeId);
        if (gang) {
          const members = db.suspects.filter(s => getSuspectGangs(s).includes(gang.id));
          const gangVehicles = db.vehicles.filter(v => v.gangId === gang.id);
          
          const connections = [
            ...members.map(m => `Suspeito: ${m.name} (${m.status === 'active' ? 'Ativo' : m.status === 'arrested' ? 'Preso' : 'Investigando'})`),
            ...gangVehicles.map(v => `Veículo: ${v.brandModel} (${v.plate})`)
          ];

          setSelectedNodeInfo({
            type: 'gang',
            name: gang.name,
            details: `Origem: ${gang.originCity}\n\nDescrição:\n${gang.description}`,
            connections
          });
          return;
        }

        // 2. Suspeito
        const suspect = db.suspects.find(s => s.id === nodeId);
        if (suspect) {
          const associatedGangs = getSuspectGangs(suspect)
            .map(gId => db.gangs.find(g => g.id === gId)?.name || gId);
          
          const suspectVehicles = db.vehicles.filter(v => v.suspectId === suspect.id);
          
          const connections = [
            ...associatedGangs.map(g => `Quadrilha: ${g}`),
            ...suspectVehicles.map(v => `Veículo: ${v.brandModel} (${v.plate})`)
          ];
          
          setSelectedNodeInfo({
            type: 'suspect',
            name: suspect.name,
            details: `RG: ${suspect.rg}\nApelidos: ${suspect.aliases || 'Não possui'}\n\nAntecedentes:\n${suspect.criminalRecord}`,
            connections
          });
          return;
        }

        // 3. Veículo Suspeito
        const vehicle = db.vehicles.find(v => v.id === nodeId);
        if (vehicle) {
          const associatedGangName = db.gangs.find(g => g.id === vehicle.gangId)?.name || 'Nenhuma';
          const associatedDriverName = db.suspects.find(s => s.id === vehicle.suspectId)?.name || 'Não identificado';

          setSelectedNodeInfo({
            type: 'vehicle',
            name: `${vehicle.brandModel} (${vehicle.plate})`,
            details: `Placa: ${vehicle.plate}\nCor: ${vehicle.color || 'Não informada'}\n\nObservações:\n${vehicle.description || 'Sem notas.'}`,
            connections: [
              `Quadrilha vinculada: ${associatedGangName}`,
              `Motorista associado: ${associatedDriverName}`
            ]
          });
        }
      } else {
        setSelectedNodeInfo(null);
      }
    });

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [db.gangs, db.suspects, db.crimes, db.vehicles, graphMode, suspectViewMode]);

  // Função para focar/buscar nó
  const handleSearchNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !networkRef.current) return;

    const query = searchQuery.toLowerCase();
    
    const matchGang = db.gangs.find(g => g.name.toLowerCase().includes(query));
    const matchSuspect = db.suspects.find(s => s.name.toLowerCase().includes(query) || (s.aliases && s.aliases.toLowerCase().includes(query)));
    const matchVehicle = db.vehicles.find(v => v.plate.toLowerCase().includes(query) || v.brandModel.toLowerCase().includes(query));
    
    const targetId = matchGang?.id || matchSuspect?.id || matchVehicle?.id;
    if (targetId) {
      networkRef.current.selectNodes([targetId]);
      networkRef.current.focus(targetId, {
        scale: 1.2,
        animation: { duration: 1000, easingFunction: 'easeInOutQuad' }
      });

      if (matchGang) {
        const members = db.suspects.filter(s => getSuspectGangs(s).includes(matchGang.id));
        const gangVehs = db.vehicles.filter(v => v.gangId === matchGang.id);
        setSelectedNodeInfo({
          type: 'gang',
          name: matchGang.name,
          details: `Origem: ${matchGang.originCity}\n\nDescrição:\n${matchGang.description}`,
          connections: [
            ...members.map(m => `Suspeito: ${m.name}`),
            ...gangVehs.map(v => `Veículo: ${v.brandModel}`)
          ]
        });
      } else if (matchSuspect) {
        const associatedGangs = getSuspectGangs(matchSuspect)
          .map(gId => db.gangs.find(g => g.id === gId)?.name || gId);
        const suspectVehs = db.vehicles.filter(v => v.suspectId === matchSuspect.id);
        setSelectedNodeInfo({
          type: 'suspect',
          name: matchSuspect.name,
          details: `RG: ${matchSuspect.rg}\nApelidos: ${matchSuspect.aliases || 'Nenhum'}\n\nAntecedentes:\n${matchSuspect.criminalRecord}`,
          connections: [
            ...associatedGangs.map(g => `Quadrilha: ${g}`),
            ...suspectVehs.map(v => `Veículo: ${v.brandModel}`)
          ]
        });
      } else if (matchVehicle) {
        const gangName = db.gangs.find(g => g.id === matchVehicle.gangId)?.name || 'Nenhuma';
        const driverName = db.suspects.find(s => s.id === matchVehicle.suspectId)?.name || 'Não identificado';
        setSelectedNodeInfo({
          type: 'vehicle',
          name: `${matchVehicle.brandModel} (${matchVehicle.plate})`,
          details: `Placa: ${matchVehicle.plate}\nCor: ${matchVehicle.color}\n\nObservações:\n${matchVehicle.description}`,
          connections: [
            `Quadrilha: ${gangName}`,
            `Motorista: ${driverName}`
          ]
        });
      }
    } else {
      alert('Nenhum nó encontrado com este termo.');
    }
  };

  const handleResetZoom = () => {
    if (networkRef.current) {
      networkRef.current.fit({
        animation: { duration: 800, easingFunction: 'easeInOutQuad' }
      });
    }
  };

  return (
    <div className="tab-container">
      {/* Opções de visualização */}
      <div className="search-bar-row" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className={`btn-secondary ${graphMode === 'hybrid' ? 'active' : ''}`}
              style={{ 
                backgroundColor: graphMode === 'hybrid' ? 'var(--accent)' : 'var(--bg-secondary)',
                color: 'white' 
              }}
              onClick={() => setGraphMode('hybrid')}
            >
              Grafo Híbrido (Membros + Veículos + Quadrilhas)
            </button>
            <button 
              className={`btn-secondary ${graphMode === 'gangs' ? 'active' : ''}`}
              style={{ 
                backgroundColor: graphMode === 'gangs' ? 'var(--accent)' : 'var(--bg-secondary)',
                color: 'white' 
              }}
              onClick={() => setGraphMode('gangs')}
            >
              Apenas Conexões de Quadrilhas
            </button>
          </div>

          {/* Seletor de visualização de suspeitos */}
          {graphMode === 'hybrid' && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold', marginRight: '6px', textTransform: 'uppercase' }}>Suspeitos:</span>
              <button 
                className={`btn-secondary ${suspectViewMode === 'photo' ? 'active' : ''}`}
                style={{ 
                  backgroundColor: suspectViewMode === 'photo' ? 'var(--accent)' : 'transparent',
                  color: 'white',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  border: suspectViewMode === 'photo' ? 'none' : '1px solid transparent'
                }}
                onClick={() => setSuspectViewMode('photo')}
              >
                Foto
              </button>
              <button 
                className={`btn-secondary ${suspectViewMode === 'icon' ? 'active' : ''}`}
                style={{ 
                  backgroundColor: suspectViewMode === 'icon' ? 'var(--accent)' : 'transparent',
                  color: 'white',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  border: suspectViewMode === 'icon' ? 'none' : '1px solid transparent'
                }}
                onClick={() => setSuspectViewMode('icon')}
              >
                Ícone
              </button>
              <button 
                className={`btn-secondary ${suspectViewMode === 'name' ? 'active' : ''}`}
                style={{ 
                  backgroundColor: suspectViewMode === 'name' ? 'var(--accent)' : 'transparent',
                  color: 'white',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  border: suspectViewMode === 'name' ? 'none' : '1px solid transparent'
                }}
                onClick={() => setSuspectViewMode('name')}
              >
                Nome
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSearchNode} className="search-input-wrapper" style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Buscar no grafo (ex: placa, nome)..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '10px 14px' }}>
            Buscar
          </button>
        </form>
      </div>

      {/* Layout de Exibição */}
      <div className="network-container-layout">
        {/* Grafo de física */}
        <div className="network-graph-wrapper">
          <div className="graph-controls">
            <button className="graph-control-btn" onClick={handleResetZoom} title="Enquadrar todos os nós">
              <Maximize2 size={12} style={{ marginRight: '4px' }} />
              Reset Zoom
            </button>
          </div>

          <div ref={containerRef} className="network-graph-canvas" />
        </div>

        {/* Informações detalhadas do nó selecionado */}
        <div className="network-info-sidebar">
          {selectedNodeInfo ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <span className="badge" style={{ 
                  backgroundColor: selectedNodeInfo.type === 'gang' ? 'rgba(99, 102, 241, 0.15)' : selectedNodeInfo.type === 'vehicle' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: selectedNodeInfo.type === 'gang' ? 'var(--accent)' : selectedNodeInfo.type === 'vehicle' ? '#06b6d4' : '#ef4444',
                  marginBottom: '6px'
                }}>
                  {selectedNodeInfo.type === 'gang' ? 'Quadrilha Mapeada' : selectedNodeInfo.type === 'vehicle' ? 'Veículo Suspeito' : 'Suspeito'}
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{selectedNodeInfo.name}</h3>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Dados / Prontuário</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-line', backgroundColor: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '4px' }}>
                  {selectedNodeInfo.details}
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Elos de Ligação
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedNodeInfo.connections.map((conn, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        fontSize: '0.8rem', 
                        padding: '6px 10px', 
                        backgroundColor: 'var(--bg-tertiary)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '4px' 
                      }}
                    >
                      {conn}
                    </div>
                  ))}
                  {selectedNodeInfo.connections.length === 0 && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nenhuma conexão detectada.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center', gap: '12px' }}>
              <HelpCircle size={36} className="text-accent" style={{ opacity: 0.5 }} />
              <div>
                <h4 style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Grafo de Inteligência</h4>
                <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                  Clique em qualquer nó do grafo para visualizar seu prontuário, conexões e membros vinculados aqui.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', marginTop: '10px' }}>
                <div className="graph-legend-item">
                  <div className="graph-legend-dot" style={{ backgroundColor: '#ef4444' }}></div>
                  <span>Suspeito Ativo (Procurado)</span>
                </div>
                <div className="graph-legend-item">
                  <div className="graph-legend-dot" style={{ backgroundColor: '#10b981' }}></div>
                  <span>Suspeito Preso</span>
                </div>
                <div className="graph-legend-item">
                  <div className="graph-legend-dot" style={{ backgroundColor: '#f59e0b' }}></div>
                  <span>Suspeito sob Investigação</span>
                </div>
                <div className="graph-legend-item">
                  <div className="graph-legend-dot" style={{ backgroundColor: '#06b6d4' }}></div>
                  <span>Veículo Suspeito (Triângulo)</span>
                </div>
                <div className="graph-legend-item">
                  <div className="graph-legend-dot" style={{ backgroundColor: '#6366f1' }}></div>
                  <span>Nó Quadrilha (Colorido por Grupo)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
