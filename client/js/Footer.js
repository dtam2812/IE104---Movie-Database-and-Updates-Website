// Footer.js
export async function loadFooter({
  target = "#footer",
  url = "../components/footer.html",
  translate = false, // đổi mặc định về false
} = {}) {
  const host = document.querySelector(target);
  if (!host) throw new Error(`Không thấy ${target}`);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch ${url} -> ${res.status}`);
  host.innerHTML = await res.text();

  if (translate) {
    const { initTranslate } = await import("./Translate.js");
    await initTranslate();
  }
}
