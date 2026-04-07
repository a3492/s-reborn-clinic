export async function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <clipPath id="shape">
      <rect width="32" height="32" rx="7" ry="7"/>
    </clipPath>
  </defs>
  <g clip-path="url(#shape)">
    <rect width="32" height="32" fill="#C9A96E"/>
    <polygon points="32,0 32,32 0,32" fill="#F472B6"/>
  </g>
  <text
    x="16" y="21"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
    font-weight="800"
    font-size="13"
    fill="white"
    text-anchor="middle"
    letter-spacing="-0.5"
  >SC</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
