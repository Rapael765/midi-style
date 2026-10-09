// Mengubah QRIS statis menjadi QRIS dinamis dengan nominal tertentu.

function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function parseTlv(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    const tag = s.slice(i, i + 2);
    const len = parseInt(s.slice(i + 2, i + 4), 10);
    if (Number.isNaN(len)) break;
    out.push([tag, s.slice(i + 4, i + 4 + len)]);
    i += 4 + len;
  }
  return out;
}

export function isValidQris(payload) {
  if (!payload || payload.length < 30) return false;
  const p = payload.trim();
  return p.slice(-8, -4) === '6304' && crc16(p.slice(0, -4)) === p.slice(-4).toUpperCase();
}

export function makeDynamicQris(payload, amount) {
  const p = payload.trim();
  const amt = String(Math.round(Number(amount)));
  const fields = parseTlv(p.slice(0, -8)).filter(([t]) => t !== '54' && t !== '63');
  const out = [];
  let added = false;
  for (const [t, v] of fields) {
    if (t === '58' && !added) {
      out.push(['54', amt]);
      added = true;
    }
    out.push([t, t === '01' ? '12' : v]);
  }
  if (!added) out.push(['54', amt]);
  const body =
    out.map(([t, v]) => t + String(v.length).padStart(2, '0') + v).join('') + '6304';
  return body + crc16(body);
}
