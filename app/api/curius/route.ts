export async function GET() {
  const res = await fetch('https://curius.app/api/users/2790/searchLinks', {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json();
  return new Response(JSON.stringify({ data }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
