import puppeteer from 'puppeteer';
import { connection } from '../models/connection';
import getCaptcha from './getCaptcha';
import preload from '../models/preload';
import workers from '../models/workers';
import verified from '../models/verified';
import saveCookies from './getCookies'
import sharp from 'sharp'
import getProxyList from './getProxy';
import cpf from '../models/cpf';
import fs from 'fs'
import { Sequelize, Op } from 'sequelize';
//import io from './socket';
import { Server } from "socket.io";

class Worker {

    constructor() {
        this.workerName = ""
        this.proxy = {}
        this.page = {}
        this.CPF = ""
        this.groupid = []
        this.nextNum = 0
        this.browser = {}
        this.fail = false
    }

    async getCpf() {
        const Op = Sequelize.Op
        const verify = await verified.findAll()
        const listCpf = verify.length > 0 ? verify.map(e => e.dataValues.cpfreq + '\r') : []
        console.log(listCpf)
        const change = Math.floor(Math.random() * 900000)
        const query = await cpf.findOne({ where: {[Op.and]:[{id:{[Op.gt]:change}},{number:{[Op.notIn]:listCpf}}] } })


        if (query) {
            const obj = query.toJSON()
            console.log('CPF',obj)
            const number = obj.number.replace('\r', '')
            return number
        } else {
            return null
        }


    }

    async getBarCode() {
        try {
            this.data = null;
            
             
            await connection.sync();
            let res = await preload.findAll({ where: { [Op.and]: [{ free: true }, { paused: false }, {groupid: this.groupid[this.nextNum]}]}});
            
            if(this.nextNum >= this.groupid.length - 1){
                this.nextNum = 0
            }else{
                this.nextNum = this.nextNum + 1
            }

            if (res) {
                const data = res.map(e=>e.dataValues)
                const change = Math.floor(Math.random() * data.length -1)
                const dt = data[change]

                if (data) {
                    preload.update({ free: false }, { where: { id: dt.id } });
                    this.data = dt;
                    this.CPF = dt.cpf;
                    return dt
                } else {
                    this.data = null
                    return null
                }


            } else {
                this.data = null
                return null
            }
        } catch (erro) {
            console.log(erro)
            this.data = null
            return null
        }

    }

    async handleImage(imagename) {
        const imagePath = './public/captcha/' + imagename;
        const scale = 2;
        await sharp(imagePath)
            .metadata()
            .then(metadata => {
                const width = metadata.width * scale;
                const height = metadata.height * scale;
                return sharp(imagePath)
                    .resize(width, height)
                    .grayscale() // Converter para escala de cinza
                    .toFile(`./public/captcha/ok_${imagename}`);
            })
            .then(() => {
                console.log('Imagem ampliada criada com sucesso!');
            })
            .catch(err => {
                console.error(err);
            });
        return 'ok_' + imagename;
    }

    async captcha(img) {
        const res = await getCaptcha(img)
        return res.data;
    }

    async cookies() {
        try{
        const proxy = await this.setProxy();
        if(proxy){
        const ck = await saveCookies(this.workerName, proxy)
        if(!ck){
            this.fail = true; 
            this.next(); 
            return;
        }
        }else{
            this.next()
            return 
        }
    }catch{
        this.fail = true
        this.next()
        return
    }
    }

    async setProxy() {
        await this.isBreakTime()
        const res = await getProxyList()
        if(res.data){
        const change = Math.floor(Math.random() * (res.data.length - 1))
        this.proxy = res.data[change]
        console.log('proxy',res.data[change])
        return res.data[change]
        }else{
            return {}
        }
    }


    async setInstance(name, groupid) {
        this.workerName = name
        this.groupid = groupid
        try {

            await connection.sync()
            await workers.create({ name: name, status: "Iniciando" })
            
            return true
        } catch {
            return false
        }
    }

    async isBreakTime(){
        const hour = new Date().getHours()
        console.log(hour)
        if((hour >= 22 || hour < 8) && hour >= 0){
            await  workers.update({status:"Pausado. Retorna às 08:00h"},{where:{name:this.workerName}})
            //io.emit(this.workerName, 'Pausado. Retorna às 04:00h')
            const sec = Math.floor(Math.random() * 59)
            if(hour >= 22){
            const day = new Date().getDate() + 1
            const date = new Date()
            date.setDate(day)
            date.setHours(8,0,sec)
            await new Promise(r => setTimeout(r, date - new Date()));
            console.log('Aguardando', date - new Date())
            }else{
            const date = new Date().setHours(8,0,sec)
            await new Promise(r => setTimeout(r, date - new Date()));
            console.log('Aguardando', date - new Date())
            }
           

            
            //await this.setProxy()
            await this.cookies()
        }else{
            return false
        }


        
    }

   
    async start() {
        const timeOut = setTimeout(()=>{
            this.next();
        },300000)

        await this.isBreakTime()
     
        const verifyInstance = await workers.findOne({ where: { name: this.workerName } })
        if (!verifyInstance) {
            clearTimeout(timeOut)
            return
        };
        const instance = verifyInstance.toJSON()
        this.id = instance.id

        const proxy = await this.setProxy()
        if(!proxy){
            this.next()
            clearTimeout(timeOut)
            return
        }
        
        const cookies = fs.readFileSync(`./public/cookies/${this.workerName}.json`, "utf8");


        const barCode = await this.getBarCode();
        if (!barCode) {
            console.log('codigo de barras não definido')
            this.nextNum = this.nextNum + 1
            clearTimeout(timeOut)
            this.next()
            return
        }
        console.log('barcode', barCode)
        this.barCode = barCode
        
        const cpfReq = await this.getCpf()

        let browser = undefined;
        if(!this.proxy){
            this.nextNum = this.nextNum - 1
            await preload.update({ free: true }, { where: { id: barCode.id } })
            this.next()
            return
        }
        browser = await puppeteer.launch({/*executablePath: '/usr/bin/chromium-browser',*/ headless:false ,args: [
            `--proxy-server=${this.proxy.ip}:${this.proxy.port}`,
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--no-first-run',
            '--no-sandbox',
            '--no-zygote',
        ], ignoreDefaultArgs: ['--disable-extensions'], timeout: 90000 });
    
        

        try {
            await workers.update({status:"Testando"},{where:{name:this.workerName}})
            const page = await browser.newPage();
            
            for (const cookie of JSON.parse(cookies)) {
                await page.setCookie(cookie);
            }
            await page.goto('https://www.chequelegal.com.br');

            const checkReloadCaptcha = () => null;
            const atualizacaoAutomaticaCaptcha = () => null
            await page.exposeFunction(checkReloadCaptcha.name, checkReloadCaptcha);
            await page.evaluate(() => checkReloadCaptcha());
            await page.exposeFunction(atualizacaoAutomaticaCaptcha.name, atualizacaoAutomaticaCaptcha);
            await page.evaluate(() => atualizacaoAutomaticaCaptcha());

            const [a, b, c] = [barCode.number.slice(0, 8), barCode.number.slice(8, 18), barCode.number.slice(18)];



            await page.waitForXPath('//*[@id="lbCaptcha"]/table/tbody/tr/td[2]')
            const [cap] = await page.$x('//*[@id="lbCaptcha"]/table/tbody/tr/td[2]')

            const imgname = new Date().getMilliseconds() + '.png'
            await cap.screenshot({ path: './public/captcha/' + imgname, threshold: 0 })
            const capImage = await this.handleImage(imgname)

            //io.emit(this.workerName, 'Aguardando resolução do captcha')

            const solvedCapatcha = await getCaptcha(false, capImage)

            await page.$eval('input[name="cpfCnpjEmitente"]', input => input.value = null);
            await page.type('input[name="cpfCnpjEmitente"]', barCode.cpf);

            await page.$eval('input[name="primeiroCampoCmc7"]', input => input.value = null);
            await page.type('input[name="primeiroCampoCmc7"]', a);

            await page.$eval('input[name="segundoCampoCmc7"]', input => input.value = null);
            await page.type('input[name="segundoCampoCmc7"]', b);

            await page.$eval('input[name="terceiroCampoCmc7"]', input => input.value = null);
            await page.type('input[name="terceiroCampoCmc7"]', c);

            await page.$eval('input[name="cpfCnpjInteressado"]', input => input.value = null);
            await page.type('input[name="cpfCnpjInteressado"]', cpfReq);



            await page.waitForSelector('.aceite-label')
            await page.$eval('input[name="aceiteTermoUso"]', check => check.checked = true);

            await new Promise(r => setTimeout(r, 2000))

            await page.type('input[name="captcha"]', solvedCapatcha.data)


            await page.click('#btEnviar');

            await new Promise(r => setTimeout(r, 10000));
            await page.screenshot({ path: './public/screenshot/' + barCode.number +'.png', threshold: 0 })
            const err = await page.$x('//*[@id="errors"]')
            const okElement = await page.$x('//*[@id="detalheCheque"]')

            if (err.length > 0) {

                const errText = await page.evaluate(e => e.textContent, err[0])
                if (errText.replaceAll('\n', '').replaceAll(/\t/g, '').replaceAll(' ', '') != '') {
                    console.log(errText)
           
                    if (errText == "Código da Imagem: Caracteres do captcha não foram preenchidos corretamente ou o tempo máximo para preenchimento foi ultrapassado" || errText == ": Erro inesperado") {
                        await preload.update({ free: true }, { where: { id: barCode.id } })
                        this.nextNum = this.nextNum - 1

                    } else if (errText == "Excedida a quantidade de consultas de um mesmo cheque" || errText == "Cheque sustado ou revogado." || errText == "Cheque cancelado pela instituicao financeira sacada.") {
                        await preload.update({ paused: true }, { where: { groupid: barCode.groupid } })
                        await verified.create({ number: barCode.number, status: errText, cpfreq: cpfReq, groupid: barCode.groupid });
                    } else {

                        await verified.create({ number: barCode.number, status: errText, cpfreq: cpfReq });

                    }
                }
            }

            if (okElement.length > 0) {
                const okText = await page.evaluate(e => e.textContent, okElement[0])
                
                console.log(okText.replace(' ', '').replace(/\t/g, '') == '')
                if (okText.replaceAll('\n', '').replaceAll(/\t/g, '').replaceAll(' ', '') != '') {
             
                    if (okText.startsWith('Cheque não possui ocorrências')) {
                        await preload.update({ paused: true }, { where: { groupid: barCode.groupid } })
                        await verified.create({ number: barCode.number, status: 'Cheque não possui ocorrências', cpfreq: cpfReq, groupid: barCode.groupid });
                    } else {
                        if(okText.includes("Consulta realizada fora da grade horária")){
                            await preload.update({ free: true }, { where: { id: barCode.id } })
                            this.isBreakTime()
                            this.next()
                            return
                        }
                        await verified.create({ number: barCode.number, status: okText, cpfreq: cpfReq, groupid: barCode.groupid });
                    }
                }
            }

            if(browser) await browser.close();
            clearTimeout(timeOut)
            this.next()
            return

        } catch (e) {
            console.log(e)
            if (this.data) {
                await workers.update({status:"Erro. Reiniciando"},{where:{name:this.workerName}})
                await preload.update({ free: true }, { where: { id: this.data.id } })
                this.nextNum = this.nextNum - 1
                
            }
            clearTimeout(timeOut)
            this.next()
            return 
        }finally {
            if(browser) await browser.close();
            return
        }
    }

    async next() {
        await this.isBreakTime()
        if(this.fail){
            this.fail = false
            await this.cookies()
            this.start()

        }
        this.start()
    }

}



export default Worker;