import { getAnnouncements, getBanners, getPDFsInURL } from "./lib/announcements.js";
import fs from "fs";
import { getTimetables } from "./lib/timetables.js";
import axios from "axios";
import cron from 'node-cron'
import si from "systeminformation";
import * as Blynk from './blynk.js'
import * as IG from './ig.js'
import serviceAccountKey from './serviceKey.js'
import path from 'path'
import admin from 'firebase-admin'
import express from "express"
import cors from "cors"
import compression from "compression"

const expressApp = express()
const PORT = process.env.PORT || 7034

expressApp.use(compression())

expressApp.use(cors({
    origin: "*"
}))

import { fileURLToPath } from 'url';
import { genDocThumbnails } from "./docgen/docs-thumbnails.js";
import { newssum } from "./lib/newssum.js";

const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey)
});

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const announcementCachePath = path.resolve(__dirname, "cache2/announcement-cache.json")
const bannerCachePath = path.resolve(__dirname, "cache2/banners-cache.json")

expressApp.use(express.static(path.resolve(__dirname, 'static_host')))

const dtFormat = new Intl.DateTimeFormat('en',
    {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hourCycle: 'h23'
    })

async function downloadFile(url, to) {
    const req = await axios.get(url)
    const data = req.data

    fs.writeFileSync(to, data)
}

function setupFolders() {
    if (!fs.existsSync("static_host")) {
        fs.mkdirSync("static_host")
    }

    if (!fs.existsSync("static_host/ข่าวประชาสัมพันธ์")) {
        fs.mkdirSync("static_host/ข่าวประชาสัมพันธ์")
    }

    if (!fs.existsSync("cache2")) {
        fs.mkdirSync("cache2")
    }

    if (!fs.existsSync("cache2/announcement-cache.json")) {
        fs.writeFileSync("cache2/announcement-cache.json", "[]")
    }

    if (!fs.existsSync("cache2/banners-cache.json")) {
        fs.writeFileSync("cache2/banners-cache.json", "[]")
    }
}

async function writeFiles() {
    const announcements = await getAnnouncements()
    fs.writeFileSync("static_host/app/announcements.json", JSON.stringify((announcements)))
    const banners = await getBanners()
    const bannerOldData = []
    for (const b of banners) {
        bannerOldData.push(b.url)
    }
    fs.writeFileSync("static_host/app/banners.json", JSON.stringify(bannerOldData))
    fs.writeFileSync("static_host/app/banners_v2.json", JSON.stringify(banners))
    fs.writeFileSync("static_host/app/timetables.json", JSON.stringify((await getTimetables())))
    const newsSum = await newssum(announcements)

    fs.writeFileSync("static_host/app/newssum.json", JSON.stringify(newsSum))
}

const fetchAnnouncements = async () => {
    console.log("RUNNING Announcements")
    let cacheTitles = JSON.parse(fs.readFileSync(announcementCachePath, "utf-8"))
    const announcements = await getAnnouncements()

    if (cacheTitles.length == 0) {
        for (const a of announcements) {
            cacheTitles.push(a.title)
        }
    } else {
        const newArticles = []

        for (const a of announcements) {
            if (cacheTitles.includes(a.title) == false) {
                Blynk.writeConsole(`New article detected ${a.title}`)

                newArticles.push(a)
            }
        }

        if ((await Blynk.getData("V2")) == 1) {
            for (const newA of newArticles) {
                try {
                    Blynk.writeConsole(`Forwarding Article ${newA.title}`)
                    await messaging.send({
                        notification: {
                            title: "ข่าวประชาสัมพันธ์ใหม่",
                            body: newA.title
                        },
                        topic: "all"
                    })
                } catch (err) {
                    console.log(err)
                }

                cacheTitles.push(newA.title)
            }
        }
    }

    fs.writeFileSync(announcementCachePath, JSON.stringify(cacheTitles))
}

const fetchBanners = async () => {
    console.log("RUNNING Banners")

    let cacheTitles = JSON.parse(fs.readFileSync(bannerCachePath, "utf-8"))
    const banners = await getBanners()

    if (cacheTitles.length == 0) {
        cacheTitles = banners
        const b = []
        for (const a of banners) {
            b.push(a.url)
        }

        fs.writeFileSync(bannerCachePath, JSON.stringify(b))
    } else {
        const newBanners = []

        for (const a of banners) {
            if (cacheTitles.includes(a.url) == false) {
                Blynk.writeConsole(`New banner detected ${a.url}`)
                newBanners.push(a.url)
            }
        }

        const igEnabled = await Blynk.getData("V1")

        if (igEnabled == 1) {
            for (const newA of newBanners) {
                if (cacheTitles.includes(newA)) {
                    continue
                }

                const buf = await axios.get(newA, {
                    responseType: "arraybuffer"
                })
                const buffer = Buffer.from(buf.data, 'base64');

                await IG.postImg(buffer, "📢 ประกาศภาพใหม่บนหน้าเว็บ https://rayongwit.ac.th/")

                Blynk.writeConsole("Wrote to IG")

                cacheTitles.push(newA)
                fs.writeFileSync(bannerCachePath, JSON.stringify(cacheTitles))
            }
        }
    }
}

async function mainLoop() {
    await fetchAnnouncements()
    await fetchBanners()
    await writeFiles()
    console.log("CHECKUP COMPLETED")
    Blynk.updateData("V0", dtFormat.format(new Date()))
    Blynk.updateData("V4", (await si.cpuTemperature()).main)
}

async function dailyLoop() {
    await genDocThumbnails()
    console.log("Daily Loop COMPLETED")
}

expressApp.get("/app/d/news/get_pdfs.json", async (req, res) => {
    const pdfreq = await getPDFsInURL(req.query.url ?? "")

    res.json(pdfreq ?? {})
})

expressApp.get("/proxy", async (req, res) => {
    const url = req.query.url

    if (url == null || url.startsWith("https://rayongwit.ac.th") == false) {
        return
    }

    const file = await axios.get(url, {responseType: "arraybuffer"})

    res.contentType(file.headers.getContentType() ?? "html")
    res.send(file.data)
})

async function bootUp() {
    console.log("Booting Up...")
    setupFolders()
    cron.schedule("*/2 5-22 * * *", mainLoop)
    cron.schedule("0 1 * * *", dailyLoop)

    console.log("Logging in IG...")

    await IG.init()

    expressApp.listen(PORT, () => {
        console.log("Express Static Now operational!")
    })

    console.log("Running first loop...")
    dailyLoop()
    mainLoop()
}

console.log("env: ", process.env.NODE_ENV ?? "prod")
bootUp()