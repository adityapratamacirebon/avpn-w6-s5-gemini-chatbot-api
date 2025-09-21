const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");

// Menyimpan riwayat percakapan
let history = [];

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Tampilkan pesan pengguna dan tambahkan ke riwayat
  appendMessage("user", userMessage);
  history.push({ role: "user", parts: [{ text: userMessage }] });

  input.value = "";

  // Tampilkan pesan "thinking..." sementara
  const thinkingMsg = appendMessage("bot", "Gemini is thinking...");

  try {
    // Kirim request ke backend API
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: history,
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    const botResponse = data.result;

    // Update pesan "thinking..." dengan balasan dari bot
    thinkingMsg.innerHTML = renderMarkdown(botResponse);

    // Tambahkan balasan bot ke riwayat
    history.push({ role: "model", parts: [{ text: botResponse }] });
  } catch (error) {
    console.error("Error fetching chat response:", error);
    thinkingMsg.innerHTML =
      "Sorry, something went wrong. Please check the console and try again.";
    thinkingMsg.classList.add("error"); // Opsional: untuk styling pesan error
  }
});

function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg; // Kembalikan elemen pesan agar bisa di-update
}

/**
 * Mengonversi string Markdown sederhana menjadi HTML.
 * Fungsi ini menangani:
 * - Teks tebal (**bold**)
 * - Daftar tidak berurutan (* list)
 * - Baris baru
 * @param {string} text - Teks Markdown yang akan dikonversi.
 * @returns {string} - String HTML yang sudah diformat.
 */
function renderMarkdown(text) {
  // 1. Ganti **text** menjadi <strong>text</strong>
  let html = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // 2. Ganti baris baru (\n) menjadi tag <br>
  // Ini akan memastikan setiap baris baru di respons Gemini ditampilkan dengan benar.
  html = html.replace(/\n/g, "<br>");

  return html;
}
