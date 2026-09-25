const canonical = "https://deflow.at/";
const starts = [
  "http://deflow.at/",
  "https://deflow.at/",
  "http://www.deflow.at/",
  "https://www.deflow.at/",
];

async function followRedirects(start) {
  const seen = new Set();
  const chain = [];
  let current = start;

  for (let hop = 0; hop < 10; hop += 1) {
    if (seen.has(current)) {
      throw new Error(`redirect loop: ${[...chain, current].join(" -> ")}`);
    }

    seen.add(current);
    chain.push(current);
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
      headers: { "user-agent": "deflow-deployment-check/1.0" },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error(`${response.status} without Location header at ${current}`);
      current = new URL(location, current).href;
      continue;
    }

    return { response, finalUrl: current, chain };
  }

  throw new Error(`more than 10 redirects: ${chain.join(" -> ")}`);
}

let failed = false;

for (const start of starts) {
  try {
    const { response, finalUrl, chain } = await followRedirects(start);
    const okay = response.status === 200 && finalUrl === canonical;
    console.log(`${okay ? "PASS" : "FAIL"} ${start} -> ${finalUrl} [${response.status}] (${chain.length - 1} redirects)`);
    if (!okay) failed = true;
  } catch (error) {
    failed = true;
    console.error(`FAIL ${start}: ${error.message}`);
  }
}

const files = [
  ["/robots.txt", "text/plain"],
  ["/sitemap.xml", "application/xml"],
  ["/projects/sherl-icon.png", "image/png"],
  ["/og.jpg", "image/jpeg"],
  ["/icon-192.png", "image/png"],
  ["/publickey_deflow.asc", "text/plain"],
];

for (const [pathname, expectedType] of files) {
  try {
    const requestedUrl = new URL(pathname, canonical).href;
    const { response, finalUrl } = await followRedirects(requestedUrl);
    const contentType = response.headers.get("content-type") ?? "";
    const okay = response.status === 200 && finalUrl === requestedUrl && contentType.includes(expectedType);
    console.log(`${okay ? "PASS" : "FAIL"} ${pathname} [${response.status}] ${contentType}`);
    if (!okay) failed = true;
  } catch (error) {
    failed = true;
    console.error(`FAIL ${pathname}: ${error.message}`);
  }
}

if (failed) process.exitCode = 1;
