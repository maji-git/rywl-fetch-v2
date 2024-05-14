export async function getAvailabilites() {
  const res = await fetch(`${window.rywlAPIs.rywl}/app/room-avaib.json`)
  return (await res.json())
}