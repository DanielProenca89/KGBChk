import puppeteer from 'puppeteer';

async function saveCookies(sessionName, proxy) {
  try{
  const browser = await puppeteer.launch( {/*executablePath: '/usr/bin/chromium-browser',*/ args: [
    proxy?`--proxy-server=${proxy.ip}:${proxy.port}`:'',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--no-first-run',
    '--no-sandbox',
    '--no-zygote',
], ignoreDefaultArgs: ['--disable-extensions'] });
  const page = await browser.newPage();

  await page.goto('https://www.chequelegal.com.br');

  const bt = await page.$x('/html/body/table/tbody/tr[1]/td[4]');
  await bt[0].click();

  const cookies = await page.cookies();
  const fs = require('fs');
  fs.writeFileSync('./public/cookies/'+sessionName+'.json', JSON.stringify(cookies));
  await browser.close();
  return cookies
}catch{
  return undefined
}
}

export default saveCookies