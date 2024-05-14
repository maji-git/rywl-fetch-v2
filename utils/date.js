
const monthEng = {
    "ม.ค.": "January", "ก.พ.": "February", "มี.ค.": "March", "เม.ย.": "April", "พ.ค.": "May", "มิ.ย.": "June", "ก.ค.": "July", "ส.ค.": "August", "ก.ย.": "September", "ต.ค.": "October", "พ.ย.": "November", "ธ.ค.": "December"
}

const monthEngFull = {
    "มกราคม": "January", "กุมภาพันธ์": "February", "มีนาคม": "March", "เมษายน": "April", "พฤษภาคม": "May", "มิถุนายน": "June", "กรกฎาคม": "July", "สิงหาคม": "August", "กันยายน": "September", "ตุลาคม": "October", "พฤศจิกายน": "November", "ธันวาคม": "December"
}

export function thaiToDate(str) {
    let finalStr = ""
    const splitStr = str.replace("  ", " ").split(" ").filter((e) => e != '')

    finalStr = `${parseInt(splitStr[0])} ${splitStr[1]} `

    // parse date
    for (const [key, value] of Object.entries(monthEng)) {
        finalStr = finalStr.replace(key, value)
    }

    for (const [key, value] of Object.entries(monthEngFull)) {
        finalStr = finalStr.replace(key, value)
    }

    let yr = parseInt(`${splitStr[2]}`)

    finalStr += yr

    // parse time if included
    const timeStrIndex = splitStr.findIndex((e) => e == "เวลา")

    if (timeStrIndex != -1) {
        finalStr += ` ${splitStr[timeStrIndex + 1].replace(".", ":")}`
    }

    return new Date(finalStr)
}

export function timeStrToDate(str, timeRef) {
    const d = new Date(timeRef.getTime())
    d.setHours(str.split(":")[0])
    d.setMinutes(str.split(":")[1])

    return d
}

export function inbetweenTime(startTime, endTime, dateTime) {
    const startDate = timeStrToDate(startTime, dateTime)
    const endDate = timeStrToDate(endTime, dateTime)

    return startDate < dateTime && endDate > dateTime
}

/**
 * Check if the day is weekend
 * @param {Date} dateTime 
 * @returns {bool}
 */
export function isWeekend(dateTime) {
    return dateTime.getDay() == 0 || dateTime.getDay() == 6
}

export function formatDate(dateTime) {
    return new Intl.DateTimeFormat('th', {
        dateStyle: 'short',
        timeStyle: "short"
    }).format(dateTime)
}

export function dateDiffInDays(a, b) {
    const _MS_PER_DAY = 1000 * 60 * 60 * 24;
    // Discard the time and time-zone information.
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}