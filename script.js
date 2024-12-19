// Gerekli DOM elementlerini seç
const pdfUpload = document.getElementById("pdf-upload");
const startButton = document.getElementById("start-button");
const pauseButton = document.getElementById("pause-button");
const finishButton = document.getElementById("finish-button");
const wordDisplay = document.getElementById("word-display");
const speedInput = document.getElementById("speed");
const startPageInput = document.getElementById("start-page");
const endPageInput = document.getElementById("end-page");
const pageProgress = document.getElementById("page-progress");
const startTimeElement = document.getElementById("start-time");
const endTimeElement = document.getElementById("end-time");
const totalDurationElement = document.getElementById("total-duration");
const wordsReadElement = document.getElementById("words-read");

let words = [];
let currentWordIndex = 0;
let intervalId;
let isPaused = false;
let totalPages = 0;
let startTime;

// PDF'den metin çıkarma fonksiyonu
async function extractTextFromPDF(file, startPage, endPage) {
  const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
  endPage = endPage || pdf.numPages;
  let text = "";

  for (let pageNumber = startPage; pageNumber <= endPage; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const pageText = await page.getTextContent();
    text += pageText.items.map((item) => item.str).join(" ");
  }

  return text;
}

// PDF Yüklendiğinde Sayfa Aralığı Girişlerini Hazırla
pdfUpload.addEventListener("change", async () => {
  const file = pdfUpload.files[0];
  if (file) {
    try {
      const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
      startPageInput.max = pdf.numPages;
      endPageInput.max = pdf.numPages;
      startPageInput.value = 1;
      endPageInput.value = pdf.numPages;
      totalPages = pdf.numPages;
      startButton.disabled = false;
    } catch (error) {
      alert("PDF dosyası okunurken bir hata oluştu.");
      startButton.disabled = true;
    }
  }
});

// Okumayı Başlatma Fonksiyonu
startButton.addEventListener("click", async () => {
  const file = pdfUpload.files[0];
  if (!file) {
    alert("Lütfen bir PDF dosyası yükleyin.");
    return;
  }

  const speed = parseInt(speedInput.value);
  const startPage = parseInt(startPageInput.value);
  const endPage = parseInt(endPageInput.value);

  if (
    isNaN(speed) ||
    speed <= 0 ||
    isNaN(startPage) ||
    isNaN(endPage) ||
    startPage < 1 ||
    endPage < 1 ||
    endPage < startPage ||
    endPage > totalPages
  ) {
    alert("Lütfen geçerli bir hız ve sayfa aralığı girin.");
    return;
  }

  try {
    const text = await extractTextFromPDF(file, startPage, endPage);
    words = text.split(/\s+/);
    currentWordIndex = 0;
    startTime = Date.now();
    updateStats();
    controlButtons(true);
    displayWords(speed);
  } catch (error) {
    alert("PDF dosyası okunurken bir hata oluştu.");
  }
});

// Kelimeleri Hızlı Okuma Şeklinde Gösterme Fonksiyonu
function displayWords(speed) {
  const interval = 60000 / speed;
  clearInterval(intervalId);

  intervalId = setInterval(() => {
    if (currentWordIndex >= words.length) {
      clearInterval(intervalId);
      wordDisplay.textContent = "Okuma tamamlandı!";
      controlButtons(false);

      // Bitiş Saati
      const endTime = Date.now();
      const endDate = new Date(endTime);
      endTimeElement.textContent = `Bitiş Saati: ${endDate.toLocaleTimeString()}`;

      // Toplam Süre
      const totalDuration = Math.floor((endTime - startTime) / 1000);
      totalDurationElement.textContent = `Toplam Süre: ${totalDuration}s`;

      // Okunan Kelime
      wordsReadElement.textContent = `Okunan Kelime: ${currentWordIndex}`;

      // Progress Bar'ı Tamamla (%0'a)
      updateReverseProgress(words.length);
      return;
    }

    wordDisplay.textContent = words[currentWordIndex++];
    updateStats();

    // Her kelime gösterildiğinde Progress Bar'ı güncelle (%100'den %0'a)
    updateReverseProgress(currentWordIndex);
  }, interval);
}

// Progress Bar'ı Güncelleme Fonksiyonu (Tersine İlerleme: %100'den %0'a)
function updateReverseProgress(currentIndex) {
  const progressPercentage = 100 - (currentIndex / words.length) * 100;
  pageProgress.style.width = `${progressPercentage}%`;
  pageProgress.setAttribute("aria-valuenow", progressPercentage);
  pageProgress.textContent = `${Math.round(progressPercentage)}% Kaldı`;
}

// İstatistikleri Güncelle
function updateStats() {
  const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
  wordsReadElement.textContent = `Okunan Kelime: ${currentWordIndex}`;
}

// Duraklat/Devam Et Butonuna Basıldığında
pauseButton.addEventListener("click", () => {
  if (isPaused) {
    displayWords(parseInt(speedInput.value));
    pauseButton.textContent = "Duraklat";
  } else {
    clearInterval(intervalId);
    pauseButton.textContent = "Devam Et";
  }
  isPaused = !isPaused;
});

// Bitir Butonuna Basıldığında
finishButton.addEventListener("click", () => {
  clearInterval(intervalId);
  wordDisplay.textContent = "Okuma tamamlandı!";
  controlButtons(false);
  updateStats();
  updateReverseProgress(words.length); // Progress Bar'ı %0'a tamamla
});

// Okuma Kontrol Butonlarını Ayarlama
function controlButtons(isReading) {
  startButton.disabled = isReading;
  pdfUpload.disabled = isReading;
  pauseButton.classList.toggle("d-none", !isReading);
  finishButton.classList.toggle("d-none", !isReading);
  pauseButton.textContent = "Duraklat";
  isPaused = false;
}
