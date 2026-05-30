const fs = require('fs');
const src = fs.readFileSync(process.argv[2], 'utf8');
function minify(code) {
  let out = ''; let i = 0; const n = code.length; let lastSig = '';
  const regexAllowedBefore = new Set(['', '(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '/', '%', '<', '>', '~', '^', 'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'do', 'else', 'case']);
  function lastWord(){ const m = out.match(/[A-Za-z_$][A-Za-z0-9_$]*$/); return m ? m[0] : ''; }
  while (i < n) {
    const c = code[i]; const c2 = code[i + 1];
    if (c === '/' && c2 === '/') { while (i < n && code[i] !== '\n') i++; continue; }
    if (c === '/' && c2 === '*') { i += 2; while (i < n && !(code[i] === '*' && code[i + 1] === '/')) i++; i += 2; continue; }
    if (c === "'" || c === '"') {
      const q = c; out += c; i++;
      while (i < n) { out += code[i]; if (code[i] === '\\') { out += code[i + 1]; i += 2; continue; } if (code[i] === q) { i++; break; } i++; }
      lastSig = q; continue;
    }
    if (c === '`') {
      out += c; i++; let depth = 0;
      while (i < n) {
        const ch = code[i];
        if (ch === '\\') { out += ch + (code[i + 1] || ''); i += 2; continue; }
        if (ch === '`' && depth === 0) { out += ch; i++; break; }
        if (ch === '$' && code[i + 1] === '{') { depth++; out += '${'; i += 2; continue; }
        if (ch === '}' && depth > 0) { depth--; out += '}'; i++; continue; }
        out += ch; i++;
      }
      lastSig = '`'; continue;
    }
    if (c === '/') {
      const lw = lastWord(); const prev = lw || lastSig;
      if (regexAllowedBefore.has(prev)) {
        out += c; i++; let inClass = false;
        while (i < n) {
          const ch = code[i];
          if (ch === '\\') { out += ch + (code[i + 1] || ''); i += 2; continue; }
          if (ch === '[') inClass = true; else if (ch === ']') inClass = false;
          else if (ch === '/' && !inClass) { out += ch; i++; break; }
          else if (ch === '\n') break;
          out += ch; i++;
        }
        while (i < n && /[a-z]/i.test(code[i])) { out += code[i]; i++; }
        lastSig = '/'; continue;
      }
      out += c; i++; lastSig = '/'; continue;
    }
    if (c === ' ' || c === '\t' || c === '\r') {
      let j = i; while (j < n && (code[j] === ' ' || code[j] === '\t' || code[j] === '\r')) j++;
      const prevCh = out[out.length - 1]; const nextCh = code[j];
      if (prevCh && prevCh !== '\n' && nextCh && nextCh !== '\n') out += ' ';
      i = j; continue;
    }
    if (c === '\n') { if (out[out.length - 1] !== '\n') out += '\n'; i++; continue; }
    out += c; if (!/\s/.test(c)) lastSig = c; i++;
  }
  return out.replace(/\n[ \t]+/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{2,}/g, '\n').trim() + '\n';
}
const min = minify(src);
fs.writeFileSync(process.argv[3], min);
const before = Buffer.byteLength(src), after = Buffer.byteLength(min);
console.log('before:', (before/1024).toFixed(0)+'KB', '| after:', (after/1024).toFixed(0)+'KB', '| saved:', (100-after/before*100).toFixed(1)+'%');
