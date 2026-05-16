const https = require('https');

https.get('https://www.ffescrime.fr/calendrier/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const rMatch = data.match(/<select[^>]*name="regions"[^>]*>([\s\S]*?)<\/select>/i);
    const dMatch = data.match(/<select[^>]*name="departements"[^>]*>([\s\S]*?)<\/select>/i);
    
    const extract = (str) => {
      let res = [];
      let m;
      const re = /<option value="([^"]+)"[^>]*>([^<]+)<\/option>/gi;
      while ((m = re.exec(str)) !== null) {
        if (m[1]) res.push({ value: m[1], label: m[2].trim() });
      }
      return res;
    };
    
    console.log(JSON.stringify({
      regions: rMatch ? extract(rMatch[1]) : [],
      departements: dMatch ? extract(dMatch[1]) : []
    }, null, 2));
  });
}).on('error', console.error);
