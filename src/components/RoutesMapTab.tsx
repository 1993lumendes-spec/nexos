import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Play, 
  Pause, 
  Calendar, 
  Home, 
  MapPin, 
  Filter
} from 'lucide-react';
import type { Gang, Suspect, Crime } from '../types';
import { getCityCoords } from '../utils/mockData';

interface RoutesMapTabProps {
  db: { gangs: Gang[]; suspects: Suspect[]; crimes: Crime[] };
}

export default function RoutesMapTab({ db }: RoutesMapTabProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  
  // Referências para limpar elementos do mapa dinamicamente
  const mapElementsRef = useRef<L.Layer[]>([]);

  const [selectedGangId, setSelectedGangId] = useState<string | null>(null);
  
  // Timeline states
  const sortedDates = [...db.crimes]
    .map(c => c.date)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  
  const minDate = sortedDates.length > 0 ? sortedDates[0] : '2026-01-01';
  const maxDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : '2026-12-31';
  
  const [timelineDate, setTimelineDate] = useState<string>(maxDate);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<any>(null);

  // Filtrar crimes com base no slider da timeline
  const activeCrimes = db.crimes.filter(c => {
    const crimeTime = new Date(c.date).getTime();
    const filterTime = new Date(timelineDate).getTime();
    return crimeTime <= filterTime;
  });

  // Função para dar Play/Pause na timeline
  useEffect(() => {
    if (isPlaying) {
      // Avança a timeline dia a dia ou crime a crime
      let currentIndex = sortedDates.indexOf(timelineDate);
      if (currentIndex === -1 || currentIndex === sortedDates.length - 1) {
        // Reinicia no início
        currentIndex = 0;
        setTimelineDate(sortedDates[0]);
      }

      playIntervalRef.current = setInterval(() => {
        currentIndex++;
        if (currentIndex < sortedDates.length) {
          setTimelineDate(sortedDates[currentIndex]);
        } else {
          setIsPlaying(false);
          clearInterval(playIntervalRef.current);
        }
      }, 1500); // 1.5s por passo cronológico
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    }

    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, timelineDate, sortedDates]);

  // Renderizar mapas, rotas e pins
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Inicializa o mapa caso não exista
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        center: [-29.8, -52.5], // Foco centralizado no RS
        zoom: 7,
        minZoom: 6,
        maxZoom: 12
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Forçar cálculo de tamanho correto do mapa para evitar tela cinza/cortada
    setTimeout(() => {
      if (map) {
        map.invalidateSize();
      }
    }, 200);

    // Limpa todas as camadas criadas anteriormente (linhas, marcadores de rotas)
    mapElementsRef.current.forEach(layer => layer.remove());
    mapElementsRef.current = [];

    // Estruturas de controle para evitar pins duplicados de cidades
    const renderedOrigins = new Set<string>();
    const renderedCrimeCities = new Set<string>();

    // Filtra as quadrilhas a exibir rotas (se uma específica estiver selecionada)
    const gangsToDraw = selectedGangId 
      ? db.gangs.filter(g => g.id === selectedGangId)
      : db.gangs;

    // Para cada quadrilha, desenha a sua origem e as suas rotas
    gangsToDraw.forEach(gang => {
      const originCoords = getCityCoords(gang.originCity || '');

      // Desenha o marcador de Origem (Apenas se ainda não desenhado para essa quadrilha)
      if (!renderedOrigins.has(`${gang.id}-${gang.originCity}`)) {
        const originPopupHtml = `
          <div style="font-family: sans-serif; color: #f8fafc; padding: 4px;">
            <h4 style="margin: 0 0 4px 0; color: ${gang.color}; font-size: 13px; font-weight: 600;">Base: ${gang.originCity}</h4>
            <p style="margin: 0; font-size: 11px;">Cidade sede da quadrilha: <b>${gang.name}</b></p>
          </div>
        `;

        const originIcon = L.divIcon({
          className: 'custom-origin-icon',
          html: `<div style="background-color: ${gang.color}; width: 14px; height: 14px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px ${gang.color};"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });

        const originMarker = L.marker(originCoords, { icon: originIcon })
          .bindPopup(originPopupHtml)
          .addTo(map);

        mapElementsRef.current.push(originMarker);
        renderedOrigins.add(`${gang.id}-${gang.originCity}`);
      }

      // Encontra os crimes ativos desta quadrilha no período selecionado
      const gangCrimes = activeCrimes.filter(c => c.gangId === gang.id);

      gangCrimes.forEach(crime => {
        const targetCoords = crime.coordinates && crime.coordinates.length >= 2 && !(crime.coordinates[0] === 0 && crime.coordinates[1] === 0) 
          ? crime.coordinates 
          : getCityCoords(crime.city);

        // 1. Desenha a linha de rota (Origem -> Destino do Crime)
        const polyline = L.polyline([originCoords, targetCoords], {
          color: gang.color,
          weight: 3,
          dashArray: '6, 8',
          opacity: 0.85
        }).addTo(map);

        // Adiciona um popup à linha indicando o fluxo
        polyline.bindPopup(`
          <div style="font-family: sans-serif; color: #f8fafc;">
            <p style="margin: 0; font-size: 11px;">Rota estimada de atuação da quadrilha <b>${gang.name}</b></p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: var(--text-secondary);">Deslocamento: ${gang.originCity} ➔ ${crime.city}</p>
          </div>
        `);

        mapElementsRef.current.push(polyline);

        // 2. Calcula o ângulo matemático da rota para rotacionar a seta de direção
        const dy = targetCoords[0] - originCoords[0]; // Lat dif
        const dx = targetCoords[1] - originCoords[1]; // Lng dif
        const angle = -Math.atan2(dy, dx) * (180 / Math.PI); // CSS rotação no sentido horário

        // Calcula o ponto médio para desenhar a seta de fluxo
        const midpoint: [number, number] = [
          (originCoords[0] + targetCoords[0]) / 2,
          (originCoords[1] + targetCoords[1]) / 2
        ];

        const arrowIcon = L.divIcon({
          className: 'direction-arrow-wrapper',
          html: `<div style="color: ${gang.color}; transform: rotate(${angle}deg); font-size: 18px; font-weight: bold; text-shadow: 0 0 3px black; user-select: none;">➔</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const arrowMarker = L.marker(midpoint, { icon: arrowIcon }).addTo(map);
        mapElementsRef.current.push(arrowMarker);

        // 3. Desenha o pin do local do crime (Apenas se ainda não renderizado)
        const keyCrimeCity = `${gang.id}-${crime.city}`;
        if (!renderedCrimeCities.has(keyCrimeCity)) {
          const crimeCityPopup = `
            <div style="font-family: sans-serif; color: #f8fafc; padding: 4px;">
              <h4 style="margin: 0 0 4px 0; color: #ef4444; font-size: 13px;">Ataque: ${crime.city}</h4>
              <p style="margin: 0 0 2px 0; font-size: 11px;"><b>Local:</b> ${crime.establishment}</p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;"><b>Data do Fato:</b> ${new Date(crime.date).toLocaleDateString('pt-BR')}</p>
            </div>
          `;

          const crimeIcon = L.divIcon({
            className: 'custom-crime-icon',
            html: `<div style="background-color: #ef4444; width: 10px; height: 10px; border: 1.5px solid white; border-radius: 50%;"></div>`,
            iconSize: [10, 10],
            iconAnchor: [5, 5]
          });

          const crimeMarker = L.marker(targetCoords, { icon: crimeIcon })
            .bindPopup(crimeCityPopup)
            .addTo(map);

          mapElementsRef.current.push(crimeMarker);
          renderedCrimeCities.add(keyCrimeCity);
        }
      });
    });

  }, [db.gangs, db.crimes, selectedGangId, timelineDate]);

  // Limpeza ao desmontar
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="tab-container">
      {/* Filtro por Quadrilha */}
      <div className="search-bar-row">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={18} className="text-secondary" />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Isolar Quadrilha:</span>
          <select 
            className="form-select" 
            style={{ width: '220px', padding: '6px 12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
            value={selectedGangId || ''}
            onChange={(e) => setSelectedGangId(e.target.value || null)}
          >
            <option value="">Mostrar Todas as Rotas</option>
            {db.gangs.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Calendar size={18} className="text-accent" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Exibindo dados até: <b>{new Date(timelineDate).toLocaleDateString('pt-BR')}</b>
          </span>
        </div>
      </div>

      {/* Grid de Conteúdo */}
      <div className="routes-layout">
        {/* Mapa e Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel">
            <div className="map-wrapper dark-map" ref={mapContainerRef}></div>
          </div>

          {/* Controle Timeline */}
          <div className="glass-panel timeline-panel">
            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Linha do Tempo Cumulativa de Fatos
              </h4>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Arraste para visualizar a expansão das rotas
              </span>
            </div>

            <div className="timeline-slider-row">
              <button 
                className="btn-primary" 
                style={{ padding: '8px', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>

              <input 
                type="range"
                className="timeline-slider"
                min={0}
                max={sortedDates.length - 1}
                value={sortedDates.indexOf(timelineDate) !== -1 ? sortedDates.indexOf(timelineDate) : 0}
                onChange={(e) => {
                  setIsPlaying(false);
                  const idx = parseInt(e.target.value, 10);
                  if (sortedDates[idx]) setTimelineDate(sortedDates[idx]);
                }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>{new Date(minDate).toLocaleDateString('pt-BR')} (Primeiro Registro)</span>
              <span>{new Date(maxDate).toLocaleDateString('pt-BR')} (Atualidade)</span>
            </div>
          </div>
        </div>

        {/* Sidebar com Lista de Atuações */}
        <div className="glass-panel" style={{ height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            Resumo de Mobilidade
          </h3>
          
          <div className="cities-list-sidebar">
            {db.gangs.map(gang => {
              const origin = gang.originCity;
              // Filtra cidades atingidas por essa gangue até a data selecionada
              const targetCities = Array.from(new Set(
                db.crimes
                  .filter(c => c.gangId === gang.id && new Date(c.date).getTime() <= new Date(timelineDate).getTime())
                  .map(c => c.city)
              ));

              const isHighlighted = selectedGangId === null || selectedGangId === gang.id;

              return (
                <div 
                  key={gang.id} 
                  className={`city-pill-card ${isHighlighted ? '' : 'disabled'}`}
                  style={{ 
                    borderLeft: `4px solid ${gang.color}`, 
                    opacity: isHighlighted ? 1 : 0.4,
                    cursor: 'pointer' 
                  }}
                  onClick={() => setSelectedGangId(selectedGangId === gang.id ? null : gang.id)}
                >
                  <div style={{ flexGrow: 1 }}>
                    <h4 style={{ fontWeight: 'bold' }}>{gang.name}</h4>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', marginTop: '4px' }}>
                      <Home size={10} style={{ color: gang.color }} /> Base: {origin}
                    </p>
                    <p style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', fontSize: '0.75rem', marginTop: '4px' }}>
                      <MapPin size={10} className="text-danger" style={{ marginTop: '2px' }} /> 
                      Destinos: {targetCities.length > 0 ? targetCities.join(', ') : 'Nenhum ativo'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
