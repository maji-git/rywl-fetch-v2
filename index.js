import { getAnnouncements, getBanners } from "./lib/announcements.js";
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

const expressApp = express()
const PORT = process.env.PORT || 7034

expressApp.use(cors({
    origin: "*"
}))

import { fileURLToPath } from 'url';
import { genDocThumbnails } from "./docgen/docs-thumbnails.js";

const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey)
});

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const announcementCachePath = path.resolve(__dirname, "cache/announcement-cache.json")
const bannerCachePath = path.resolve(__dirname, "cache/banners-cache.json")

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

    if (!fs.existsSync("cache")) {
        fs.mkdirSync("cache")
    }

    if (!fs.existsSync("cache/announcement-cache.json")) {
        fs.writeFileSync("cache/announcement-cache.json", "[]")
    }

    if (!fs.existsSync("cache/banners-cache.json")) {
        fs.writeFileSync("cache/banners-cache.json", "[]")
    }
}

async function writeFiles() {
    fs.writeFileSync("static_host/announcements.json", JSON.stringify((await getAnnouncements())))
    fs.writeFileSync("static_host/timetables.json", JSON.stringify((await getTimetables())))
    await downloadFile("https://rayongwit.ac.th/%E0%B8%82%E0%B9%88%E0%B8%B2%E0%B8%A7%E0%B8%9B%E0%B8%A3%E0%B8%B0%E0%B8%8A%E0%B8%B2%E0%B8%AA%E0%B8%B1%E0%B8%A1%E0%B8%9E%E0%B8%B1%E0%B8%99%E0%B8%98%E0%B9%8C/", "static_host/ข่าวประชาสัมพันธ์/index.html")
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
        fs.writeFileSync(bannerCachePath, JSON.stringify(cacheTitles))
    } else {
        const newBanners = []

        for (const a of banners) {
            if (cacheTitles.includes(a) == false) {
                Blynk.writeConsole(`New banner detected ${a}`)
                newBanners.push(a)
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

bootUp()