export const escapeText=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function FractionDisplay(n,d){return `<span class="fraction" role="math" aria-label="${d}분의 ${n}"><span aria-hidden="true">${n}</span><span aria-hidden="true">${d}</span></span>`;}
export function mathText(s){return escapeText(s).replace(/(\d+)\s*\/\s*(10|100|1000)(?!\d)/g,(_,n,d)=>FractionDisplay(n,d));}
