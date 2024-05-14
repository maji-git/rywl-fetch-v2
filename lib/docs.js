export async function getDocs() {
    const res = await fetch(`${window.rywlAPIs.rywl}/app/docs.json`)
    return (await res.json())
}