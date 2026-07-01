export interface SuspectPhoto {
  id: string;
  url: string;
  description: string; // Ex: "Câmera de Segurança - Lojas Americanas"
  location: string;    // Cidade/Local associado
  date?: string;       // Data do fato/registro
}

export interface Suspect {
  id: string;
  name: string;
  rg: string;
  aliases: string;        // Apelidos
  primaryPhoto: string;   // URL (ou base64) da foto principal
  photos: SuspectPhoto[]; // Outras fotos cadastradas
  gangId: string;         // ID da quadrilha (ou "" se avulso)
  criminalRecord: string; // Antecedentes criminais resumidos
  status: 'active' | 'arrested' | 'investigating';
  birthDate?: string;
  modusOperandi?: string; // Como costuma agir
}

export interface Gang {
  id: string;
  name: string;
  originCity: string;
  color: string;         // Cor para rotas e visualizações do grafo
  description: string;
}

export interface Crime {
  id: string;
  crimeNumber?: string;  // Número da Ocorrência / BO
  date: string;          // ISO data (YYYY-MM-DD)
  establishment: string; // Nome do estabelecimento
  city: string;          // Cidade do RS
  address: string;       // Endereço
  gangId: string;        // ID da quadrilha suspeita
  suspectsInvolved: string[]; // IDs dos suspeitos envolvidos
  vehiclesInvolved?: string[]; // IDs dos veículos envolvidos
  description: string;
  coordinates: [number, number]; // [latitude, longitude]
  stolenValue?: number;  // Valor aproximado do prejuízo
}

export interface CityLocation {
  name: string;
  coordinates: [number, number];
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role?: string;          // Ex: "Delegado", "Inspetor", "Escrivão"
  assignmentCity?: string;// Cidade de Lotação (ex: Porto Alegre)
  lastLogin: string;     // ISO data ou string descritiva
  status: 'active' | 'inactive';
}

export interface SuspectVehicle {
  id: string;
  plate: string;         // Placa (ex: AAA-1234 ou ABC1D23)
  brandModel: string;    // Marca/Modelo (ex: VW Gol, Toyota Hilux)
  color: string;         // Cor (ex: Vermelho, Prata)
  gangId: string;        // ID da quadrilha vinculada (pode ser "")
  suspectId: string;     // ID do suspeito associado (pode ser "")
  description: string;   // Observações adicionais
  photo?: string;        // Foto do veículo (Base64 ou URL)
}
