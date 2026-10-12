import { lees, wis } from './opslag.js'

export class ApiFout extends Error {
  constructor(bericht, status) {
    super(bericht)
    this.status = status
  }
}

export async function api(pad, { methode = 'GET', body } = {}) {
  const headers = { 'content-type': 'application/json' }
  const sessie = lees('sessie')
  if (sessie?.token) headers.authorization = 'Bearer ' + sessie.token
  let res
  try {
    res = await fetch('/api/' + pad, {
      method: methode,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    })
  } catch {
    throw new ApiFout('Geen verbinding. Probeer het zo opnieuw.', 0)
  }
  const data = await res.json().catch(() => ({}))
  if (res.status === 401) {
    wis('sessie')
    window.dispatchEvent(new Event('fot-uitgelogd'))
  }
  if (!res.ok) throw new ApiFout(data.fout || 'Er ging iets mis.', res.status)
  return data
}
