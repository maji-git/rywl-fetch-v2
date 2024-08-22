import { stripHtml } from "string-strip-html";
import { DOMParser, RYWLHttp } from '../utils/http.js';
import { thaiToDate } from "../utils/date.js";
import { readQR } from "../utils/qr.js";
import axios from "axios";
import { sumTitle } from "./ai.js";

export async function getAnnouncements(aiSum = true) {
  const res = await RYWLHttp.get({
    url: `https://rayongwit.ac.th/%E0%B8%82%E0%B9%88%E0%B8%B2%E0%B8%A7%E0%B8%9B%E0%B8%A3%E0%B8%B0%E0%B8%8A%E0%B8%B2%E0%B8%AA%E0%B8%B1%E0%B8%A1%E0%B8%9E%E0%B8%B1%E0%B8%99%E0%B8%98%E0%B9%8C/`
  });

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
        dateTime: thaiToDate(date.innerHTML.trim()),
        article: title.getAttribute("href"),
      })
    }
  }

  let i = 0

  for (const r of result) {
    if (r.title.length >= 130) {
      const summedTitle = await sumTitle(r.title)

      result[i]["summedTitle"] = summedTitle
      result[i]["useAI"] = true
    }

    i++
  }

  return result
}

export async function getPDFsInURL(url) {
  if (!url.startsWith('https://rayongwit.ac.th/')) {
    return {}
  }

  const res = await RYWLHttp.get({
    url: url
  });
  
  const parser = new DOMParser()
  const dom = parser.parseFromString(res.data, "text/html")

  const result = {}

  for (const element of dom.querySelectorAll("#content a")) {
    const href = element.getAttribute("href")
    if (href && href.includes(".pdf")) {
      const pathname = new URL(href).pathname.split("/")
      const pdfName = decodeURIComponent(pathname[pathname.length - 1])
      result[pdfName] = href
    }
  }

  return result
}

export async function getBanners() {
  const res = await RYWLHttp.get({
    url: `https://rayongwit.ac.th/`
  });

  const parser = new DOMParser()
  const dom = parser.parseFromString(res.data, "text/html")

  const result = []
  const finalResult = []

  for (const element of dom.querySelectorAll(".fitvidsignore")[0].querySelectorAll(".n2-ss-slide-background-image img.skip-lazy")) {
    result.push(element.getAttribute("src"))
  }

  // Scan QR Codes
  for (const url of result) {
    const req = await axios.get(url.replace("https://", "//").replace("//", "https://"), {
      responseType: 'arraybuffer'
    })

    let links = []

    try {
      links.push((await readQR(req.data)))
    } catch {

    }

    finalResult.push({
      url,
      links
    })
  }


  return finalResult
}