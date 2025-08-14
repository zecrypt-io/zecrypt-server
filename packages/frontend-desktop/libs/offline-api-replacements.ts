'use client';

import { sqliteDataStore as offlineDataStore } from './sqlite-data-store';

// Axios-like response helper
function axiosResponse<T>(data: T, status: number = 200, delay: number = 50) {
  return new Promise<{ status: number; statusText: string; data: T }>((resolve) => {
    setTimeout(() => resolve({ status, statusText: status === 200 ? 'OK' : 'Created', data }), delay);
  });
}

// Map local account -> API account shape expected by UI hooks/components
function mapLocalAccountToApi(account: any) {
  const credentials = JSON.stringify({ username: account.username || '', password: account.encryptedPassword || '' });
  return {
    doc_id: account.id,
    title: account.name,
    lower_name: (account.name || '').toLowerCase(),
    data: credentials,
    website: account.url || null,
    url: account.url || null,
    notes: account.notes || null,
    tags: (() => { try { return account.tags || (account.tags_json ? JSON.parse(account.tags_json) : []) } catch { return [] } })(),
    created_at: account.createdAt,
    updated_at: account.updatedAt,
    created_by: 'offline',
    project_id: account.projectId,
  };
}

// Parse URL helpers
function extractIdFromUrl(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1];
}

function extractWorkspaceId(url: string): string | undefined {
  const match = url.match(/\/([^\/]+)\/projects/);
  return match ? match[1] : undefined;
}

// Matches "/{workspaceId}/{projectId}/(accounts|wallet-phrases|emails|cards|notes|identity|ssh-keys|licenses|env|wifi|api-keys)"
function extractProjectId(url: string): string | undefined {
  const match = url.match(/^\/[^/]+\/([^/]+)\/(accounts|wallet-phrases|emails|cards|notes|identity|ssh-keys|licenses|env|wifi|api-keys)/);
  return match ? match[1] : undefined;
}

// Replace axios instance with offline implementations
export const offlineAxiosInstance = {
  get: async (url: string) => {
    console.log('Offline GET request to:', url);
    
    if (url.includes('/workspaces')) {
      return axiosResponse({ data: await offlineDataStore.getWorkspaces() });
    }
    
    if (url.includes('/projects')) {
      const workspaceId = extractWorkspaceId(url);
      return axiosResponse({ data: await offlineDataStore.getProjects(workspaceId) });
    }
    
    if (url.includes('/accounts')) {
      const projectId = extractProjectId(url);
      const accounts = await offlineDataStore.getAccounts(projectId);
      const mapped = accounts.map(mapLocalAccountToApi);
      return axiosResponse({ data: mapped });
    }

      if (url.includes('/wallet-phrases')) {
      const projectId = extractProjectId(url);
      const items = (await offlineDataStore.getWalletPhrases(projectId)).map((w) => ({
        doc_id: w.id,
        title: w.title,
        lower_title: (w.title || '').toLowerCase(),
        wallet_type: w.wallet_type,
        data: JSON.stringify({ passphrase: w.passphrase, wallet_address: w.wallet_address }),
        passphrase: w.passphrase,
        wallet_address: w.wallet_address,
        notes: w.notes || null,
        tags: w.tags || [],
        created_at: w.createdAt,
        updated_at: w.updatedAt,
        created_by: 'offline',
        project_id: w.projectId,
      }));
      return axiosResponse({ data: items });
    }

    if (url.includes('/identity')) {
      const projectId = extractProjectId(url);
      const items = (await offlineDataStore.getIdentities(projectId)).map((i: any) => ({
        doc_id: i.id,
        title: i.title,
        lower_name: (i.title || '').toLowerCase(),
        data: JSON.stringify({
          first_name: i.first_name,
          last_name: i.last_name,
          email: i.email,
          phone: i.phone,
          address: i.address,
          country: i.country,
          date_of_birth: i.date_of_birth,
          national_id: i.national_id,
        }),
        notes: i.notes || null,
        tags: (() => { try { return i.tags || (i.tags_json ? JSON.parse(i.tags_json) : []) } catch { return [] } })(),
        created_at: i.createdAt,
        updated_at: i.updatedAt,
        created_by: 'offline',
        project_id: i.projectId,
      }));
      return axiosResponse({ data: items });
    }

    if (url.includes('/ssh-keys')) {
      const projectId = extractProjectId(url);
      const items = (await offlineDataStore.getSshKeys(projectId)).map((s: any) => ({
        doc_id: s.id,
        title: s.title || s.name,
        name: s.title || s.name,
        lower_title: (s.title || s.name || '').toLowerCase(),
        data: JSON.stringify({ ssh_key: s.ssh_key }),
        ssh_key: s.ssh_key,
        notes: s.notes || null,
        tags: (() => { try { return s.tags || (s.tags_json ? JSON.parse(s.tags_json) : []) } catch { return [] } })(),
        created_at: s.createdAt,
        updated_at: s.updatedAt,
        created_by: 'offline',
        project_id: s.projectId,
      }));
      return axiosResponse({ data: items });
    }

    if (url.includes('/licenses')) {
      const projectId = extractProjectId(url);
      const items = (await offlineDataStore.getLicenses(projectId)).map((l: any) => ({
        doc_id: l.id,
        title: l.title,
        lower_title: (l.title || '').toLowerCase(),
        data: JSON.stringify({ license_key: l.license_key || l.data }),
        license_key: l.license_key || l.data,
        notes: l.notes || null,
        tags: (() => { try { return l.tags || (l.tags_json ? JSON.parse(l.tags_json) : []) } catch { return [] } })(),
        created_at: l.createdAt,
        updated_at: l.updatedAt,
        created_by: 'offline',
        project_id: l.projectId,
        expires_at: l.expires_at || null,
      }));
      return axiosResponse({ data: items });
    }

    if (url.includes('/env')) {
      const projectId = extractProjectId(url);
      const items = (await offlineDataStore.getEnvs(projectId)).map((e: any) => ({
        doc_id: e.id,
        title: e.title,
        lower_title: (e.title || '').toLowerCase(),
        data: e.data,
        notes: e.notes || null,
        tags: (() => { try { return e.tags || (e.tags_json ? JSON.parse(e.tags_json) : []) } catch { return [] } })(),
        created_at: e.createdAt,
        updated_at: e.updatedAt,
        created_by: 'offline',
        project_id: e.projectId,
      }));
      return axiosResponse({ data: items });
    }

    if (url.includes('/emails')) {
      const projectId = extractProjectId(url);
      // Map local -> API: pack fields into data JSON for parity
      const items = (await offlineDataStore.getEmails(projectId)).map((e) => ({
        doc_id: e.id,
        title: e.title,
        lower_title: (e.title || '').toLowerCase(),
        data: JSON.stringify({
          email_address: e.email_address,
          imap_server: e.imap_server || '',
          smtp_server: e.smtp_server || '',
          username: e.username,
          password: e.password,
        }),
        email_address: e.email_address,
        imap_server: e.imap_server || '',
        smtp_server: e.smtp_server || '',
        username: e.username,
        password: e.password,
        notes: e.notes || null,
        tags: (() => { try { return e.tags || (e.tags_json ? JSON.parse(e.tags_json) : []) } catch { return [] } })(),
        created_at: e.createdAt,
        updated_at: e.updatedAt,
        created_by: 'offline',
        project_id: e.projectId,
      }));
      return axiosResponse({ data: items });
    }

    if (url.includes('/cards')) {
      const projectId = extractProjectId(url);
      const items = (await offlineDataStore.getCards(projectId)).map((c) => ({
        doc_id: c.id,
        title: c.title,
        lower_name: (c.title || '').toLowerCase(),
        data: JSON.stringify({
          card_holder_name: c.card_holder_name,
          number: c.number,
          expiry_month: c.expiry_month,
          expiry_year: c.expiry_year,
          cvv: c.cvv,
        }),
        brand: c.brand,
        notes: c.notes || null,
        tags: (() => { try { return c.tags || (c.tags_json ? JSON.parse(c.tags_json) : []) } catch { return [] } })(),
        created_at: c.createdAt,
        updated_at: c.updatedAt,
        created_by: 'offline',
        project_id: c.projectId,
      }));
      return axiosResponse({ data: items });
    }

    if (url.includes('/notes')) {
      const projectId = extractProjectId(url);
      const items = (await offlineDataStore.getNotes(projectId)).map((n) => ({
        doc_id: n.id,
        title: n.title,
        data: n.data,
        tags: (() => { try { return n.tags || (n.tags_json ? JSON.parse(n.tags_json) : []) } catch { return [] } })(),
        created_at: n.createdAt,
        updated_at: n.updatedAt,
        created_by: 'offline',
        project_id: n.projectId,
      }));
      return axiosResponse({ data: items });
    }

    if (url.includes('/wifi')) {
      const projectId = extractProjectId(url);
      const items = (await offlineDataStore.getWifiNetworks(projectId)).map((w: any) => ({
        doc_id: w.id,
        title: w.title,
        lower_title: (w.title || '').toLowerCase(),
        security_type: w.security_type,
        data: JSON.stringify({ 'wifi-password': w.password }),
        notes: w.notes || null,
        tags: (() => { try { return w.tags || (w.tags_json ? JSON.parse(w.tags_json) : []) } catch { return [] } })(),
        created_at: w.createdAt,
        updated_at: w.updatedAt,
        created_by: 'offline',
        project_id: w.projectId,
      }));
      return axiosResponse({ data: items });
    }

    if (url.includes('/api-keys')) {
      const projectId = extractProjectId(url);
      const items = (await offlineDataStore.getApiKeys(projectId)).map((k: any) => ({
        doc_id: k.id,
        title: k.title,
        lower_title: (k.title || '').toLowerCase(),
        data: JSON.stringify({ 'api-key': k.key }),
        notes: k.notes || null,
        tags: (() => { try { return k.tags || (k.tags_json ? JSON.parse(k.tags_json) : []) } catch { return [] } })(),
        env: k.env,
        created_at: k.createdAt,
        updated_at: k.updatedAt,
        created_by: 'offline',
        project_id: k.projectId,
      }));
      return axiosResponse({ data: items });
    }

    // Default
    return axiosResponse({ data: [] });
  },

  post: async (url: string, body: any) => {
    console.log('Offline POST request to:', url, body);
    
    if (url.includes('/workspaces')) {
      const created = await offlineDataStore.createWorkspace(body);
      return axiosResponse({ data: created }, 201);
    }
    
    if (url.includes('/projects')) {
      const created = await offlineDataStore.createProject(body);
      return axiosResponse({ data: created }, 201);
    }
    
    if (url.includes('/accounts')) {
      const projectId = extractProjectId(url);
      // Body comes as { title, data: json({username,password}), url, tags, notes }
      let username = '';
      let password = '';
      try {
        if (typeof body?.data === 'string') {
          const parsed = JSON.parse(body.data);
          username = parsed?.username || '';
          password = parsed?.password || '';
        }
      } catch {}
      const created = await offlineDataStore.createAccount({
        projectId: projectId || body.projectId,
        name: body.title || body.name || 'Untitled',
        username,
        email: body.email || '',
        encryptedPassword: password, // storing plain for now (no encryption)
        url: body.url || body.website || null,
        notes: body.notes || null,
        tags: body.tags || [],
      });
      const mapped = mapLocalAccountToApi(created);
      return axiosResponse({ data: mapped }, 201);
    }
    
    if (url.includes('/wallet-phrases')) {
      const projectId = extractProjectId(url)!;
      let passphrase = '';
      let wallet_address = '';
      try { const p = JSON.parse(body?.data || '{}'); passphrase = p.passphrase || ''; wallet_address = p.wallet_address || ''; } catch {}
      const created = await offlineDataStore.createWalletPhrase({
        projectId,
        title: body.title || 'Untitled',
        wallet_type: body.wallet_type || 'Other',
        passphrase,
        wallet_address,
        notes: body.notes || null,
        tags: body.tags || [],
      });
      return axiosResponse({ data: {
        doc_id: created.id,
        title: created.title,
        lower_title: (created.title || '').toLowerCase(),
        wallet_type: created.wallet_type,
        data: body.data,
        passphrase: created.passphrase,
        wallet_address: created.wallet_address,
        notes: created.notes || null,
        tags: created.tags || [],
        created_at: created.createdAt,
        updated_at: created.updatedAt,
        created_by: 'offline',
        project_id: created.projectId,
      } }, 201);
    }

    if (url.includes('/identity')) {
      const projectId = extractProjectId(url)!;
      let parsed: any = {};
      try { parsed = JSON.parse(body?.data || '{}'); } catch {}
      const created = await offlineDataStore.createIdentity({
        projectId,
        title: body.title || 'Untitled',
        ...parsed,
        notes: body.notes || null,
        tags: body.tags || [],
      });
      return axiosResponse({ data: {
        doc_id: created.id,
        title: created.title,
        lower_name: (created.title || '').toLowerCase(),
        data: JSON.stringify({
          first_name: created.first_name,
          last_name: created.last_name,
          email: created.email,
          phone: created.phone,
          address: created.address,
          country: created.country,
          date_of_birth: created.date_of_birth,
          national_id: created.national_id,
        }),
        notes: created.notes || null,
        tags: (() => { try { return created.tags || (created.tags_json ? JSON.parse(created.tags_json) : []) } catch { return [] } })(),
        created_at: created.createdAt,
        updated_at: created.updatedAt,
        created_by: 'offline',
        project_id: created.projectId,
      } }, 201);
    }

    if (url.includes('/ssh-keys')) {
      const projectId = extractProjectId(url)!;
      let ssh_key = '';
      try { const p = JSON.parse(body?.data || '{}'); ssh_key = p.ssh_key || ''; } catch {}
      const created = await offlineDataStore.createSshKey({
        projectId,
        title: body.title || 'Untitled',
        ssh_key,
        notes: body.notes || null,
        tags: body.tags || [],
      });
      return axiosResponse({ data: created }, 201);
    }

    if (url.includes('/licenses')) {
      const projectId = extractProjectId(url)!;
      let license_key = '';
      try { const p = JSON.parse(body?.data || '{}'); license_key = p.license_key || ''; } catch {}
      const created = await offlineDataStore.createLicense({
        projectId,
        title: body.title || 'Untitled',
        license_key,
        notes: body.notes || null,
        tags: body.tags || [],
        expires_at: body.expires_at || null,
      });
      return axiosResponse({ data: created }, 201);
    }

    if (url.includes('/env')) {
      const projectId = extractProjectId(url)!;
      const created = await offlineDataStore.createEnv({
        projectId,
        title: body.title || 'Untitled',
        data: body.data || '',
        notes: body.notes || null,
        tags: body.tags || [],
      });
      return axiosResponse({ data: created }, 201);
    }

    if (url.includes('/emails')) {
      const projectId = extractProjectId(url);
      // body: { title, data(json), notes, tags }
      let parsed: any = {};
      try { parsed = JSON.parse(body?.data || '{}'); } catch {}
      const created = await offlineDataStore.createEmail({
        projectId: projectId!,
        title: body.title || 'Untitled',
        email_address: parsed.email_address || '',
        imap_server: parsed.imap_server || '',
        smtp_server: parsed.smtp_server || '',
        username: parsed.username || '',
        password: parsed.password || '',
        notes: body.notes || null,
        tags: body.tags || [],
      });
      return axiosResponse({ data: {
        doc_id: created.id,
        title: created.title,
        lower_title: (created.title || '').toLowerCase(),
        data: body.data,
        email_address: created.email_address,
        imap_server: created.imap_server || '',
        smtp_server: created.smtp_server || '',
        username: created.username,
        password: created.password,
        notes: created.notes || null,
        tags: created.tags || [],
        created_at: created.createdAt,
        updated_at: created.updatedAt,
        created_by: 'offline',
        project_id: created.projectId,
      } }, 201);
    }

    if (url.includes('/cards')) {
      const projectId = extractProjectId(url);
      let parsed: any = {};
      try { parsed = JSON.parse(body?.data || '{}'); } catch {}
      const created = await offlineDataStore.createCard({
        projectId: projectId!,
        title: body.title || 'Untitled',
        brand: body.brand || 'other',
        card_holder_name: parsed.card_holder_name || '',
        number: parsed.number || '',
        expiry_month: parsed.expiry_month || '',
        expiry_year: parsed.expiry_year || '',
        cvv: parsed.cvv || '',
        notes: body.notes || null,
        tags: body.tags || [],
      });
      return axiosResponse({ data: {
        doc_id: created.id,
        title: created.title,
        lower_name: (created.title || '').toLowerCase(),
        data: body.data,
        brand: created.brand,
        notes: created.notes || null,
        tags: created.tags || [],
        created_at: created.createdAt,
        updated_at: created.updatedAt,
        created_by: 'offline',
        project_id: created.projectId,
      } }, 201);
    }

    if (url.includes('/notes')) {
      const projectId = extractProjectId(url);
      const created = await offlineDataStore.createNote({
        projectId: projectId!,
        title: body.title || 'Untitled',
        data: body.data || '',
        tags: body.tags || [],
      });
      return axiosResponse({ data: {
        doc_id: created.id,
        title: created.title,
        data: created.data,
        tags: created.tags || [],
        created_at: created.createdAt,
        updated_at: created.updatedAt,
        created_by: 'offline',
        project_id: created.projectId,
      } }, 201);
    }

    if (url.includes('/wifi')) {
      const projectId = extractProjectId(url)!;
      let password = '';
      try { const p = JSON.parse(body?.data || '{}'); password = p['wifi-password'] || ''; } catch {}
      const created = await offlineDataStore.createWifiNetwork({
        projectId,
        title: body.title,
        security_type: body.security_type,
        password,
        notes: body.notes,
        tags: body.tags,
      });
      return axiosResponse({ data: {
        doc_id: created.id,
        status_code: 201,
      } }, 201);
    }

    if (url.includes('/api-keys')) {
      const projectId = extractProjectId(url)!;
      let key = '';
      try { const p = JSON.parse(body?.data || '{}'); key = p['api-key'] || ''; } catch {}
      const created = await offlineDataStore.createApiKey({
        projectId,
        title: body.title,
        key,
        env: body.env,
        notes: body.notes,
        tags: body.tags,
      });
      return axiosResponse({ data: {
        doc_id: created.id,
        status_code: 201,
      } }, 201);
    }

    return axiosResponse({ data: body }, 201);
  },

  put: async (url: string, body: any) => {
    console.log('Offline PUT request to:', url, body);
    
    const id = extractIdFromUrl(url);
    
    if (url.includes('/workspaces')) {
      const updated = await offlineDataStore.updateWorkspace(id, body);
      return axiosResponse({ data: updated });
    }
    
    if (url.includes('/projects')) {
      const updated = await offlineDataStore.updateProject(id, body);
      return axiosResponse({ data: updated });
    }
    
    if (url.includes('/accounts')) {
      let username: string | undefined;
      let password: string | undefined;
      try {
        if (typeof body?.data === 'string') {
          const parsed = JSON.parse(body.data);
          username = parsed?.username;
          password = parsed?.password;
        }
      } catch {}
      const updated = await offlineDataStore.updateAccount(id, {
        name: body.title,
        url: body.url ?? body.website,
        notes: body.notes,
        tags: body.tags,
        ...(username !== undefined ? { username } : {}),
        ...(password !== undefined ? { encryptedPassword: password } : {}),
      });
      const mapped = updated ? mapLocalAccountToApi(updated) : null;
      return axiosResponse({ data: mapped });
    }
    
    if (url.includes('/wallet-phrases')) {
      let passphrase: string | undefined;
      let wallet_address: string | undefined;
      try { const p = JSON.parse(body?.data || '{}'); passphrase = p.passphrase; wallet_address = p.wallet_address; } catch {}
      const updated = await offlineDataStore.updateWalletPhrase(id, {
        title: body.title,
        wallet_type: body.wallet_type,
        ...(passphrase !== undefined ? { passphrase } : {}),
        ...(wallet_address !== undefined ? { wallet_address } : {}),
        notes: body.notes,
        tags: body.tags,
      });
      return axiosResponse({ data: updated });
    }

    if (url.includes('/identity')) {
      let parsed: any = {};
      try { parsed = JSON.parse(body?.data || '{}'); } catch {}
      const updated = await offlineDataStore.updateIdentity(id, {
        title: body.title,
        ...parsed,
        notes: body.notes,
        tags: body.tags,
      });
      return axiosResponse({ data: updated });
    }

    if (url.includes('/ssh-keys')) {
      let ssh_key: string | undefined;
      try { const p = JSON.parse(body?.data || '{}'); ssh_key = p.ssh_key; } catch {}
      const updated = await offlineDataStore.updateSshKey(id, {
        title: body.title,
        ...(ssh_key !== undefined ? { ssh_key } : {}),
        notes: body.notes,
        tags: body.tags,
      });
      return axiosResponse({ data: updated });
    }

    if (url.includes('/licenses')) {
      let license_key: string | undefined;
      try { const p = JSON.parse(body?.data || '{}'); license_key = p.license_key; } catch {}
      const updated = await offlineDataStore.updateLicense(id, {
        title: body.title,
        ...(license_key !== undefined ? { license_key } : {}),
        notes: body.notes,
        tags: body.tags,
        expires_at: body.expires_at,
      });
      return axiosResponse({ data: updated });
    }

    if (url.includes('/env')) {
      const updated = await offlineDataStore.updateEnv(id, {
        title: body.title,
        data: body.data,
        notes: body.notes,
        tags: body.tags,
      });
      return axiosResponse({ data: updated });
    }

    if (url.includes('/emails')) {
      let parsed: any = {};
      try { parsed = JSON.parse(body?.data || '{}'); } catch {}
      const updated = await offlineDataStore.updateEmail(id, {
        title: body.title,
        email_address: parsed.email_address,
        imap_server: parsed.imap_server,
        smtp_server: parsed.smtp_server,
        username: parsed.username,
        password: parsed.password,
        notes: body.notes,
        tags: body.tags,
      });
      return axiosResponse({ data: updated });
    }

    if (url.includes('/cards')) {
      let parsed: any = {};
      try { parsed = JSON.parse(body?.data || '{}'); } catch {}
      const updated = await offlineDataStore.updateCard(id, {
        title: body.title,
        brand: body.brand,
        card_holder_name: parsed.card_holder_name,
        number: parsed.number,
        expiry_month: parsed.expiry_month,
        expiry_year: parsed.expiry_year,
        cvv: parsed.cvv,
        notes: body.notes,
        tags: body.tags,
      });
      return axiosResponse({ data: updated });
    }

    if (url.includes('/notes')) {
      const updated = await offlineDataStore.updateNote(id, {
        title: body.title,
        data: body.data,
        tags: body.tags,
      });
      return axiosResponse({ data: updated });
    }

    if (url.includes('/wifi')) {
      const id = extractIdFromUrl(url);
      let password: string | undefined;
      try { const p = JSON.parse(body?.data || '{}'); password = p['wifi-password']; } catch {}
      const updated = await offlineDataStore.updateWifiNetwork(id, {
        title: body.title,
        security_type: body.security_type,
        ...(password !== undefined ? { password } : {}),
        notes: body.notes,
        tags: body.tags,
      });
      return axiosResponse({ data: updated });
    }

    if (url.includes('/api-keys')) {
      const id = extractIdFromUrl(url);
      let key: string | undefined;
      try { const p = JSON.parse(body?.data || '{}'); key = p['api-key']; } catch {}
      const updated = await offlineDataStore.updateApiKey(id, {
        title: body.title,
        ...(key !== undefined ? { key } : {}),
        env: body.env,
        notes: body.notes,
        tags: body.tags,
      });
      return axiosResponse({ data: updated });
    }

    return axiosResponse({ data: body });
  },
  
  delete: async (url: string) => {
    console.log('Offline DELETE request to:', url);
    
    const id = extractIdFromUrl(url);
    
    if (url.includes('/workspaces')) {
      const success = await offlineDataStore.deleteWorkspace(id);
      return axiosResponse({ data: { success } });
    }
    
    if (url.includes('/projects')) {
      const success = await offlineDataStore.deleteProject(id);
      return axiosResponse({ data: { success } });
    }
    
    if (url.includes('/accounts')) {
      const success = await offlineDataStore.deleteAccount(id);
      return axiosResponse({ data: { success } });
    }
    
    if (url.includes('/wallet-phrases')) {
      const success = await offlineDataStore.deleteWalletPhrase(id);
      return axiosResponse({ data: { success } });
    }

    if (url.includes('/identity')) {
      const success = await offlineDataStore.deleteIdentity(id);
      return axiosResponse({ data: { success } });
    }

    if (url.includes('/ssh-keys')) {
      const success = await offlineDataStore.deleteSshKey(id);
      return axiosResponse({ data: { success } });
    }

    if (url.includes('/licenses')) {
      const success = await offlineDataStore.deleteLicense(id);
      return axiosResponse({ data: { success } });
    }

    if (url.includes('/env')) {
      const success = await offlineDataStore.deleteEnv(id);
      return axiosResponse({ data: { success } });
    }

    if (url.includes('/emails')) {
      const success = await offlineDataStore.deleteEmail(id);
      return axiosResponse({ data: { success } });
    }

    if (url.includes('/cards')) {
      const success = await offlineDataStore.deleteCard(id);
      return axiosResponse({ data: { success } });
    }

    if (url.includes('/notes')) {
      const success = await offlineDataStore.deleteNote(id);
      return axiosResponse({ data: { success } });
    }

    if (url.includes('/wifi')) {
      const success = await offlineDataStore.deleteWifiNetwork(id);
      return axiosResponse({ data: { success } });
    }

    if (url.includes('/api-keys')) {
      const success = await offlineDataStore.deleteApiKey(id);
      return axiosResponse({ data: { success } });
    }

    return axiosResponse({ data: { success: true } });
  }
};

// Mock authentication responses
export const mockAuthResponse = (success: boolean = true, user?: any) => {
  if (success) {
    return axiosResponse({
      data: {
      success: true,
      user: user || {
        id: 'offline-user',
        email: 'offline@example.com',
          displayName: 'Offline User',
      },
        token: 'offline-token-' + Date.now(),
      }
    });
  } else {
    throw new Error('Authentication failed');
  }
};