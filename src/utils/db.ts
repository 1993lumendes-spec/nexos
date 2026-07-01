import type { Gang, Suspect, Crime, SystemUser, SuspectVehicle } from '../types';
import { 
  MOCK_GANGS, 
  MOCK_SUSPECTS, 
  MOCK_CRIMES, 
  MOCK_USERS, 
  MOCK_VEHICLES 
} from './mockData';

export interface NexosDatabase {
  gangs: Gang[];
  suspects: Suspect[];
  crimes: Crime[];
  users: SystemUser[];
  vehicles: SuspectVehicle[];
}

// Chave V3 resetada para limpar de vez qualquer dado fictício que tenha ficado em cache
const DB_KEY = 'nexos_db_producao_v3';

export const loadDatabase = (): NexosDatabase => {
  try {
    const data = localStorage.getItem(DB_KEY);
    if (!data) {
      // Inicia 100% limpo, sem carregar dados fictícios por padrão
      const cleanDb: NexosDatabase = {
        gangs: [],
        suspects: [],
        crimes: [],
        users: [],
        vehicles: []
      };
      saveDatabase(cleanDb);
      return cleanDb;
    }
    const parsed = JSON.parse(data);
    return {
      gangs: parsed.gangs || [],
      suspects: parsed.suspects || [],
      crimes: parsed.crimes || [],
      users: parsed.users || [],
      vehicles: parsed.vehicles || []
    };
  } catch (error) {
    console.error('Erro ao carregar o banco de dados do LocalStorage:', error);
    return {
      gangs: [],
      suspects: [],
      crimes: [],
      users: [],
      vehicles: []
    };
  }
};

export const saveDatabase = (db: NexosDatabase): void => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (error) {
    console.error('Erro ao salvar o banco de dados no LocalStorage:', error);
  }
};

export const getDemoDatabase = (): NexosDatabase => {
  return {
    gangs: MOCK_GANGS,
    suspects: MOCK_SUSPECTS,
    crimes: MOCK_CRIMES,
    users: MOCK_USERS,
    vehicles: MOCK_VEHICLES
  };
};

export const exportDatabaseToJson = (db: NexosDatabase): void => {
  try {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(db, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('download', `nexos_backup_${dateStr}.json`);
    
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (error) {
    console.error('Erro ao exportar banco de dados:', error);
  }
};

export const importDatabaseFromJson = (
  file: File,
  onSuccess: (db: NexosDatabase) => void,
  onError: (err: string) => void
): void => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const parsed = JSON.parse(content);
      
      if (parsed && Array.isArray(parsed.gangs) && Array.isArray(parsed.suspects) && Array.isArray(parsed.crimes)) {
        const fullDb: NexosDatabase = {
          gangs: parsed.gangs,
          suspects: parsed.suspects,
          crimes: parsed.crimes,
          users: parsed.users || [],
          vehicles: parsed.vehicles || []
        };
        saveDatabase(fullDb);
        onSuccess(fullDb);
      } else {
        onError('Formato de arquivo inválido. O arquivo de backup deve conter quadrilhas, suspeitos e crimes.');
      }
    } catch (error) {
      onError('Erro ao ler ou processar o arquivo JSON.');
    }
  };
  reader.readAsText(file);
};
