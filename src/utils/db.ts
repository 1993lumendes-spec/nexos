import type { Gang, Suspect, Crime, SystemUser, SuspectVehicle } from '../types';
import { 
  MOCK_GANGS, 
  MOCK_SUSPECTS, 
  MOCK_CRIMES, 
  MOCK_USERS, 
  MOCK_VEHICLES 
} from './mockData';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { ADMIN_PASSWORD_HASH } from './auth';

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
    const oldKeys = [
      'nexos_db',
      'nexos_db_producao',
      'nexos_db_producao_v2',
      'nexos_db_v2',
      'nexos_db_v1',
      'nexos_database',
      'nexos_state'
    ];
    
    let data = localStorage.getItem(DB_KEY);
    if (!data) {
      // Procura em chaves antigas para migrar dados
      for (const oldKey of oldKeys) {
        const oldData = localStorage.getItem(oldKey);
        if (oldData) {
          console.log(`Detectada chave de banco antiga: "${oldKey}". Migrando dados para "${DB_KEY}"...`);
          data = oldData;
          localStorage.setItem(DB_KEY, oldData);
          break;
        }
      }
    }

    let db: NexosDatabase;
    if (!data) {
      // Inicia limpo, mas com o administrador mestre pré-semeado
      db = {
        gangs: [],
        suspects: [],
        crimes: [],
        users: [],
        vehicles: []
      };
    } else {
      const parsed = JSON.parse(data);
      db = {
        gangs: parsed.gangs || [],
        suspects: parsed.suspects || [],
        crimes: parsed.crimes || [],
        users: parsed.users || [],
        vehicles: parsed.vehicles || []
      };
    }

    // Auto-semeia ou atualiza a senha do administrador se o hash mudar no código
    const adminUser = db.users.find(u => u.email.toLowerCase() === '1993lumendes@gmail.com');
    if (!adminUser) {
      db.users.push({
        id: 'user-admin',
        name: 'Administrador Nexos',
        email: '1993lumendes@gmail.com',
        password: ADMIN_PASSWORD_HASH,
        role: 'Administrador do Sistema',
        assignmentCity: 'Lajeado',
        lastLogin: 'Nunca (Acesso Inicial)',
        status: 'active'
      });
      saveDatabase(db);
    } else if (adminUser.password !== ADMIN_PASSWORD_HASH) {
      adminUser.password = ADMIN_PASSWORD_HASH;
      saveDatabase(db);
    }
    return db;
  } catch (error) {
    console.error('Erro ao carregar o banco de dados do LocalStorage:', error);
    return {
      gangs: [],
      suspects: [],
      crimes: [],
      users: [
        {
          id: 'user-admin',
          name: 'Administrador Nexos',
          email: '1993lumendes@gmail.com',
          password: ADMIN_PASSWORD_HASH,
          role: 'Administrador do Sistema',
          assignmentCity: 'Lajeado',
          lastLogin: 'Nunca (Acesso Inicial)',
          status: 'active'
        }
      ],
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

export const loadDatabaseFromSupabase = async (): Promise<NexosDatabase | null> => {
  if (!isSupabaseConfigured()) return null;
  
  try {
    const [gangsRes, suspectsRes, crimesRes, usersRes, vehiclesRes] = await Promise.all([
      supabase!.from('gangs').select('*'),
      supabase!.from('suspects').select('*'),
      supabase!.from('crimes').select('*'),
      supabase!.from('users').select('*'),
      supabase!.from('vehicles').select('*')
    ]);
    
    if (gangsRes.error) throw gangsRes.error;
    if (suspectsRes.error) throw suspectsRes.error;
    if (crimesRes.error) throw crimesRes.error;
    if (usersRes.error) throw usersRes.error;
    if (vehiclesRes.error) throw vehiclesRes.error;
    
    const db: NexosDatabase = {
      gangs: gangsRes.data || [],
      suspects: suspectsRes.data || [],
      crimes: crimesRes.data || [],
      users: usersRes.data || [],
      vehicles: vehiclesRes.data || []
    };
    
    // Auto-semeia ou atualiza o administrador no Supabase
    const adminUser = db.users.find(u => u.email.toLowerCase() === '1993lumendes@gmail.com');
    if (!adminUser) {
      const adminUserObj: SystemUser = {
        id: 'user-admin',
        name: 'Administrador Nexos',
        email: '1993lumendes@gmail.com',
        password: ADMIN_PASSWORD_HASH,
        role: 'Administrador do Sistema',
        assignmentCity: 'Lajeado',
        lastLogin: 'Nunca (Acesso Inicial)',
        status: 'active'
      };
      db.users.push(adminUserObj);
      await supabase!.from('users').insert([adminUserObj]);
    } else if (adminUser.password !== ADMIN_PASSWORD_HASH) {
      adminUser.password = ADMIN_PASSWORD_HASH;
      await supabase!.from('users').update({ password: ADMIN_PASSWORD_HASH }).eq('email', '1993lumendes@gmail.com');
    }
    
    return db;
  } catch (error) {
    console.error('Erro ao buscar dados do Supabase:', error);
    return null;
  }
};

const getDeletedIds = (oldList: { id: string }[], newList: { id: string }[]): string[] => {
  const newIds = new Set(newList.map(item => item.id));
  return oldList.filter(item => !newIds.has(item.id)).map(item => item.id);
};

export const saveDatabaseToSupabase = async (db: NexosDatabase, oldDb?: NexosDatabase): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  
  try {
    // 1. Sincroniza Gangs
    if (db.gangs.length > 0) {
      const { error } = await supabase!.from('gangs').upsert(db.gangs);
      if (error) throw error;
    }
    if (oldDb) {
      const deletedGangs = getDeletedIds(oldDb.gangs, db.gangs);
      if (deletedGangs.length > 0) {
        await supabase!.from('gangs').delete().in('id', deletedGangs);
      }
    }
    
    // 2. Sincroniza Suspects
    if (db.suspects.length > 0) {
      const { error } = await supabase!.from('suspects').upsert(db.suspects);
      if (error) throw error;
    }
    if (oldDb) {
      const deletedSuspects = getDeletedIds(oldDb.suspects, db.suspects);
      if (deletedSuspects.length > 0) {
        await supabase!.from('suspects').delete().in('id', deletedSuspects);
      }
    }
    
    // 3. Sincroniza Crimes
    if (db.crimes.length > 0) {
      const { error } = await supabase!.from('crimes').upsert(db.crimes);
      if (error) throw error;
    }
    if (oldDb) {
      const deletedCrimes = getDeletedIds(oldDb.crimes, db.crimes);
      if (deletedCrimes.length > 0) {
        await supabase!.from('crimes').delete().in('id', deletedCrimes);
      }
    }
    
    // 4. Sincroniza Users
    if (db.users.length > 0) {
      const { error } = await supabase!.from('users').upsert(db.users);
      if (error) throw error;
    }
    if (oldDb) {
      const deletedUsers = getDeletedIds(oldDb.users, db.users);
      if (deletedUsers.length > 0) {
        await supabase!.from('users').delete().in('id', deletedUsers);
      }
    }
    
    // 5. Sincroniza Vehicles
    if (db.vehicles.length > 0) {
      const { error } = await supabase!.from('vehicles').upsert(db.vehicles);
      if (error) throw error;
    }
    if (oldDb) {
      const deletedVehicles = getDeletedIds(oldDb.vehicles, db.vehicles);
      if (deletedVehicles.length > 0) {
        await supabase!.from('vehicles').delete().in('id', deletedVehicles);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar dados no Supabase:', error);
    return false;
  }
};

