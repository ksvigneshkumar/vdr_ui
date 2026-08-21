export const supabase = {
  from: (table) => {
    // Basic in-memory store for our mock database
    if (typeof window !== 'undefined' && !window.__mockSupabaseDb) {
      window.__mockSupabaseDb = {
        groups: [
          { id: 'g1', name: 'Executive Team', role: 'admin', created_at: new Date().toISOString() },
          { id: 'g2', name: 'External Auditors', role: 'external_user', created_at: new Date().toISOString() }
        ],
        user_groups: [],
        permissions: []
      };
    }

    const db = typeof window !== 'undefined' ? window.__mockSupabaseDb : { groups: [], user_groups: [], permissions: [] };

    if (!db[table]) {
      db[table] = [];
    }

    let currentTable = db[table];
    let queryResult = [...currentTable];
    
    let isSingle = false;

    const builder = {
      select: () => builder,
      eq: (col, val) => { 
        queryResult = queryResult.filter(r => r[col] === val); 
        return builder; 
      },
      in: (col, arr) => { 
        queryResult = queryResult.filter(r => (arr || []).includes(r[col])); 
        return builder; 
      },
      is: (col, val) => { 
        if (val === null) {
          queryResult = queryResult.filter(r => r[col] === null || r[col] === undefined); 
        } else {
          queryResult = queryResult.filter(r => r[col] === val); 
        }
        return builder; 
      },
      order: (col, opts) => { 
        // Simple sorting mockup
        queryResult.sort((a, b) => {
          if (a[col] < b[col]) return opts?.ascending ? -1 : 1;
          if (a[col] > b[col]) return opts?.ascending ? 1 : -1;
          return 0;
        });
        return builder; 
      },
      insert: (obj) => { 
        const newObj = { id: Math.random().toString(36).substring(7), created_at: new Date().toISOString(), ...obj };
        if (typeof window !== 'undefined') {
          window.__mockSupabaseDb[table].push(newObj);
        }
        queryResult = [newObj];
        return builder;
      },
      delete: () => {
        const idsToDelete = queryResult.map(r => r.id);
        if (typeof window !== 'undefined') {
          window.__mockSupabaseDb[table] = window.__mockSupabaseDb[table].filter(r => !idsToDelete.includes(r.id));
        }
        return builder;
      },
      single: () => {
        isSingle = true;
        return builder;
      },
      then: (resolve) => {
        if (isSingle) {
          resolve({ data: queryResult[0] || null, error: null });
        } else {
          resolve({ data: queryResult, error: null });
        }
      }
    };
    
    return builder;
  }
};
