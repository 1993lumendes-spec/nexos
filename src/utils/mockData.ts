import type { Gang, Suspect, Crime, CityLocation, SystemUser, SuspectVehicle } from '../types';

export const CITIES_RS: Record<string, CityLocation> = {
  'Porto Alegre': { name: 'Porto Alegre', coordinates: [-30.0346, -51.2177] },
  'Caxias do Sul': { name: 'Caxias do Sul', coordinates: [-29.1681, -51.1794] },
  'Passo Fundo': { name: 'Passo Fundo', coordinates: [-28.2612, -52.4083] },
  'Santa Maria': { name: 'Santa Maria', coordinates: [-29.6842, -53.8069] },
  'Pelotas': { name: 'Pelotas', coordinates: [-31.7654, -52.3376] },
  'Lajeado': { name: 'Lajeado', coordinates: [-29.4665, -51.9619] },
  'Bento Gonçalves': { name: 'Bento Gonçalves', coordinates: [-29.1711, -51.5173] },
  'Erechim': { name: 'Erechim', coordinates: [-27.6341, -52.2739] },
  'Cruz Alta': { name: 'Cruz Alta', coordinates: [-28.6386, -53.6067] },
  'Novo Hamburgo': { name: 'Novo Hamburgo', coordinates: [-29.6844, -51.1311] },
  'Uruguaiana': { name: 'Uruguaiana', coordinates: [-29.7547, -57.0861] },
  'Santa Cruz do Sul': { name: 'Santa Cruz do Sul', coordinates: [-29.7178, -52.4258] }
};

export const getCityCoords = (cityName: string): [number, number] => {
  const normalized = cityName.trim().toLowerCase();
  for (const [key, city] of Object.entries(CITIES_RS)) {
    if (key.toLowerCase() === normalized) {
      return city.coordinates;
    }
  }
  return [-30.0346, -51.2177]; // Porto Alegre como padrão
};

// SVG silhueta padrão (base64) para suspeitos sem foto
const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%232a2f3d"/><circle cx="100" cy="80" r="40" fill="%234b5563"/><path d="M40,160 C40,120 160,120 160,160 Z" fill="%234b5563"/></svg>`;

export const MOCK_USERS: SystemUser[] = [
  {
    id: 'user-1',
    name: 'Inspetor Marcelo Rodrigues',
    email: 'marcelo.rodrigues@pc.rs.gov.br',
    role: 'Inspetor de Polícia',
    assignmentCity: 'Porto Alegre',
    lastLogin: '29/06/2026 - 12:45',
    status: 'active'
  },
  {
    id: 'user-2',
    name: 'Delegada Carla Hoffmann',
    email: 'carla.hoffmann@pc.rs.gov.br',
    role: 'Delegada de Polícia',
    assignmentCity: 'Caxias do Sul',
    lastLogin: '29/06/2026 - 11:30',
    status: 'active'
  },
  {
    id: 'user-3',
    name: 'Escrivão Tiago Santos',
    email: 'tiago.santos@pc.rs.gov.br',
    role: 'Escrivão de Polícia',
    assignmentCity: 'Passo Fundo',
    lastLogin: '28/06/2026 - 18:20',
    status: 'active'
  }
];

export const MOCK_GANGS: Gang[] = [
  {
    id: 'gang-1',
    name: 'Os Caixeiros do Vale',
    originCity: 'Novo Hamburgo',
    color: '#e74c3c', // Vermelho
    description: 'Quadrilha especializada no arrombamento de cofres de lojas de departamentos durante a madrugada, com uso de maçaricos e ferramentas hidráulicas.'
  },
  {
    id: 'gang-2',
    name: 'Gangue do Maçarico',
    originCity: 'Porto Alegre',
    color: '#f39c12', // Laranja
    description: 'Focada em furtos qualificados noturnos em redes de farmácias e joalherias. Desativam alarmes e monitoramento cortando fibras óticas da rua.'
  },
  {
    id: 'gang-3',
    name: 'Os Nômades da Fronteira',
    originCity: 'Uruguaiana',
    color: '#3498db', // Azul
    description: 'Grupo que se desloca por longas distâncias no interior do RS. Atuam roubando e furtando defensivos agrícolas e lojas de eletrônicos.'
  },
  {
    id: 'gang-4',
    name: 'Os Linha de Frente',
    originCity: 'Passo Fundo',
    color: '#9b59b6', // Roxo
    description: 'Conhecidos pela violência e rapidez nas ações. Costumam arrombar vitrines de lojas com veículos roubados (método Gangue da Marcha Ré).'
  }
];

export const MOCK_SUSPECTS: Suspect[] = [
  {
    id: 'susp-1',
    name: 'Carlos Roberto da Silva',
    rg: '1092837465',
    aliases: 'Beto Maçarico',
    primaryPhoto: DEFAULT_AVATAR,
    photos: [
      {
        id: 'photo-1-1',
        url: DEFAULT_AVATAR,
        description: 'Foto Prontuário - Delegacia de Caxias do Sul',
        location: 'Caxias do Sul'
      },
      {
        id: 'photo-1-2',
        url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%232c3e50"/><text x="10" y="100" fill="white" font-size="12">Câmera Panvel - Lajeado</text></svg>`,
        description: 'Flagrante Câmera de Monitoramento Panvel',
        location: 'Lajeado'
      }
    ],
    gangId: 'gang-2', // Gangue do Maçarico
    criminalRecord: 'Indiciado por Furto Qualificado (art. 155, § 4º CP) 5 vezes, Associação Criminosa e Porte de Artefato Explosivo.',
    status: 'active',
    birthDate: '1988-04-12',
    modusOperandi: 'Operador direto do maçarico. Consegue violar cofres em menos de 15 minutos.'
  },
  {
    id: 'susp-2',
    name: 'Marcos Vieira',
    rg: '2039485716',
    aliases: 'Alemão, Neco',
    primaryPhoto: DEFAULT_AVATAR,
    photos: [
      {
        id: 'photo-2-1',
        url: DEFAULT_AVATAR,
        description: 'Identificação Civil RS',
        location: 'Porto Alegre'
      }
    ],
    gangId: 'gang-1', // Os Caixeiros do Vale
    criminalRecord: 'Passagens por Furto, Receptação de Veículo e adulteração de sinal identificador.',
    status: 'active',
    birthDate: '1992-09-25',
    modusOperandi: 'Responsável pela logística de transporte, fuga e locação de imóveis temporários nas cidades alvos.'
  },
  {
    id: 'susp-3',
    name: 'Juliano Prestes',
    rg: '6078912345',
    aliases: 'Juca',
    primaryPhoto: DEFAULT_AVATAR,
    photos: [
      {
        id: 'photo-3-1',
        url: DEFAULT_AVATAR,
        description: 'Foto Prontuário Pelotas',
        location: 'Pelotas'
      }
    ],
    gangId: 'gang-2', // Gangue do Maçarico, mas atua com Os Caixeiros do Vale
    criminalRecord: 'Condenado por furto qualificado, solto recentemente em regime semiaberto. Suspeito de fazer pontes entre quadrilhas do Vale dos Sinos e Porto Alegre.',
    status: 'investigating',
    birthDate: '1985-11-02',
    modusOperandi: 'Intermediário. Facilita o empréstimo de ferramentas especializadas e maçaricos entre os grupos.'
  },
  {
    id: 'susp-4',
    name: 'Alexandre dos Santos',
    rg: '3049586721',
    aliases: 'Nego Alexandre',
    primaryPhoto: DEFAULT_AVATAR,
    photos: [],
    gangId: 'gang-3', // Os Nômades da Fronteira
    criminalRecord: 'Associação Criminosa, Furto de Carga, Adulteração de placas.',
    status: 'arrested',
    birthDate: '1990-01-30',
    modusOperandi: 'Líder dos Nômades. Planeja as rotas de fuga utilizando estradas vicinais no interior do estado.'
  },
  {
    id: 'susp-5',
    name: 'Rodrigo Mendes',
    rg: '4058697832',
    aliases: 'Digo',
    primaryPhoto: DEFAULT_AVATAR,
    photos: [],
    gangId: 'gang-4', // Os Linha de Frente
    criminalRecord: 'Roubo a estabelecimento comercial (art. 157 CP), direção perigosa e porte ilegal de arma de fogo de uso permitido.',
    status: 'active',
    birthDate: '1995-07-15',
    modusOperandi: 'Motorista das ações de marcha ré. Especialista em fuga em alta velocidade.'
  },
  {
    id: 'susp-6',
    name: 'Fabio Souza',
    rg: '5067891234',
    aliases: 'Fabinho, Gordo',
    primaryPhoto: DEFAULT_AVATAR,
    photos: [],
    gangId: 'gang-1', // Caixeiros do Vale, mas tem conexões com Juliano
    criminalRecord: 'Furto qualificado e estelionato.',
    status: 'active',
    birthDate: '1989-12-22',
    modusOperandi: 'Olheiro e instalador de dispositivos bloqueadores de sinal (jammer).'
  }
];

export const MOCK_CRIMES: Crime[] = [
  {
    id: 'crime-1',
    date: '2026-05-15',
    establishment: 'Lojas Colombo',
    city: 'Caxias do Sul',
    address: 'Av. Júlio de Castilhos, 1200 - Centro',
    gangId: 'gang-1',
    suspectsInvolved: ['susp-2', 'susp-6'],
    description: 'Arrombamento de cofre principal no subsolo. Levado R$ 45.000 em dinheiro e 30 smartphones. Sistema de alarme foi cortado.',
    coordinates: [-29.1681, -51.1794],
    stolenValue: 85000
  },
  {
    id: 'crime-2',
    date: '2026-05-28',
    establishment: 'Farmácia São João',
    city: 'Passo Fundo',
    address: 'Rua Morom, 1500 - Centro',
    gangId: 'gang-2',
    suspectsInvolved: ['susp-1', 'susp-3'],
    description: 'Uso de maçarico para abertura do cofre dos caixas. Levaram R$ 12.000. Câmeras de segurança do quarteirão inteiro apagaram momentos antes.',
    coordinates: [-28.2612, -52.4083],
    stolenValue: 12000
  },
  {
    id: 'crime-3',
    date: '2026-06-02',
    establishment: 'Lojas Americanas',
    city: 'Lajeado',
    address: 'Rua Júlio de Castilhos, 800 - Florestal',
    gangId: 'gang-1',
    suspectsInvolved: ['susp-2', 'susp-3', 'susp-6'],
    description: 'Ação rápida na madrugada. Cortaram os cabos de telefonia e invadiram pelos fundos. Cofre arrombado. Conexão direta identificada com integrantes da Gangue do Maçarico.',
    coordinates: [-29.4665, -51.9619],
    stolenValue: 60000
  },
  {
    id: 'crime-4',
    date: '2026-06-10',
    establishment: 'Magazine Luiza',
    city: 'Bento Gonçalves',
    address: 'Via Cavour, 150 - Centro',
    gangId: 'gang-1',
    suspectsInvolved: ['susp-2'],
    description: 'Arrombamento de porta pantográfica frontal com auxílio de macaco hidráulico. Subtração de aparelhos de TV e som.',
    coordinates: [-29.1711, -51.5173],
    stolenValue: 35000
  },
  {
    id: 'crime-5',
    date: '2026-06-18',
    establishment: 'Ponto Frio',
    city: 'Santa Maria',
    address: 'Calçadão Salvador Isaia, 340',
    gangId: 'gang-3',
    suspectsInvolved: ['susp-4'],
    description: 'Furto qualificado noturno. Invadiram pelo telhado removendo telhas de amianto. Desceram diretamente no estoque de celulares.',
    coordinates: [-29.6842, -53.8069],
    stolenValue: 110000
  },
  {
    id: 'crime-6',
    date: '2026-06-22',
    establishment: 'Joalheria D’Paula',
    city: 'Erechim',
    address: 'Av. Maurício Cardoso, 45',
    gangId: 'gang-2',
    suspectsInvolved: ['susp-1', 'susp-3'],
    description: 'Alarme burlado por jammer de sinal. Furto de joias e relógios avaliados em R$ 150.000. Encontrados vestígios de maçarico.',
    coordinates: [-27.6341, -52.2739],
    stolenValue: 150000
  },
  {
    id: 'crime-7',
    date: '2026-06-26',
    establishment: 'Pompéia',
    city: 'Cruz Alta',
    address: 'Rua Pinheiro Machado, 780',
    gangId: 'gang-4',
    suspectsInvolved: ['susp-5'],
    description: 'Método marcha ré. Utilizaram um VW Gol cinza roubado para estourar a vitrine e roubar dezenas de jaquetas de couro e eletrônicos em 2 minutos.',
    coordinates: [-28.6386, -53.6067],
    stolenValue: 28000
  }
];

export const MOCK_VEHICLES: SuspectVehicle[] = [
  {
    id: 'veh-1',
    plate: 'IJK5G42',
    brandModel: 'Toyota Hilux',
    color: 'Prata',
    gangId: 'gang-1',
    suspectId: 'susp-2',
    description: 'Caminhonete clonada avistada em Passo Fundo e Lajeado prestando apoio a furtos de depósitos. Película escura.'
  },
  {
    id: 'veh-2',
    plate: 'IPO9281',
    brandModel: 'VW Gol G5',
    color: 'Cinza',
    gangId: 'gang-4',
    suspectId: 'susp-5',
    description: 'Veículo com registro de furto utilizado nas ações de arrombamento por marcha ré. Para-choque traseiro amassado.'
  }
];
