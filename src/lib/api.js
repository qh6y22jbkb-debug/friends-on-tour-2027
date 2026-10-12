import { lees } from './opslag.js'

export async function api(pad, { methode = 'GET', body } = {}) {
  const headers = { 'content-type': 'application/json' }
  const groep = lees('groepscode')
  const org = lees('orgcode')
  if (groep) headers['x-groep'] = groep
  if (org) headers['x-org'] = org
  const res = await fetch('/api/' + pad, {
    method: methode,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.fout || 'Verbinding met het hoofdkwartier mislukt.')
  return data
}
