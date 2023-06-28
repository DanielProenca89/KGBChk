import fs from 'fs'
import preload from './models/preload'
import { connection } from './models/connection'
import { Sequelize, Op } from 'sequelize';

export default async function consertaEssaMerda(req, res){

    await connection.sync();

    fs.readdirSync('./public/screenshot').map(e=>e.split('.')[0]).forEach(async el=>await preload.update({free:false},{where:{number:el}}))

    res.send('ok')


}