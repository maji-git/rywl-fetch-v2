import { RYWLHttp } from '../utils/http.js';
import store from '@/js/store.js';
import { thaiToDate } from '../utils/date';

export async function reauthenticate() {
    if (store.state.authData.username == "" || store.state.authData.password == "") {
        return
    }

    await RYWLHttp.post({
        url: `https://admission.rayongwit.ac.th/quota.ryw/login.php`,
        data: `stdid=${store.state.authData.username}&idcard=${store.state.authData.password}&submit=%E0%B8%95%E0%B8%A3%E0%B8%A7%E0%B8%88%E0%B8%AA%E0%B8%AD%E0%B8%9A%E0%B8%82%E0%B9%89%E0%B8%AD%E0%B8%A1%E0%B8%B9%E0%B8%A5`,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });

    if (store.state.userData == null) {
        store.dispatch("setUserdata", {})
    }

    let sessionID = ""

    if (window['rywlUseProxy']) {
        sessionID = document.cookie
    } else {
        sessionID = document.cookie + "; path=/"
    }

    return sessionID
}

export async function getBehaviourData() {
    const sessionID = await reauthenticate()

    if (sessionID) {
        const res = await RYWLHttp.get({
            url: `https://admission.rayongwit.ac.th/quota.ryw/`
        });

        document.querySelector('td[bgcolor="#918F8F"]').parentNode.parentNode

        const parser = new DOMParser()
        const dom = parser.parseFromString(res.data, "text/html")

        const result = []

        for (const element of dom.querySelectorAll(".post-right-content")) {
            const title = element.querySelector(".tpg-post-link")
            const date = element.querySelector(".date a")

            if (title && date) {
                result.push({
                    title: stripHtml(title.innerHTML.trim()).result,
                    date: stripHtml(date.innerHTML.trim()).result,
                    article: title.getAttribute("href"),
                })
            }
        }

        return result
    }
}

export async function getTimetable() {
    const res = await RYWLHttp.get({
        url: `https://admission.rayongwit.ac.th/quota.ryw/`
    });

    const parser = new DOMParser()
    const dom = parser.parseFromString(res.data, "text/html")
    //let dom = document

    const result = {}

    for (const tr of dom.querySelector('td[bgcolor="#918F8F"]').parentNode.parentNode.querySelectorAll("tr:not(:first-child)")) {
        const tds = tr.querySelectorAll("td")

        result[tds[0].textContent] = {
            start: thaiToDate(tds[1]?.textContent),
            end: thaiToDate(tds[2]?.textContent)
        }
    }

    return result
}