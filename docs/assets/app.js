import * as pdfjs from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";

pdfjs.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

const { jsPDF } = globalThis.jspdf;

const fileInput = document.querySelector("#pdf-file");
const dropzone = document.querySelector("#dropzone");
const fileName = document.querySelector("#file-name");
const form = document.querySelector("#settings-form");
const convertButton = document.querySelector("#convert-button");
const statusText = document.querySelector("#status");
const progress = document.querySelector("#progress");
const colorInput = document.querySelector("#ink-color");
const colorText = document.querySelector("#ink-color-text");
const scaleInput = document.querySelector("#scale");
const thresholdInput = document.querySelector("#threshold");
const saturationInput = document.querySelector("#saturation");
const pagesInput = document.querySelector("#pages");

let selectedFile = null;

const setStatus = (message, progressValue = null) => {
  statusText.textContent = message;
  if (progressValue === null) {
    progress.hidden = true;
    progress.value = 0;
    return;
  }
  progress.hidden = false;
  progress.value = progressValue;
};

const normalizeHexColor = (value) => {
  const trimmed = value.trim();
  const hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    throw new Error("Color must be in #RRGGBB format.");
  }
  return hex.toLowerCase();
};

const hexToRgb = (value) => {
  const hex = normalizeHexColor(value).slice(1);
  return [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16));
};

const parsePages = (value, pageCount) => {
  if (!value.trim()) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages = value
    .split(",")
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((page) => Number.isInteger(page));

  if (pages.length === 0) {
    throw new Error("Pages must be comma-separated page numbers, such as 1,3,5.");
  }

  for (const page of pages) {
    if (page < 1 || page > pageCount) {
      throw new Error(`Page ${page} is out of range 1..${pageCount}.`);
    }
  }

  return pages;
};

const recolorImageData = (imageData, target, threshold, maxSaturation) => {
  const { data } = imageData;
  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const maxColor = Math.max(red, green, blue);
    const minColor = Math.min(red, green, blue);
    const luminance = Math.floor((299 * red + 587 * green + 114 * blue) / 1000);
    const saturation = maxColor - minColor;

    if (luminance < threshold && saturation < maxSaturation) {
      const alpha = Math.max(0, Math.min(255, 255 - luminance)) / 255;
      data[index] = Math.round(255 - (255 - target[0]) * alpha);
      data[index + 1] = Math.round(255 - (255 - target[1]) * alpha);
      data[index + 2] = Math.round(255 - (255 - target[2]) * alpha);
    }
  }
  return imageData;
};

const setSelectedFile = (file) => {
  selectedFile = file;
  fileName.textContent = file ? file.name : "No file selected";
  convertButton.disabled = !file;
  setStatus(file ? "Ready to convert." : "Select a PDF to begin.");
};

const syncColorText = () => {
  colorText.value = colorInput.value.toLowerCase();
};

const syncColorInput = () => {
  const normalized = normalizeHexColor(colorText.value);
  colorInput.value = normalized;
  colorText.value = normalized;
};

const convertPdf = async () => {
  if (!selectedFile) {
    return;
  }

  const targetColor = hexToRgb(colorText.value);
  const renderScale = Number.parseFloat(scaleInput.value);
  const threshold = Number.parseInt(thresholdInput.value, 10);
  const maxSaturation = Number.parseInt(saturationInput.value, 10);
  const bytes = await selectedFile.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  const selectedPages = parsePages(pagesInput.value, pdf.numPages);
  let outputPdf = null;

  for (let pageIndex = 0; pageIndex < selectedPages.length; pageIndex += 1) {
    const pageNumber = selectedPages[pageIndex];
    setStatus(`Rendering page ${pageIndex + 1} of ${selectedPages.length}...`, pageIndex / selectedPages.length);

    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: renderScale });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    await page.render({ canvasContext: context, viewport }).promise;
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    context.putImageData(recolorImageData(imageData, targetColor, threshold, maxSaturation), 0, 0);

    const pageWidth = viewport.width / renderScale;
    const pageHeight = viewport.height / renderScale;
    const orientation = pageWidth > pageHeight ? "landscape" : "portrait";
    const image = canvas.toDataURL("image/jpeg", 0.92);

    if (!outputPdf) {
      outputPdf = new jsPDF({ orientation, unit: "pt", format: [pageWidth, pageHeight] });
    } else {
      outputPdf.addPage([pageWidth, pageHeight], orientation);
    }

    outputPdf.addImage(image, "JPEG", 0, 0, pageWidth, pageHeight);
  }

  const baseName = selectedFile.name.replace(/\.pdf$/i, "");
  outputPdf.save(`${baseName}-color-ink.pdf`);
  setStatus(`Converted ${selectedPages.length} page${selectedPages.length === 1 ? "" : "s"}.`);
};

fileInput.addEventListener("change", () => {
  setSelectedFile(fileInput.files?.[0] ?? null);
});

dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("is-dragging");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("is-dragging");
});

dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropzone.classList.remove("is-dragging");
  const file = event.dataTransfer.files?.[0];
  if (file?.type === "application/pdf" || file?.name.toLowerCase().endsWith(".pdf")) {
    fileInput.files = event.dataTransfer.files;
    setSelectedFile(file);
  } else {
    setStatus("Please choose a PDF file.");
  }
});

colorInput.addEventListener("input", syncColorText);
colorText.addEventListener("change", () => {
  try {
    syncColorInput();
    setStatus(selectedFile ? "Ready to convert." : "Select a PDF to begin.");
  } catch (error) {
    setStatus(error.message);
  }
});

scaleInput.addEventListener("input", () => {
  document.querySelector("#scale-value").textContent = scaleInput.value;
});

thresholdInput.addEventListener("input", () => {
  document.querySelector("#threshold-value").textContent = thresholdInput.value;
});

saturationInput.addEventListener("input", () => {
  document.querySelector("#saturation-value").textContent = saturationInput.value;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  convertButton.disabled = true;
  try {
    await convertPdf();
  } catch (error) {
    setStatus(error.message || "Conversion failed.");
  } finally {
    convertButton.disabled = !selectedFile;
  }
});
