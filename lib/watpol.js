import { stripHtml } from "string-strip-html";
import { RYWLHttp } from '../utils/http.js';

export async function getTermResults(username, password, server = "http://svwatpol2.rayongwit.ac.th:8080/") {
    const respre = await RYWLHttp.get({
        url: server
    });

    if (respre['error']) {
        throw "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้"
    }

    const parserpre = new DOMParser()
    const documentpre = parserpre.parseFromString(respre.data, "text/html")

    const formData = new FormData();
    formData.set('ctl00$ContentPlaceHolder1$TextBox1', username);
    formData.set('ctl00$ContentPlaceHolder1$TextBox2', password);
    formData.set('ctl00$ContentPlaceHolder1$Button1', "แสดงผล");
    formData.set('__VIEWSTATE', documentpre.querySelector("#__VIEWSTATE").getAttribute("value"));
    formData.set('__VIEWSTATEGENERATOR',  documentpre.querySelector("#__VIEWSTATEGENERATOR").getAttribute("value"));
    formData.set('__EVENTVALIDATION',  documentpre.querySelector("#__EVENTVALIDATION").getAttribute("value"));

    const loginPayload = new URLSearchParams(formData);

    const res = await RYWLHttp.request({
        url: server,
        method: 'POST',
        data: loginPayload.toString(),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        }
    });

    const parser = new DOMParser()
    const dom = parser.parseFromString(res.data, "text/html")
    const gradeSubjects = []
    const additonalField = {}
    let i = 0

    for (const element of dom.querySelectorAll("#ContentPlaceHolder1_GridView1 tbody > tr")) {
        i += 1
        // Ignore header
        if (i == 1) {
            continue
        }

        const tds = element.getElementsByTagName("td")

        gradeSubjects.push({
            subjectCode: stripHtml(tds[0].innerHTML).result,
            subjectName: stripHtml(tds[1].innerHTML).result,
            subjectType: parseInt(stripHtml(tds[2].innerHTML).result),
            subjectGrid: parseFloat(stripHtml(tds[3].innerHTML).result),
            totalUnit: parseInt(stripHtml(tds[4].innerHTML).result),
            midTerm: parseInt(stripHtml(tds[5].innerHTML).result),
            finalTerm: parseInt(stripHtml(tds[6].innerHTML).result),
            totalScore: parseInt(stripHtml(tds[7].innerHTML).result),
            grade: stripHtml(tds[8].innerHTML).result == "ผ" ? true : parseFloat(stripHtml(tds[8].innerHTML).result),
            gradeFix: parseFloat(stripHtml(tds[9].innerHTML).result),
            traitScore: parseInt(stripHtml(tds[10].innerHTML).result),
            readScore: parseInt(stripHtml(tds[11].innerHTML).result),
            teacherName: stripHtml(tds[12].innerHTML).result,
        })
    }

    i = 0

    for (const element of dom.querySelectorAll(".flt3.cpinner2 table:nth-last-child(3) tbody > tr")) {
        let nthAdd = 0
        i++
        if (i == 1) {
            nthAdd = 1
        }

        const title1 = element.querySelector(`td:nth-child(${1 + nthAdd})`)
        let data1 = element.querySelector(`td:nth-child(${2 + nthAdd})`)

        const title2 = element.querySelector(`td:nth-child(${3 + nthAdd})`)
        let data2 = element.querySelector(`td:nth-child(${4 + nthAdd})`)

        if (data1 && data1.textContent) {
            if (!isNaN(parseFloat(data1.textContent.trim())) && !data1.textContent.includes("/")) {
                data1 = parseFloat(data1.textContent.trim())
            } else {
                data1 = data1.textContent.trim()
            }
        }

        if (data2 && data2.textContent) {

            if (!isNaN(parseFloat(data2.textContent.trim())) && !data2.textContent.includes("/")) {
                data2 = parseFloat(data2.textContent.trim())
            } else {
                data2 = data2.textContent.trim()
            }
        }

        additonalField[title1.textContent.trim()] = data1
        additonalField[title2.textContent.trim()] = data2
    }

    if (!dom.querySelector("#ContentPlaceHolder1_Chart1")) {
        return {success: false, err: dom.querySelector("#ContentPlaceHolder1_Label3").textContent || ""}
    }

    const result = {
        grades: gradeSubjects,
        fields: additonalField,
        chartImg: dom.querySelector("#ContentPlaceHolder1_Chart1").getAttribute('src'),
        header2: dom.querySelector("#ContentPlaceHolder1_Label2").textContent,
        header3: dom.querySelector("#ContentPlaceHolder1_Label3").textContent,
    }

    return {success: true, result}
}