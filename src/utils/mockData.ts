import type { Gang, Suspect, Crime, CityLocation, SystemUser, SuspectVehicle } from '../types';

export const CITIES_RS: Record<string, CityLocation> = {
  // Metrópole e Região Metropolitana
  'Porto Alegre': { name: 'Porto Alegre', coordinates: [-30.0346, -51.2177] },
  'Canoas': { name: 'Canoas', coordinates: [-29.9186, -51.1831] },
  'Gravataí': { name: 'Gravataí', coordinates: [-29.9440, -50.9916] },
  'Viamão': { name: 'Viamão', coordinates: [-30.0808, -51.0233] },
  'Novo Hamburgo': { name: 'Novo Hamburgo', coordinates: [-29.6844, -51.1311] },
  'São Leopoldo': { name: 'São Leopoldo', coordinates: [-29.7594, -51.1486] },
  'Pelotas': { name: 'Pelotas', coordinates: [-31.7654, -52.3376] },
  'Caxias do Sul': { name: 'Caxias do Sul', coordinates: [-29.1681, -51.1794] },
  'Santa Maria': { name: 'Santa Maria', coordinates: [-29.6842, -53.8069] },
  'Passo Fundo': { name: 'Passo Fundo', coordinates: [-28.2612, -52.4083] },
  'Uruguaiana': { name: 'Uruguaiana', coordinates: [-29.7547, -57.0861] },
  'Santa Cruz do Sul': { name: 'Santa Cruz do Sul', coordinates: [-29.7178, -52.4258] },
  'Cachoeira do Sul': { name: 'Cachoeira do Sul', coordinates: [-30.0391, -52.8978] },
  'Lajeado': { name: 'Lajeado', coordinates: [-29.4665, -51.9619] },
  'Bento Gonçalves': { name: 'Bento Gonçalves', coordinates: [-29.1711, -51.5173] },
  'Erechim': { name: 'Erechim', coordinates: [-27.6341, -52.2739] },
  'Cruz Alta': { name: 'Cruz Alta', coordinates: [-28.6386, -53.6067] },
  // Serra Gaúcha
  'Farroupilha': { name: 'Farroupilha', coordinates: [-29.2264, -51.3468] },
  'Garibaldi': { name: 'Garibaldi', coordinates: [-29.2553, -51.5319] },
  'Flores da Cunha': { name: 'Flores da Cunha', coordinates: [-29.0278, -51.1850] },
  'São Marcos': { name: 'São Marcos', coordinates: [-28.9683, -51.0688] },
  'Nova Prata': { name: 'Nova Prata', coordinates: [-28.7803, -51.6129] },
  'Guaporé': { name: 'Guaporé', coordinates: [-28.8349, -51.8929] },
  'Antônio Prado': { name: 'Antônio Prado', coordinates: [-28.8572, -51.2886] },
  'Vacaria': { name: 'Vacaria', coordinates: [-28.5122, -50.9341] },
  'São Francisco de Paula': { name: 'São Francisco de Paula', coordinates: [-29.4414, -50.5827] },
  'Gramado': { name: 'Gramado', coordinates: [-29.3789, -50.8733] },
  'Canela': { name: 'Canela', coordinates: [-29.3630, -50.8164] },
  'Carlos Barbosa': { name: 'Carlos Barbosa', coordinates: [-29.2972, -51.5029] },
  'Veranópolis': { name: 'Veranópolis', coordinates: [-28.9364, -51.5547] },
  // Vale do Rio dos Sinos / Litoral
  'Sapiranga': { name: 'Sapiranga', coordinates: [-29.6394, -51.0040] },
  'Campo Bom': { name: 'Campo Bom', coordinates: [-29.6793, -51.0548] },
  'Dois Irmãos': { name: 'Dois Irmãos', coordinates: [-29.5796, -51.0905] },
  'Estância Velha': { name: 'Estância Velha', coordinates: [-29.6484, -51.1758] },
  'Ivoti': { name: 'Ivoti', coordinates: [-29.6039, -51.1555] },
  'Portão': { name: 'Portão', coordinates: [-29.6953, -51.2449] },
  'Sapucaia do Sul': { name: 'Sapucaia do Sul', coordinates: [-29.8304, -51.1444] },
  'Esteio': { name: 'Esteio', coordinates: [-29.8591, -51.1768] },
  'Cachoeirinha': { name: 'Cachoeirinha', coordinates: [-29.9534, -51.0924] },
  'Alvorada': { name: 'Alvorada', coordinates: [-29.9934, -51.0807] },
  'Guaíba': { name: 'Guaíba', coordinates: [-30.1130, -51.3240] },
  'Torres': { name: 'Torres', coordinates: [-29.3361, -49.7283] },
  'Capão da Canoa': { name: 'Capão da Canoa', coordinates: [-29.7470, -50.0141] },
  'Tramandaí': { name: 'Tramandaí', coordinates: [-29.9840, -50.1314] },
  'Osório': { name: 'Osório', coordinates: [-29.8875, -50.2699] },
  // Vale do Taquari
  'Estrela': { name: 'Estrela', coordinates: [-29.4975, -51.9581] },
  'Encantado': { name: 'Encantado', coordinates: [-29.2339, -51.8714] },
  'Arroio do Meio': { name: 'Arroio do Meio', coordinates: [-29.4029, -51.9463] },
  'Teutônia': { name: 'Teutônia', coordinates: [-29.4408, -51.8054] },
  'Venâncio Aires': { name: 'Venâncio Aires', coordinates: [-29.6082, -52.1893] },
  // Centro / Depressão Central
  'São Gabriel': { name: 'São Gabriel', coordinates: [-30.3394, -54.3196] },
  'Rosário do Sul': { name: 'Rosário do Sul', coordinates: [-30.2572, -54.9163] },
  'Bagé': { name: 'Bagé', coordinates: [-31.3308, -54.1067] },
  'Dom Pedrito': { name: 'Dom Pedrito', coordinates: [-30.9797, -54.6724] },
  'Alegrete': { name: 'Alegrete', coordinates: [-29.7839, -55.7923] },
  'Santana do Livramento': { name: 'Santana do Livramento', coordinates: [-30.8906, -55.5329] },
  'Quaraí': { name: 'Quaraí', coordinates: [-30.3850, -56.4519] },
  // Sul do Estado
  'Rio Grande': { name: 'Rio Grande', coordinates: [-32.0340, -52.0988] },
  'São Lourenço do Sul': { name: 'São Lourenço do Sul', coordinates: [-31.3693, -51.9789] },
  'Canguçu': { name: 'Canguçu', coordinates: [-31.3944, -52.6772] },
  'Camaquã': { name: 'Camaquã', coordinates: [-30.8524, -51.8115] },
  'Encruzilhada do Sul': { name: 'Encruzilhada do Sul', coordinates: [-30.5432, -52.5224] },
  'Caçapava do Sul': { name: 'Caçapava do Sul', coordinates: [-30.5146, -53.4902] },
  // Planalto / Norte
  'Ijuí': { name: 'Ijuí', coordinates: [-28.3878, -53.9148] },
  'Santo Ângelo': { name: 'Santo Ângelo', coordinates: [-28.2997, -54.2631] },
  'Santa Rosa': { name: 'Santa Rosa', coordinates: [-27.8706, -54.4814] },
  'Três Passos': { name: 'Três Passos', coordinates: [-27.4551, -53.9329] },
  'Frederico Westphalen': { name: 'Frederico Westphalen', coordinates: [-27.3586, -53.3940] },
  'Palmeira das Missões': { name: 'Palmeira das Missões', coordinates: [-27.8988, -53.3128] },
  'Sarandi': { name: 'Sarandi', coordinates: [-27.9424, -52.9261] },
  'Carazinho': { name: 'Carazinho', coordinates: [-28.2843, -52.7871] },
  'Não-Me-Toque': { name: 'Não-Me-Toque', coordinates: [-28.4568, -52.8219] },
  'Soledade': { name: 'Soledade', coordinates: [-28.8192, -52.5095] },
  'Marau': { name: 'Marau', coordinates: [-28.4503, -52.2055] },
  'Tapejara': { name: 'Tapejara', coordinates: [-28.0656, -52.0085] },
  'Getúlio Vargas': { name: 'Getúlio Vargas', coordinates: [-27.8918, -52.2256] },
  'Sananduva': { name: 'Sananduva', coordinates: [-27.9486, -51.8072] },
  // Alto Uruguai / Fronteira
  'Chapecó': { name: 'Chapecó', coordinates: [-27.1009, -52.6151] },
  'São Miguel do Oeste': { name: 'São Miguel do Oeste', coordinates: [-26.7233, -53.5119] },
  'Tenente Portela': { name: 'Tenente Portela', coordinates: [-27.3717, -53.7557] },
  'Iraí': { name: 'Iraí', coordinates: [-27.1939, -53.2361] },
  'Erval Seco': { name: 'Erval Seco', coordinates: [-27.5380, -53.4967] },
  // Noroeste
  'Panambi': { name: 'Panambi', coordinates: [-28.2929, -53.5020] },
  'Condor': { name: 'Condor', coordinates: [-28.2102, -53.8827] },
  'Giruá': { name: 'Giruá', coordinates: [-28.0297, -54.3560] },
  'Porto Xavier': { name: 'Porto Xavier', coordinates: [-27.9059, -55.1388] },
  'São Borja': { name: 'São Borja', coordinates: [-28.6585, -55.9743] },
  'Itaqui': { name: 'Itaqui', coordinates: [-29.1276, -56.5546] },
  'Maçambará': { name: 'Maçambará', coordinates: [-29.1436, -56.0786] },
  // Outras cidades importantes
  'Montenegro': { name: 'Montenegro', coordinates: [-29.6905, -51.4596] },
  'Taquara': { name: 'Taquara', coordinates: [-29.6509, -50.7819] },
  'Rolante': { name: 'Rolante', coordinates: [-29.6525, -50.5800] },
  'Parobé': { name: 'Parobé', coordinates: [-29.6271, -50.8386] },
  'Igrejinha': { name: 'Igrejinha', coordinates: [-29.5749, -50.7893] },
  'Três Coroas': { name: 'Três Coroas', coordinates: [-29.5156, -50.7776] },
  'Nova Petrópolis': { name: 'Nova Petrópolis', coordinates: [-29.3773, -51.1155] },
  'Feliz': { name: 'Feliz', coordinates: [-29.4553, -51.3084] },
  'São Sebastião do Caí': { name: 'São Sebastião do Caí', coordinates: [-29.5846, -51.3750] },
  'Bom Princípio': { name: 'Bom Princípio', coordinates: [-29.4798, -51.3596] },
  'Triunfo': { name: 'Triunfo', coordinates: [-29.8574, -51.7192] },
  'General Câmara': { name: 'General Câmara', coordinates: [-29.8921, -51.7883] },
  'Tapes': { name: 'Tapes', coordinates: [-30.6673, -51.3956] },
  'Mostardas': { name: 'Mostardas', coordinates: [-31.1058, -50.9182] },
  'Tavares': { name: 'Tavares', coordinates: [-31.2875, -51.0042] },
  'São José do Norte': { name: 'São José do Norte', coordinates: [-32.0105, -52.0272] },
  'Santa Vitória do Palmar': { name: 'Santa Vitória do Palmar', coordinates: [-33.5236, -53.3651] },
  'Jaguarão': { name: 'Jaguarão', coordinates: [-32.5668, -53.3784] },
  'Herval': { name: 'Herval', coordinates: [-32.0186, -53.4018] },
  'Arroio Grande': { name: 'Arroio Grande', coordinates: [-32.2354, -53.0842] },
};

// Normaliza texto removendo acentos e convertendo para minúsculas
const normalizeText = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const getCityCoords = (cityName: string): [number, number] => {
  if (!cityName) return [-30.0346, -51.2177];
  const normalized = normalizeText(cityName);
  for (const [key, city] of Object.entries(CITIES_RS)) {
    if (normalizeText(key) === normalized) {
      return city.coordinates;
    }
  }
  // Busca parcial — permite encontrar "Passo Fundo" digitando "passo fundo"
  for (const [key, city] of Object.entries(CITIES_RS)) {
    if (normalizeText(key).includes(normalized) || normalized.includes(normalizeText(key))) {
      return city.coordinates;
    }
  }
  return [-30.0346, -51.2177]; // Porto Alegre como padrão
};


// SVG silhueta padrão (base64) para suspeitos sem foto
const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%232a2f3d"/><circle cx="100" cy="80" r="40" fill="%234b5563"/><path d="M40,160 C40,120 160,120 160,160 Z" fill="%234b5563"/></svg>`;

export const MOCK_USERS: SystemUser[] = [
  {
    id: 'user-admin',
    name: 'Administrador Nexos',
    email: '1993lumendes@gmail.com',
    // Senha gerenciada via hash em auth.ts — não armazenar texto puro aqui
    role: 'Administrador do Sistema',
    assignmentCity: 'Lajeado',
    lastLogin: 'Nunca (Acesso Inicial)',
    status: 'active'
  },
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
