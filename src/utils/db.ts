import type { Gang, Suspect, Crime, SystemUser, SuspectVehicle } from '../types';
import { 
  MOCK_GANGS, 
  MOCK_SUSPECTS, 
  MOCK_CRIMES, 
  MOCK_USERS, 
  MOCK_VEHICLES 
} from './mockData';
import { supabase, isSupabaseConfigured } from './supabaseClient';

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

    // Auto-semeia o usuário administrador se não existir no LocalStorage
    const hasAdmin = db.users.some(u => u.email.toLowerCase() === '1993lumendes@gmail.com');
    if (!hasAdmin) {
      db.users.push({
        id: 'user-admin',
        name: 'Administrador Nexos',
        email: '1993lumendes@gmail.com',
        password: 'NexosAdmin2026!',
        role: 'Administrador do Sistema',
        assignmentCity: 'Lajeado',
        lastLogin: 'Nunca (Acesso Inicial)',
        status: 'active'
      });
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
          password: 'NexosAdmin2026!',
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
    
    // Auto-semeia o administrador se não existir no Supabase
    const hasAdmin = db.users.some(u => u.email.toLowerCase() === '1993lumendes@gmail.com');
    if (!hasAdmin) {
      const adminUser: SystemUser = {
        id: 'user-admin',
        name: 'Administrador Nexos',
        email: '1993lumendes@gmail.com',
        password: 'NexosAdmin2026!',
        role: 'Administrador do Sistema',
        assignmentCity: 'Lajeado',
        lastLogin: 'Nunca (Acesso Inicial)',
        status: 'active'
      };
      db.users.push(adminUser);
      await supabase!.from('users').insert([adminUser]);
    }
    
    return db;
  } catch (error) {
    console.error('Erro ao buscar dados do Supabase:', error);
    return null;
  }
};

export const saveDatabaseToSupabase = async (db: NexosDatabase): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  
  try {
    // Sincroniza tabelas uma a uma
    
    // 1. Gangs
    if (db.gangs.length > 0) {
      const { error } = await supabase!.from('gangs').upsert(db.gangs);
      if (error) throw error;
      const gangIds = db.gangs.map(g => g.id);
      await supabase!.from('gangs').delete().not('id', 'in', `(${gangIds.join(',')})`);
    } else {
      await supabase!.from('gangs').delete().neq('id', '');
    }
    
    // 2. Suspects
    if (db.suspects.length > 0) {
      const { error } = await supabase!.from('suspects').upsert(db.suspects);
      if (error) throw error;
      const suspectIds = db.suspects.map(s => s.id);
      await supabase!.from('suspects').delete().not('id', 'in', `(${suspectIds.join(',')})`);
    } else {
      await supabase!.from('suspects').delete().neq('id', '');
    }
    
    // 3. Crimes
    if (db.crimes.length > 0) {
      const { error } = await supabase!.from('crimes').upsert(db.crimes);
      if (error) throw error;
      const crimeIds = db.crimes.map(c => c.id);
      await supabase!.from('crimes').delete().not('id', 'in', `(${crimeIds.join(',')})`);
    } else {
      await supabase!.from('crimes').delete().neq('id', '');
    }
    
    // 4. Users
    if (db.users.length > 0) {
      const { error } = await supabase!.from('users').upsert(db.users);
      if (error) throw error;
      const userIds = db.users.map(u => u.id);
      await supabase!.from('users').delete().not('id', 'in', `(${userIds.join(',')})`);
    } else {
      await supabase!.from('users').delete().neq('id', '');
    }
    
    // 5. Vehicles
    if (db.vehicles.length > 0) {
      const { error } = await supabase!.from('vehicles').upsert(db.vehicles);
      if (error) throw error;
      const vehicleIds = db.vehicles.map(v => v.id);
      await supabase!.from('vehicles').delete().not('id', 'in', `(${vehicleIds.join(',')})`);
    } else {
      await supabase!.from('vehicles').delete().neq('id', '');
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar dados no Supabase:', error);
    return false;
  }
};

