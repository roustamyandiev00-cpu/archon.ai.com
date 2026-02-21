async function checkHeaders() {
  const url = 'https://hqeozmmlddvempancnao.supabase.co/rest/v1/'
  const response = await fetch(url)
  console.log('Headers:', response.headers)
  for (const [key, value] of response.headers.entries()) {
    console.log(`${key}: ${value}`)
  }
}

checkHeaders()
