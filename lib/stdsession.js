import { RYWLHttp } from '../utils/http.js';
import store from '@/js/store.js';
import { f7 } from 'framework7-vue';
import { downloadFile } from '../utils/downloader.js';
import { thaiToDate } from '../utils/date';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import { Preferences } from "@capacitor/preferences"
import Logger from 'js-logger';
import QRCode from 'qrcode'

export async function reauthenticate() {
    if (store.state.authData.username == "" || store.state.authData.password == "") {
        return
    }

    const respo = await RYWLHttp.post({
        url: `https://rayongwit.ac.th/student/index.php`,
        data: `username=${store.state.authData.username}&password=${store.state.authData.password}`,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });

    console.log(respo.data)

    if (store.state.userData == null) {
        store.state.userData = {}
    }

    let sessionID = ""

    if (window['rywlUseProxy']) {
        sessionID = respo.cookie
    } else {
        sessionID = document.cookie + "; path=/"
    }

    store.state.userData['sessionID'] = sessionID

    return sessionID
}

export async function getDocPDF(targetURL) {
    const html2pdf = (await import("html2pdf.js")).default
    const sessionID = await reauthenticate()

    if (sessionID) {
        const prog = f7.dialog.progress("กำลังประมวลผล...", 1)
        prog.setText("กำลังโหลดหน้า stdPrint...")
        prog.open()
        prog.setProgress(0)

        const stdPrint = await RYWLHttp.get({
            url: targetURL,
            headers: {
                "Cookie": sessionID
            }
        });

        const tempElement = document.createElement("div")
        tempElement.innerHTML = `${stdPrint.data.replace("../", "https://rayongwit.ac.th/")}<style>* {font-family: Sarabun !important;}</style>`

        let i = 0
        let queryAll = tempElement.querySelectorAll("img")

        prog.setText("กำลังโหลดรูปภาพ...")

        for (const imgs of queryAll) {
            i++
            prog.setProgress((i / queryAll.length) * 100)

            if (imgs.src.startsWith("https://chart.googleapis.com/")) {
                const parsed = new URL(imgs.src)
                const res = (parsed.searchParams.get("chs") ?? "120x120").split("x")
                imgs.src = (await QRCode.toDataURL(parsed.searchParams.get("chl")))
                imgs.width = res[0]
                imgs.height = res[1]
            } else {
                imgs.src = imgs.src.replace("http://192.168.1.170:5173/", "https://rayongwit.ac.th/").replace("../", "https://rayongwit.ac.th/")
            }

            let targetURL = imgs.src
            imgs.setAttribute("onerror", "this.src=&quot;https://rayongwit.ac.th/ticket/pic/no-pic.JPG&quot;;")

            if (targetURL.includes("logo.png")) {
                targetURL = "https://rayongwit.ac.th/student/logo.png"
            }

            const resolved = await downloadFile(targetURL)
            imgs.src = resolved
        }

        // Format Text
        for (const p of tempElement.querySelectorAll("p, strong")) {
            p.style.fontSize = "14px"
        }

        for (const p of tempElement.querySelectorAll("td")) {
            p.style.fontSize = "12px"
        }

        for (const p of tempElement.querySelectorAll("*")) {
            p.style.fontFamily = "Sarabun"
        }

        tempElement.querySelector(".navbar").remove()
        tempElement.querySelector("button[onclick='window.print()']").remove()

        const opt = {
            margin: 0.5,
            filename: "stdfix.pdf",
            image: { type: "jpeg", quality: 1 },
            html2canvas: { scale: 4, useCORS: true, dpi: 300 },
            jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
        };

        prog.setProgress(100, 100)

        prog.setText("กำลังส่งออกเป็น PDF... ใกล้เสร็จแล้ว :D")

        const data = await html2pdf().set(opt).from(tempElement).toPdf().output('blob')

        prog.close()

        const finalBlob = data.slice(0, data.size, "application/octet-stream")

        return finalBlob
    }
}

export async function getStdFixPDF() {
    return await getDocPDF(`https://rayongwit.ac.th/student/print.php`)
}

export async function getStdLatePDF() {
    return await getDocPDF(`https://rayongwit.ac.th/student/printlate.php`)
}

export async function getBehaviourData() {
    const sessionID = await reauthenticate()

    if (sessionID) {
        const stdPrint = await RYWLHttp.get({
            url: `https://rayongwit.ac.th/student/stdhistory.php`,
            headers: {
                "Cookie": sessionID
            }
        });
        const parser = new DOMParser()
        const dom = parser.parseFromString(stdPrint.data, "text/html")
        const history = []

        //let dom = document
        for (const trs of dom.querySelectorAll("tbody tr")) {
            const tds = trs.querySelectorAll("td")
            if (tds.length > 4) {
                history.push({
                    index: parseInt(tds[0]?.textContent),
                    behaviour: tds[1]?.textContent,
                    consequence: tds[2]?.textContent,
                    date: tds[3]?.textContent,
                    reporter: tds[4]?.textContent,
                    evidence: tds[5]?.querySelector("a")?.getAttribute("href")?.replace("../", "https://rayongwit.ac.th/"),
                    comment: tds[6]?.textContent,
                })
            }
        }

        return {
            status: dom.querySelector("h5:nth-child(3) strong p:nth-child(3)")?.textContent,
            history: history,
            dom: dom
        }
    }
}

export async function getTeachersTel() {
    const sessionID = await reauthenticate()

    const stdPrint = await RYWLHttp.get({
        url: `https://rayongwit.ac.th/student/telteacher.php`,
        headers: {
            "Cookie": sessionID
        }
    });
    const parser = new DOMParser()
    const dom = parser.parseFromString(stdPrint.data, "text/html")

    const teachers = []

    for (const t of dom.querySelectorAll("tbody tr")) {
        const tds = t.querySelectorAll("td")
        teachers.push({
            name: tds[0].innerText,
            room: tds[1].innerText,
            tel: tds[2].innerText,
        })
    }

    return teachers
}

export async function getAttendees(month = 11) {
    const sessionID = await reauthenticate()

    const stdPrint = await RYWLHttp.post({
        url: `https://rayongwit.ac.th/student/index.php`,
        data: `cl=${month}`,
        headers: {
            "Cookie": sessionID,
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });
    const parser = new DOMParser()
    const dom = parser.parseFromString(stdPrint.data, "text/html")

    const attendees = []

    for (const t of dom.querySelectorAll("div tbody tr")) {
        const tds = t.querySelectorAll("td")

        if (tds.length > 3) {
            const attendData = {
                date: thaiToDate(tds[0]?.innerHTML?.trim()),
                dateTxt: tds[0]?.innerHTML?.trim(),
                entranceTime: tds[1]?.innerHTML?.trim(),
                exitTime: tds[2]?.innerHTML?.trim(),
                comment: tds[3]?.innerHTML?.trim(),
            }

            if (attendData.entranceTime && attendData.entranceTime != "-") {
                attendees.push(attendData)
            }
        }
    }

    return attendees
}

export async function getInfo() {
    const sessionID = await reauthenticate()

    if (sessionID) {
        const stdPrint = await RYWLHttp.get({
            url: `https://rayongwit.ac.th/student/print.php`,
            headers: {
                "Cookie": sessionID
            }
        });
        const parser = new DOMParser()
        const dom = parser.parseFromString(stdPrint.data, "text/html")

        let realname = ""
        let surname = ""
        let mathayom = ""
        let room = ""
        let studentNumber = ""

        for (const par of dom.querySelectorAll("p")) {
            if (par.innerText?.includes("ชื่อผู้บำเพ็ญประโยชน์")) {
                const splitd = par.textContent.trim().split("  ")
                let namesplit = splitd[1].split("  ")
                realname = namesplit[0]
                surname = namesplit[1]
                let roomtsplit = splitd[2].split("    ")[1].split("/")
                mathayom = parseInt(roomtsplit[0])
                room = parseInt(roomtsplit[1])

                let numSplit = splitd[3].split(" ").filter((e) => e != '')
                studentNumber = parseInt(numSplit[1])
            }
        }

        const tds = dom.querySelectorAll("td")
        const potentials = []
        for (const par of tds) {
            if (par.innerText.startsWith("(")) {
                potentials.push(par.textContent.replace("(", "").replace(")", ""))
            }
        }

        const teachers = []

        if (tds.length > 2) {
            teachers.push(potentials[0])
            teachers.push(potentials[1])
        } else {
            teachers.push(potentials[0])
        }

        let targetPlan = {}

        if (mathayom > 3) {
            // ม.ปลาย
            targetPlan = store.state.classPlans.second
        } else {
            // ม.ต้น
            targetPlan = store.state.classPlans.first
        }

        let classPlan = "[ ไม่มีข้อมูล ]"

        for (const [key, value] of Object.entries(targetPlan)) {
            if (value.includes(room)) {
                classPlan = key
            }
        }

        const result = {
            sessionID: sessionID,
            headshot: "https://rayongwit.ac.th/ticket/pic/" + store.state.authData.username + "s.JPG",
            firstname: realname,
            surname: surname,
            mathayom: mathayom,
            room: room,
            no: studentNumber,
            studentID: store.state.authData.username,
            classPlan: classPlan,
            classTeachers: teachers,
            nationalID: store.state.authData.password
        }

        return result
    }

    return null
}

export async function getFixStatus() {
    const sessionID = await reauthenticate()

    if (sessionID) {
        const fixStatus = await getBehaviourData()

        if (fixStatus.status.startsWith("คะแนนพฤติกรรมสะสม")) {
            const stdPrint = await RYWLHttp.get({
                url: `https://rayongwit.ac.th/student/print.php`,
                headers: {
                    "Cookie": sessionID
                }
            });
            const parser = new DOMParser()
            const dom = parser.parseFromString(stdPrint.data, "text/html")

            return {
                score: dom.querySelector("p[style='color:red;display:inline-block;float: left;']")?.innerHTML?.replace(/\D/g, ''),
                fixed: dom.querySelector("p[style='color:green;']")?.innerHTML?.replace(/\D/g, ''),
                status: false
            }
        } else {
            return {
                status: true
            }
        }
    }
}

export function setToState(username, password) {
    store.state.authData.username = username
    store.state.authData.password = password
}

export function clearAuthState() {
    store.state.authData.username = ""
    store.state.authData.password = ""
    store.state.userData = null
}

export async function saveToPreferences() {
    await SecureStoragePlugin.set({
        key: "loginData",
        value: JSON.stringify(store.state.authData)
    })
}

export async function loadFromPreferences() {
    const loginDB = await SecureStoragePlugin.get({
        key: "loginData"
    })

    if (loginDB.value) {
        const loginData = JSON.parse(loginDB.value)
        store.state.authData = loginData

        try {
            const userdataCache = await Preferences.get({ key: "cache_userData" })

            if (userdataCache.value) {
                store.state.userData = JSON.parse(userdataCache.value)
                store.state.displayUserData = store.state.userData
            }
        } catch (e) { Logger.warn(e) }

        store.dispatch("setUserdata", (await getInfo()))

        Preferences.set({ key: "cache_userData", value: JSON.stringify({...store.state.userData, nationalID: "<>", studentID: "<>", sessionID: "<>"}) })

    }
}