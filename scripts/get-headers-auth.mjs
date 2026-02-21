async function getHeaders() {
  const url = 'https://hqeozmmlddvempancnao.supabase.co/rest/v1/'
  const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZW96bW1sZGR2ZW1wYW5jbmFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NDE0OTAsImV4cCI6MjA4NzIxNzQ5MH0.AdNH_DwkvsiR_RhRqRbzp6fSxGd-GiKacIjiB4mbEDE'
  const response = await fetch(url, { headers: { 'apikey': apikey } })
  console.log('Headers:')
  for (const [key, value] of response.headers.entries()) {
    console.log(`${key}: ${value}`)
  }
}

getHeaders()
