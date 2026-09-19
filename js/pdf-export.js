/**
 * BioTailr AI - Accurate HTML to PDF Exporter
 * Uses html2pdf.js with A4 dimensions and vector font rendering.
 */

export function downloadResumeAsPdf(targetElementId = 'resume-document', filename = 'BioTailr_Resume.pdf') {
  const element = document.getElementById(targetElementId);
  if (!element) {
    console.error('Target element not found:', targetElementId);
    window.print();
    return;
  }

  // Check if html2pdf is loaded from CDN
  if (typeof window.html2pdf !== 'undefined') {
    const opt = {
      margin: [0, 0, 0, 0], // Exact A4 margins defined directly in CSS
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        logging: false
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    window.html2pdf().set(opt).from(element).save();
  } else {
    // Graceful native browser print fallback
    window.print();
  }
}

export function printResumeNative() {
  window.print();
}
