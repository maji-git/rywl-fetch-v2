import axios from 'axios'
import config from './config.js'

export async function updateData(pin, data) {
    if (data == null) {
        return
    }
    await axios.get(`https://blynk.cloud/external/api/update?token=${config.BLYNK_TOKEN}&pin=${pin}&value=${data}`)
}

export async function writeConsole(txt) {
    console.log(txt)
    try { await axios.get(`https://blynk.cloud/external/api/update?token=${config.BLYNK_TOKEN}&pin=V3&value=${txt}`) } catch(e) { console.error(e) }
}

export async function getData(pin) {
    if ((pin == "V1" || pin == "V2") && process.env.NODE_ENV == "dev") {
        return 0
    }
    const res = await axios.get(`https://blynk.cloud/external/api/get?token=${config.BLYNK_TOKEN}&pin=${pin}`)
    return res.data
}