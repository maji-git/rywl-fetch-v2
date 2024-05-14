import store from '@/js/store.js';
import { CapacitorHttp } from '@capacitor/core';
import { f7 } from 'framework7-vue';

export async function getAllTeachers() {
    const subjects = []
    const prog = f7.dialog.progress("กำลังดึงข้อมูล...", 1)
    prog.open()
    prog.setProgress(0)
    let i = 0

    for (const [groupID, tName] of Object.entries(store.state.teacherGroups)) {
        const teachers = []

        prog.setText(`กำลังดึงข้อมูล... (${tName})`)
        const stdPerson = await CapacitorHttp.get({
            url: `https://rayongwit.ac.th/main/person.php?groupid=${groupID}`
        });
        const parser = new DOMParser()
        const dom = parser.parseFromString(stdPerson.data.replaceAll("../", "https://rayongwit.ac.th/"), "text/html")
    
        for (const t of dom.querySelectorAll("#img .allimg, #img .director")) {
            const fontData = (t.querySelector("font")?.innerHTML).split("<br>")
            
            teachers.push({
                picture: t.querySelector("img")?.src ?? undefined,
                name: fontData[0]?.trim() ?? "???",
                role: fontData[1]?.trim()?.replace("ฯ", "") ?? "???",
            })
        }

        subjects.push({
            subjectName: tName,
            groupID: groupID,
            teachers: teachers
        })
        
        i++
        prog.setProgress((i / Object.keys(store.state.teacherGroups).length) * 100)
    }

    prog.close()

    return subjects
}