import { jsPDF } from "jspdf";
import * as pdfjs from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import {
  hexToRgb,
  normalizeHexColor,
  parsePages,
  recolorImageData,
} from "./pdf-recolor.js";
import "./styles.css";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

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

const renderRecoloredPage = async ({
  page,
  renderScale,
  targetColor,
  threshold,
  maxSaturation,
}) => {
  const viewport = page.getViewport({ scale: renderScale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  await page.render({ canvasContext: context, viewport }).promise;
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  context.putImageData(
    recolorImageData(imageData, targetColor, threshold, maxSaturation),
    0,
    0,
  );

  return {
    image: canvas.toDataURL("image/jpeg", 0.92),
    width: viewport.width / renderScale,
    height: viewport.height / renderScale,
  };
};

const addPageToPdf = (outputPdf, pageImage) => {
  const orientation =
    pageImage.width > pageImage.height ? "landscape" : "portrait";
  const nextPdf =
    outputPdf ??
    new jsPDF({
      orientation,
      unit: "pt",
      format: [pageImage.width, pageImage.height],
    });

  if (outputPdf) {
    nextPdf.addPage([pageImage.width, pageImage.height], orientation);
  }

  nextPdf.addImage(
    pageImage.image,
    "JPEG",
    0,
    0,
    pageImage.width,
    pageImage.height,
  );
  return nextPdf;
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
    setStatus(
      `Rendering page ${pageIndex + 1} of ${selectedPages.length}...`,
      pageIndex / selectedPages.length,
    );

    const page = await pdf.getPage(pageNumber);
    const pageImage = await renderRecoloredPage({
      page,
      renderScale,
      targetColor,
      threshold,
      maxSaturation,
    });
    outputPdf = addPageToPdf(outputPdf, pageImage);
  }

  const baseName = selectedFile.name.replace(/\.pdf$/i, "");
  outputPdf.save(`${baseName}-color-ink.pdf`);
  setStatus(
    `Converted ${selectedPages.length} page${selectedPages.length === 1 ? "" : "s"}.`,
  );
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
  if (
    file?.type === "application/pdf" ||
    file?.name.toLowerCase().endsWith(".pdf")
  ) {
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
  document.querySelector("#saturation-value").textContent =
    saturationInput.value;
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
