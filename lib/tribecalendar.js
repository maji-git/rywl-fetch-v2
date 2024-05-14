export async function getEvents(page, searchQuery) {
    const eventData = await fetch(`https://rayongwit.ac.th/wp-json/tribe/events/v1/events?page=${page}${searchQuery ? `&search=${searchQuery}` : ''}`)

    return (await eventData.json())
}

export async function getByMonthYear(month, year) {
    const eventData = await fetch(`https://rayongwit.ac.th/wp-json/tribe/events/v1/events?start_date=${year}-${month}-01&end_date=${year}-${month + 1}-01`)

    return (await eventData.json())
}