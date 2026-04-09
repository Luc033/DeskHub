const puppeteer = require('puppeteer'); 

module.exports = {
  async downloadXML(req, res) { 
    const { chave } = req.params; 

    if (!chave || !/^\d{44}$/.test(chave)) { 
      return res.status(400).json({ error: 'Chave de acesso inválida. Deve conter exatamente 44 dígitos numéricos.' }); 
    } 

    let browser; 
    try {
      console.log(`[NF-e] 1. Preparando para abrir o Chromium (Alpine)...`); 
      
      browser = await puppeteer.launch({ 
        headless: true, 
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser', 
        args: [ 
          '--no-sandbox', 
          '--disable-setuid-sandbox', 
          '--disable-dev-shm-usage', 
          '--disable-gpu', 
          '--disable-software-rasterizer' 
          // Flags --single-process e --no-zygote foram removidas daqui
        ]
      });

      console.log(`[NF-e] 2. Chromium aberto com sucesso! Navegando...`); 
      const page = await browser.newPage(); 

      // OTIMIZAÇÃO: Intercepta e bloqueia o carregamento de imagens, CSS e fontes
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });
      
      // Finge ser um navegador comum para evitar bloqueios básicos[cite: 1]
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'); 

      console.log(`[NF-e] 3. Acessando consultadanfe.com para a chave: ${chave}`); 
      await page.goto('https://consultadanfe.com', { waitUntil: 'networkidle2', timeout: 15000 }); 

      // Procura o campo de input e digita a chave[cite: 1]
      const inputSelector = 'input[type="text"]';  
      await page.waitForSelector(inputSelector, { timeout: 10000 }); 
      await page.type(inputSelector, chave, { delay: 30 });  

      console.log(`[NF-e] 4. Chave digitada. Clicando em Consultar...`); 
      
      const buttonSelector = 'button[type="submit"], button.btn-consultar';  
      await Promise.all([ 
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {}), 
        page.click(buttonSelector) 
      ]); 

      console.log(`[NF-e] 5. Consulta enviada. Aguardando processamento do site...`); 

      // Procura o botão de Download XML[cite: 1]
      const xmlUrl = await page.evaluate(() => { 
        const links = Array.from(document.querySelectorAll('a')); 
        const btnXml = links.find(a => a.textContent.toLowerCase().includes('xml') || a.href.toLowerCase().includes('xml')); 
        return btnXml ? btnXml.href : null; 
      }); 

      if (!xmlUrl) { 
        throw new Error('Botão de Download XML não encontrado. O site pode ter exigido um CAPTCHA.'); 
      } 

      console.log(`[NF-e] 6. URL do XML interceptada! Baixando...`); 

      const xmlPage = await browser.newPage(); 
      await xmlPage.goto(xmlUrl, { waitUntil: 'networkidle0' }); 
      
      const xmlContent = await xmlPage.evaluate(() => { 
        return document.body.innerText || document.documentElement.outerHTML; 
      }); 

      await browser.close(); 

      console.log(`[NF-e] 7. Sucesso! Devolvendo XML ao Frontend.`); 
      return res.json({ success: true, xml: xmlContent }); 

    } catch (error) { 
      console.error("[NF-e] ❌ Erro no Scraping:", error.message); 
      if (browser) await browser.close(); 
      return res.status(500).json({  
        error: 'Falha ao buscar XML no servidor de terceiros.'  
      }); 
    } 
  } 
}; 