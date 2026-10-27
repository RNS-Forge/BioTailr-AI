/**
 * BioTailr AI - In-Browser Direct PDF Canvas Editor
 * Powered by PDF.js (Canvas & Text Layer) and PDF-Lib (Binary PDF Compilation).
 *
 * Capabilities:
 * 1. Loads user PDF resume (or base career track PDF) directly into memory.
 * 2. Renders high-DPI retina canvas pages with exact vector fidelity.
 * 3. Overlays coordinate-accurate, click-to-edit interactive text layers.
 * 4. Merges fragmented text items into natural editable lines/bullet points.
 * 5. Real-time ATS re-scoring as candidate edits text on the PDF.
 * 6. Compiles all modifications directly into the PDF binary via PDF-Lib and downloads.
 */

export class PdfCanvasEditor {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('pdf-canvas-viewport');
    this.onTextChange = options.onTextChange || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});

    this.pdfDoc = null;
    this.originalBytes = null;
    this.currentPageNum = 1;
    this.numPages = 1;
    this.scale = options.initialScale || 1.35;
    this.pageTextItems = []; // per page: array of { id, text, origText, x, y, width, height, fontSize, fontName, transform, pdfX, pdfY, pdfWidth, pdfHeight }
    this.modifiedItems = new Map(); // key: `${pageNum}_${id}` -> { origText, newText, pdfX, pdfY, ... }
    this.isRendering = false;
    this.activeFilename = 'Resume.pdf';
  }

  /**
   * Loads a PDF from a File object, ArrayBuffer, Uint8Array, or URL
   */
  async loadPdf(source, filename = 'Resume.pdf') {
    this.activeFilename = filename;
    this.onStatusChange('Reading PDF buffer...', 15);

    if (source instanceof File) {
      this.originalBytes = await source.arrayBuffer();
    } else if (source instanceof ArrayBuffer) {
      this.originalBytes = source;
    } else if (source instanceof Uint8Array) {
      this.originalBytes = source.buffer;
    } else if (typeof source === 'string') {
      const response = await fetch(source);
      this.originalBytes = await response.arrayBuffer();
    } else {
      throw new Error('Unsupported PDF source type');
    }

    if (typeof window.pdfjsLib === 'undefined') {
      throw new Error('PDF.js library is not loaded. Please verify CDN script in head.');
    }

    this.onStatusChange('Loading PDF document...', 35);
    const loadingTask = window.pdfjsLib.getDocument({
      data: this.originalBytes.slice(0),
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
      cMapPacked: true
    });

    this.pdfDoc = await loadingTask.promise;
    this.numPages = this.pdfDoc.numPages;
    this.currentPageNum = 1;
    this.modifiedItems.clear();

    this.onStatusChange('Rendering editable PDF canvas...', 65);
    await this.renderPage(this.currentPageNum);
    this.onStatusChange('PDF Canvas Editor Ready', 100);

    return {
      numPages: this.numPages,
      filename: this.activeFilename
    };
  }

  /**
   * Renders a specific page to canvas and sets up the interactive editable text layer
   */
  async renderPage(pageNum = 1) {
    if (!this.pdfDoc || this.isRendering) return;
    this.isRendering = true;
    this.currentPageNum = pageNum;

    try {
      const page = await this.pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: this.scale });

      // Build or retrieve page wrapper DOM
      let pageWrapper = document.getElementById(`pdf-page-wrapper-${pageNum}`);
      if (!pageWrapper) {
        if (!this.container) return;
        this.container.innerHTML = ''; // clear viewport
        pageWrapper = document.createElement('div');
        pageWrapper.id = `pdf-page-wrapper-${pageNum}`;
        pageWrapper.className = 'pdf-page-wrapper';
        this.container.appendChild(pageWrapper);
      }

      pageWrapper.style.width = `${viewport.width}px`;
      pageWrapper.style.height = `${viewport.height}px`;

      // Canvas setup (retina devicePixelRatio for crisp typography)
      let canvas = pageWrapper.querySelector('canvas.pdf-page-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'pdf-page-canvas';
        pageWrapper.appendChild(canvas);
      }

      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      const ctx = canvas.getContext('2d');
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      // Render PDF vector graphics onto canvas
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };
      await page.render(renderContext).promise;

      // Extract and group text content for the interactive text layer
      const textContent = await page.getTextContent();
      const groupedItems = this.groupTextItems(textContent.items, viewport, page.view, textContent.styles);
      this.pageTextItems[pageNum] = groupedItems;

      // Whiten canvas areas for all previously modified items on this page
      groupedItems.forEach(item => {
        const modKey = `${pageNum}_${item.id}`;
        if (this.modifiedItems.has(modKey)) {
          this.whitenCanvasArea(canvas, item);
        }
      });

      // Build interactive text layer
      this.buildInteractiveTextLayer(pageWrapper, groupedItems, viewport, pageNum);

      // Update page indicators
      this.updatePageIndicator();

    } catch (err) {
      console.error('[PdfCanvasEditor] Page render error:', err);
    } finally {
      this.isRendering = false;
    }
  }

  /**
   * Clears underlying canvas raster pixels for an item so edited text has zero ghosting
   */
  whitenCanvasArea(canvas, item) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pixelRatio = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.fillStyle = '#ffffff';
    const padX = 2;
    const padY = 2;
    ctx.fillRect(
      Math.max(0, item.vx - padX),
      Math.max(0, item.vy - padY),
      item.vWidth + (padX * 2),
      item.vHeight + (padY * 2)
    );
    ctx.restore();
  }

  /**
   * Groups fragmented PDF glyphs/words into cohesive editable lines and sentences
   */
  groupTextItems(rawItems, viewport, pageView, styles = {}) {
    if (!rawItems || rawItems.length === 0) return [];

    const pdfPageHeight = pageView ? (pageView[3] - pageView[1]) : 792;
    const items = [];
    let currentLine = null;

    rawItems.forEach((raw, idx) => {
      const str = raw.str;
      if (!str && str !== '') return;

      const tx = raw.transform; // [scaleX, skewY, skewX, scaleY, transX, transY]
      const fontHeight = Math.hypot(tx[2], tx[3]) || Math.abs(tx[0]) || 10;
      
      // Viewport coordinates
      const [vx, baselineVy] = viewport.convertToViewportPoint(tx[4], tx[5]);
      const vWidth = raw.width * viewport.scale;
      const vHeight = fontHeight * viewport.scale;
      // Align box to top of font
      const vy = baselineVy - (vHeight * 0.88);

      // Font style analysis
      const fontStyle = (styles && styles[raw.fontName]) || {};
      const fontNameLower = (raw.fontName || '').toLowerCase();
      const styleFamilyLower = (fontStyle.fontFamily || '').toLowerCase();

      const isBold = fontNameLower.includes('bold') || fontNameLower.includes('black') || 
                     fontNameLower.includes('heavy') || fontNameLower.includes('700') || 
                     fontNameLower.includes('800') || styleFamilyLower.includes('bold');
      const isItalic = fontNameLower.includes('italic') || fontNameLower.includes('oblique') || 
                       styleFamilyLower.includes('italic');
      const isSerif = styleFamilyLower.includes('serif') || fontNameLower.includes('times') || 
                      fontNameLower.includes('georgia') || fontNameLower.includes('garamond') || 
                      fontNameLower.includes('roman');

      // Check if this item continues the previous line
      const yTol = Math.max(3.5, vHeight * 0.35);
      const isSameBaseline = currentLine && Math.abs(currentLine.baselineVy - baselineVy) < yTol;
      const gap = currentLine ? (vx - (currentLine.vx + currentLine.vWidth)) : 999;
      const isAdjacent = currentLine && gap >= -5 && gap < Math.max(32, vHeight * 1.8);

      if (isSameBaseline && isAdjacent) {
        // Append to current line with natural space separation if needed
        const needsSpace = !currentLine.text.endsWith(' ') && !str.startsWith(' ') && gap > 1;
        currentLine.text += (needsSpace ? ' ' : '') + str;
        currentLine.vWidth = (vx + vWidth) - currentLine.vx;
        currentLine.pdfWidth = (tx[4] + raw.width) - currentLine.pdfX;
        if (isBold) currentLine.isBold = true;
        if (isItalic) currentLine.isItalic = true;
        currentLine.rawItems.push(raw);
      } else {
        // Start a new line
        if (currentLine && currentLine.text.trim().length > 0) {
          items.push(currentLine);
        }
        currentLine = {
          id: `line_${idx}`,
          text: str,
          origText: str,
          vx: vx,
          vy: vy,
          baselineVy: baselineVy,
          vWidth: Math.max(vWidth, 18),
          vHeight: Math.max(vHeight, 14),
          fontSize: Math.round(fontHeight * viewport.scale),
          isBold: isBold,
          isItalic: isItalic,
          isSerif: isSerif,
          fontName: raw.fontName || 'sans-serif',
          // Raw PDF coordinate tracking for compilation
          pdfX: tx[4],
          pdfY: tx[5],
          pdfWidth: raw.width || (str.length * fontHeight * 0.5),
          pdfHeight: fontHeight,
          pdfPageHeight: pdfPageHeight,
          rawItems: [raw]
        };
      }
    });

    if (currentLine && currentLine.text.trim().length > 0) {
      items.push(currentLine);
    }

    return items;
  }

  /**
   * Injects editable text blocks over the canvas at exact visual coordinates
   */
  buildInteractiveTextLayer(pageWrapper, items, viewport, pageNum) {
    let textLayer = pageWrapper.querySelector('.pdf-text-layer-overlay');
    if (textLayer) {
      textLayer.remove();
    }

    const canvas = pageWrapper.querySelector('canvas.pdf-page-canvas');

    textLayer = document.createElement('div');
    textLayer.className = 'pdf-text-layer-overlay';
    textLayer.style.width = `${viewport.width}px`;
    textLayer.style.height = `${viewport.height}px`;

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'pdf-editable-text-item';
      el.id = `pdf-item-${pageNum}-${item.id}`;
      el.contentEditable = 'true';
      el.spellcheck = false;

      // Position precisely over the canvas text
      el.style.left = `${Math.max(0, item.vx)}px`;
      el.style.top = `${Math.max(0, item.vy)}px`;
      el.style.minWidth = `${Math.max(item.vWidth, 24)}px`;
      el.style.minHeight = `${Math.max(item.vHeight, 14)}px`;
      el.style.fontSize = `${Math.max(9, item.fontSize)}px`;
      el.style.lineHeight = `${Math.max(14, Math.round(item.fontSize * 1.25))}px`;
      el.style.fontFamily = item.isSerif 
        ? "'Times New Roman', Times, Georgia, serif" 
        : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
      el.style.fontWeight = item.isBold ? '700' : '400';
      el.style.fontStyle = item.isItalic ? 'italic' : 'normal';

      // Check if user already modified this item
      const modKey = `${pageNum}_${item.id}`;
      if (this.modifiedItems.has(modKey)) {
        const mod = this.modifiedItems.get(modKey);
        el.textContent = mod.newText;
        el.classList.add('user-edited');
        this.whitenCanvasArea(canvas, item);
      } else {
        el.textContent = item.text;
      }

      // Title tooltip
      el.title = 'Click to edit text directly on resume';

      // On focus, whiten canvas area so typing has crisp white background without ghosting
      el.addEventListener('focus', () => {
        this.whitenCanvasArea(canvas, item);
      });

      // Event: input (while typing)
      el.addEventListener('input', () => {
        const newText = el.textContent;
        this.recordModification(pageNum, item, newText);
        el.classList.add('user-edited');
        this.whitenCanvasArea(canvas, item);
        this.onTextChange({
          pageNum,
          item,
          newText,
          fullDocumentText: this.getFullDocumentText()
        });
      });

      // Keyboard shortcuts: Escape to finish editing
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          el.blur();
        }
      });

      textLayer.appendChild(el);
    });

    pageWrapper.appendChild(textLayer);
  }

  /**
   * Records a user modification for PDF-lib compilation
   */
  recordModification(pageNum, item, newText) {
    const modKey = `${pageNum}_${item.id}`;
    item.text = newText;
    this.modifiedItems.set(modKey, {
      pageNum,
      id: item.id,
      origText: item.origText,
      newText: newText,
      pdfX: item.pdfX,
      pdfY: item.pdfY,
      pdfWidth: item.pdfWidth,
      pdfHeight: item.pdfHeight,
      pdfPageHeight: item.pdfPageHeight,
      fontSize: item.fontSize / this.scale,
      isBold: item.isBold,
      isItalic: item.isItalic,
      isSerif: item.isSerif
    });
  }

  /**
   * Concatenates all current text lines across pages into a single string (for ATS evaluation)
   */
  getFullDocumentText() {
    const lines = [];
    for (let p = 1; p <= this.numPages; p++) {
      const items = this.pageTextItems[p] || [];
      items.forEach(it => {
        if (it.text && it.text.trim()) {
          lines.push(it.text.trim());
        }
      });
    }
    return lines.join('\n');
  }

  /**
   * Compiles all edits directly into the PDF binary using PDF-Lib and triggers download
   */
  async downloadCompiledPdf(filename = null) {
    const downloadName = filename || this.activeFilename || 'BioTailr_Tailored_Resume.pdf';

    if (typeof window.PDFLib === 'undefined') {
      console.warn('[PdfCanvasEditor] PDFLib not loaded, falling back to canvas export.');
      return this.downloadCanvasAsPdf(downloadName);
    }

    try {
      this.onStatusChange('Compiling PDF modifications with PDF-Lib...', 20);

      // Load original document binary
      const pdfDoc = await window.PDFLib.PDFDocument.load(this.originalBytes.slice(0), {
        ignoreEncryption: true
      });

      // Embed standard clean fonts
      const helveticaFont = await pdfDoc.embedFont(window.PDFLib.StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(window.PDFLib.StandardFonts.HelveticaBold);
      const timesFont = await pdfDoc.embedFont(window.PDFLib.StandardFonts.TimesRoman);
      const timesBoldFont = await pdfDoc.embedFont(window.PDFLib.StandardFonts.TimesRomanBold);

      const pages = pdfDoc.getPages();

      // Apply modifications to each page
      this.modifiedItems.forEach((mod) => {
        const pageIdx = mod.pageNum - 1;
        if (pageIdx < 0 || pageIdx >= pages.length) return;

        const page = pages[pageIdx];

        // Coordinates in PDF-lib: origin is bottom-left
        const x = mod.pdfX;
        const y = mod.pdfY;
        const width = Math.max(mod.pdfWidth * 1.35, 60);
        const height = mod.pdfHeight * 1.35;
        const size = Math.max(mod.fontSize, 8.5);

        let chosenFont = helveticaFont;
        if (mod.isSerif) {
          chosenFont = mod.isBold ? timesBoldFont : timesFont;
        } else {
          chosenFont = mod.isBold ? helveticaBoldFont : helveticaFont;
        }

        // 1. Draw white rectangle over old text to cleanly mask it
        page.drawRectangle({
          x: Math.max(0, x - 2),
          y: Math.max(0, y - 3),
          width: width + 10,
          height: height + 6,
          color: window.PDFLib.rgb(1, 1, 1),
          opacity: 1
        });

        // 2. Draw user's new text cleanly with pure black ink (#000000)
        const lines = (mod.newText || '').split('\n');
        lines.forEach((lineText, lIdx) => {
          if (lineText.length === 0) return;
          const lineY = y - (lIdx * size * 1.25);
          page.drawText(lineText, {
            x: x,
            y: lineY,
            size: size,
            font: chosenFont,
            color: window.PDFLib.rgb(0, 0, 0)
          });
        });
      });

      this.onStatusChange('Saving PDF document...', 80);
      const pdfBytes = await pdfDoc.save();

      // Trigger download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = downloadName.endsWith('.pdf') ? downloadName : `${downloadName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);

      this.onStatusChange('PDF Download Complete', 100);
      return true;

    } catch (err) {
      console.warn('[PdfCanvasEditor] PDF-Lib binary compile error, using high-DPI canvas fallback:', err);
      return this.downloadCanvasAsPdf(downloadName);
    }
  }

  /**
   * Fallback export: captures the edited canvas with the updated text overlay as high-DPI PDF
   */
  async downloadCanvasAsPdf(filename) {
    const pageWrapper = document.getElementById(`pdf-page-wrapper-${this.currentPageNum}`);
    if (!pageWrapper) return false;

    if (typeof window.html2pdf !== 'undefined') {
      const opt = {
        margin: [0, 0, 0, 0],
        filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
      };
      await window.html2pdf().set(opt).from(pageWrapper).save();
      return true;
    }
    return false;
  }

  /**
   * Zoom controls
   */
  async zoomIn() {
    this.scale = Math.min(2.5, this.scale + 0.15);
    await this.renderPage(this.currentPageNum);
  }

  async zoomOut() {
    this.scale = Math.max(0.75, this.scale - 0.15);
    await this.renderPage(this.currentPageNum);
  }

  async setScale(newScale) {
    this.scale = Math.max(0.5, Math.min(3.0, newScale));
    await this.renderPage(this.currentPageNum);
  }

  async nextPage() {
    if (this.currentPageNum < this.numPages) {
      await this.renderPage(this.currentPageNum + 1);
    }
  }

  async prevPage() {
    if (this.currentPageNum > 1) {
      await this.renderPage(this.currentPageNum - 1);
    }
  }

  updatePageIndicator() {
    const el = document.getElementById('pdf-page-num-display');
    if (el) {
      el.textContent = `Page ${this.currentPageNum} of ${this.numPages}`;
    }
  }

  /**
   * Updates an item's text from external sources (e.g. sidebar content editor)
   */
  updateItemText(itemIndex, newText) {
    const items = this.pageTextItems[this.currentPageNum] || [];
    const item = items[itemIndex];
    if (!item) return;

    this.recordModification(this.currentPageNum, item, newText);
    const domEl = document.getElementById(`pdf-item-${this.currentPageNum}-${item.id}`);
    if (domEl) {
      domEl.textContent = newText;
      domEl.classList.add('user-edited');
    }
  }
}
