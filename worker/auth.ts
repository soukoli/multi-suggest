/**
 * MultiSport API Authentication
 *
 * Reverse-engineered from mapa.multisport.cz/static/js/auth.js?v=4.0
 *
 * Algorithm (confirmed working via local test):
 * 1. Fetch page to get salt + server timestamp (n1)
 * 2. offset = n1 - Date.now()
 * 3. uuid = random UUID v4
 * 4. combined = salt + uuid
 * 5. transformed = combined.replace(/(.)./g, '$1').reverse().replace(/\d+/g, n => n << 2)
 * 6. interval = 60001
 * 7. adjustedTime = Date.now() + offset
 * 8. timeValue = new Date((adjustedTime + interval) - (adjustedTime % interval)).getTime()
 * 9. timeHash = MD5(timeValue.toString()) [UPPERCASE HEX]
 * 10. api_auth_token = transformed + ':' + timeHash
 */

const MAP_PAGE_URL = "https://mapa.multisport.cz/cs/";

/**
 * Generate UUID v4
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * MD5 implementation with UPPERCASE hex output
 * (MultiSport auth.js uses "0123456789ABCDEF")
 */
function md5(input: string): string {
  function safeAdd(x: number, y: number): number {
    const lsw = (0xffff & x) + (0xffff & y);
    return (((x >> 16) + (y >> 16) + (lsw >> 16)) << 16) | (0xffff & lsw);
  }

  function bitRotateLeft(num: number, cnt: number): number {
    return (num << cnt) | (num >>> (32 - cnt));
  }

  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn((b & c) | (~b & d), a, b, x, s, t); }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn((b & d) | (c & ~d), a, b, x, s, t); }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn(b ^ c ^ d, a, b, x, s, t); }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn(c ^ (b | ~d), a, b, x, s, t); }

  // Convert string to array of 32-bit words
  const len = input.length;
  const x: number[] = Array(((len + 64) >>> 9 << 4) + 15).fill(0);
  for (let i = 0; i < len * 8; i += 8) {
    x[i >> 5] |= (0xff & input.charCodeAt(i / 8)) << (i % 32);
  }
  x[len >> 2] |= 0x80 << ((len % 4) * 8);
  x[14 + (((len * 8 + 64) >>> 9) << 4)] = len * 8;

  let a = 0x67452301;
  let b = -0x10325477;
  let c = -0x67452302;
  let d = 0x10325476;

  for (let i = 0; i < x.length; i += 16) {
    const oa = a, ob = b, oc = c, od = d;

    a = ff(a,b,c,d,x[i],7,-680876936); d = ff(d,a,b,c,x[i+1],12,-389564586); c = ff(c,d,a,b,x[i+2],17,606105819); b = ff(b,c,d,a,x[i+3],22,-1044525330);
    a = ff(a,b,c,d,x[i+4],7,-176418897); d = ff(d,a,b,c,x[i+5],12,1200080426); c = ff(c,d,a,b,x[i+6],17,-1473231341); b = ff(b,c,d,a,x[i+7],22,-45705983);
    a = ff(a,b,c,d,x[i+8],7,1770035416); d = ff(d,a,b,c,x[i+9],12,-1958414417); c = ff(c,d,a,b,x[i+10],17,-42063); b = ff(b,c,d,a,x[i+11],22,-1990404162);
    a = ff(a,b,c,d,x[i+12],7,1804603682); d = ff(d,a,b,c,x[i+13],12,-40341101); c = ff(c,d,a,b,x[i+14],17,-1502002290); b = ff(b,c,d,a,x[i+15],22,1236535329);

    a = gg(a,b,c,d,x[i+1],5,-165796510); d = gg(d,a,b,c,x[i+6],9,-1069501632); c = gg(c,d,a,b,x[i+11],14,643717713); b = gg(b,c,d,a,x[i],20,-373897302);
    a = gg(a,b,c,d,x[i+5],5,-701558691); d = gg(d,a,b,c,x[i+10],9,38016083); c = gg(c,d,a,b,x[i+15],14,-660478335); b = gg(b,c,d,a,x[i+4],20,-405537848);
    a = gg(a,b,c,d,x[i+9],5,568446438); d = gg(d,a,b,c,x[i+14],9,-1019803690); c = gg(c,d,a,b,x[i+3],14,-187363961); b = gg(b,c,d,a,x[i+8],20,1163531501);
    a = gg(a,b,c,d,x[i+13],5,-1444681467); d = gg(d,a,b,c,x[i+2],9,-51403784); c = gg(c,d,a,b,x[i+7],14,1735328473); b = gg(b,c,d,a,x[i+12],20,-1926607734);

    a = hh(a,b,c,d,x[i+5],4,-378558); d = hh(d,a,b,c,x[i+8],11,-2022574463); c = hh(c,d,a,b,x[i+11],16,1839030562); b = hh(b,c,d,a,x[i+14],23,-35309556);
    a = hh(a,b,c,d,x[i+1],4,-1530992060); d = hh(d,a,b,c,x[i+4],11,1272893353); c = hh(c,d,a,b,x[i+7],16,-155497632); b = hh(b,c,d,a,x[i+10],23,-1094730640);
    a = hh(a,b,c,d,x[i+13],4,681279174); d = hh(d,a,b,c,x[i],11,-358537222); c = hh(c,d,a,b,x[i+3],16,-722521979); b = hh(b,c,d,a,x[i+6],23,76029189);
    a = hh(a,b,c,d,x[i+9],4,-640364487); d = hh(d,a,b,c,x[i+12],11,-421815835); c = hh(c,d,a,b,x[i+15],16,530742520); b = hh(b,c,d,a,x[i+2],23,-995338651);

    a = ii(a,b,c,d,x[i],6,-198630844); d = ii(d,a,b,c,x[i+7],10,1126891415); c = ii(c,d,a,b,x[i+14],15,-1416354905); b = ii(b,c,d,a,x[i+5],21,-57434055);
    a = ii(a,b,c,d,x[i+12],6,1700485571); d = ii(d,a,b,c,x[i+3],10,-1894986606); c = ii(c,d,a,b,x[i+10],15,-1051523); b = ii(b,c,d,a,x[i+1],21,-2054922799);
    a = ii(a,b,c,d,x[i+8],6,1873313359); d = ii(d,a,b,c,x[i+15],10,-30611744); c = ii(c,d,a,b,x[i+6],15,-1560198380); b = ii(b,c,d,a,x[i+13],21,1309151649);
    a = ii(a,b,c,d,x[i+4],6,-145523070); d = ii(d,a,b,c,x[i+11],10,-1120210379); c = ii(c,d,a,b,x[i+2],15,718787259); b = ii(b,c,d,a,x[i+9],21,-343485551);

    a = safeAdd(a, oa); b = safeAdd(b, ob); c = safeAdd(c, oc); d = safeAdd(d, od);
  }

  // Convert to UPPERCASE hex string
  const hex = "0123456789ABCDEF";
  let str = "";
  for (const val of [a, b, c, d]) {
    for (let i = 0; i < 4; i++) {
      str += hex.charAt((val >> (i * 8 + 4)) & 0xf) + hex.charAt((val >> (i * 8)) & 0xf);
    }
  }
  return str;
}

/**
 * Fetch page config (salt + server timestamp offset)
 */
async function fetchPageConfig(): Promise<{ salt: string; offset: number }> {
  const res = await fetch(MAP_PAGE_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  const html = await res.text();

  const saltMatch = html.match(/window\.salt\s*=\s*"([^"]+)"/);
  const n1Match = html.match(/var\s+n1\s*=\s*new\s+Date\((\d+)\)/);

  if (!saltMatch || !n1Match) {
    throw new Error("Could not extract auth config from page");
  }

  return {
    salt: saltMatch[1],
    offset: parseInt(n1Match[1]) - Date.now(),
  };
}

/**
 * Generate auth token (replicates auth.js algorithm exactly)
 */
function generateToken(salt: string, uuid: string, offset: number): string {
  // 1. Combine salt + uuid
  const combined = salt + uuid;

  // 2. Take every other character
  let transformed = combined.replace(/(.)./g, "$1");

  // 3. Reverse
  transformed = transformed.split("").reverse().join("");

  // 4. Multiply digit sequences by 4 (left shift 2)
  transformed = transformed.replace(/\d+/g, (m) => (parseInt(m) << 2).toString());

  // 5. Compute time-based hash
  const interval = 1000 * 60 + 1; // 60001
  const adjustedTime = Date.now() + offset;
  const timeValue = new Date((adjustedTime + interval) - (adjustedTime % interval)).getTime();
  const timeHash = md5(timeValue.toString()).toLowerCase();

  // 6. Combine
  return `${transformed}:${timeHash}`;
}

/**
 * Get JWT access token from MultiSport API
 */
export async function getAccessToken(): Promise<string> {
  const { salt, offset } = await fetchPageConfig();
  const uuid = generateUUID();
  const api_auth_token = generateToken(salt, uuid, offset);

  const response = await fetch("https://mapa.multisport.cz/api/v1/token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Origin": "https://mapa.multisport.cz",
      "Referer": "https://mapa.multisport.cz/cs/",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    body: JSON.stringify({ api_auth_token, uuid }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token request failed: ${response.status} - ${text}`);
  }

  const data = (await response.json()) as { access: string; refresh: string };
  return data.access;
}
