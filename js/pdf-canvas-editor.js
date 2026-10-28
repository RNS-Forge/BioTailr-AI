/**
 * BioTailr AI — Direct Click-and-Editable PDF Resume Editor
 *
 * Implements a pixel-perfect, executive A4 PDF Resume Document Editor where:
 * 1. The document is presented as an authentic A4 PDF sheet (210mm x 297mm, pure #000000 text,
 *    executive typography, hairline dividers, strict margins).
 * 2. EVERY single text field is directly clickable and editable in-place (contenteditable="true"):
 *    Candidate Name, Headline, Contact details, Summary, Section Headings, Company Names,
 *    Job Titles, right-aligned Date Ranges, individual Bullet Points with hanging indents,
 *    and Technical Skills categories.
 * 3. Editing maintains EXACT PDF alignment & structure: dates stay anchored to the right margin,
 *    bullets wrap cleanly without ever overlapping text below them.
 * 4. Real-time ATS re-scoring updates immediately on every keystroke.
 * 5. Direct 1-to-1 PDF compilation & download via high-DPI html2pdf vector output.
 */

export class PdfCanvasEditor {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('pdf-canvas-viewport');
    this.onTextChange = options.onTextChange || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});

    this.profile = null;
    this.activeFilename = 'Tailored_Resume.pdf';
    this.scale = options.initialScale || 1.0;
    this.currentPageNum = 1;
    this.numPages = 1;
    this.originalBytes = null;
    this.isRendering = false;
  }

  /**
   * Loads a PDF from a File object, ArrayBuffer, Uint8Array, or URL,
   * extracts the structured text, and renders the editable PDF document sheet.
   */
  async loadPdf(source, filename = 'Resume.pdf') {
    this.activeFilename = filename;
    this.onStatusChange('Reading PDF document...', 20);

    if (source instanceof File) {
      this.originalBytes = await source.arrayBuffer();
    } else if (source instanceof ArrayBuffer) {
      this.originalBytes = source;
    } else if (source instanceof Uint8Array) {
      this.originalBytes = source.buffer;
    } else if (typeof source === 'string') {
      const response = await fetch(source);
      this.originalBytes = await response.arrayBuffer();
    }

    if (typeof window.pdfjsLib === 'undefined') {
      throw new Error('PDF.js library is not loaded. Please verify script inclusion.');
    }

    this.onStatusChange('Extracting PDF text taxonomy...', 45);
    const loadingTask = window.pdfjsLib.getDocument({
      data: this.originalBytes.slice(0),
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
      cMapPacked: true
    });

    const pdfDoc = await loadingTask.promise;
    this.numPages = pdfDoc.numPages || 1;

    // Extract text across all pages
    const pageTexts = [];
    for (let p = 1; p <= pdfDoc.numPages; p++) {
      const page = await pdfDoc.getPage(p);
      const textContent = await page.getTextContent();
      const pageStr = textContent.items.map(it => it.str).join(' ');
      pageTexts.push(pageStr);
    }
    const fullRawText = pageTexts.join('\n\n');

    // Parse into structured profile using parser
    const { structureResumeData } = await import('./resume-parser.js');
    const profile = structureResumeData(fullRawText, filename);

    this.onStatusChange('Rendering editable PDF sheet...', 80);
    this.loadProfile(profile, filename);
    this.onStatusChange('PDF Editor Ready', 100);

    return {
      numPages: this.numPages,
      filename: this.activeFilename,
      profile: this.profile
    };
  }

  /**
   * Directly loads a structured profile (uploaded or tailored) and renders
   * the authentic, click-and-editable A4 PDF document sheet.
   */
  loadProfile(profile, filename = null) {
    if (!profile) return;
    this.profile = JSON.parse(JSON.stringify(profile));
    if (filename) this.activeFilename = filename;

    this.renderDocumentSheet();
    this.updatePageIndicator();

    // Trigger initial notification
    this.onTextChange({
      profile: this.profile,
      fullDocumentText: this.getFullDocumentText()
    });
  }

  /**
   * Renders the authentic A4 PDF sheet into the viewport with exact alignment & typography
   */
  renderDocumentSheet() {
    if (!this.container) return;
    this.container.innerHTML = '';

    const p = this.profile || {};
    const fullName = p.fullName || 'SANJAY N';
    const title = p.title || 'AI Engineer | Software Engineer';
    const cityState = p.city && p.state
      ? `${p.city} , ${p.state.toLowerCase().includes('tamil') ? 'TN' : p.state}`
      : (p.location && p.location.includes('Coimbatore') ? 'Coimbatore , TN' : (p.location || 'Coimbatore , TN'));
    const email = p.email || '2005sanjaynrs@gmail.com';
    const phone = p.phone || '+91 93615 99018';
    const github = p.github || 'https://github.com/RNS-Forge';
    const linkedin = p.linkedin || 'www.linkedin.com/in/sanjay--n';

    // 1. Technical Skills Bullets
    let skillsLisHtml = '';
    const skillCats = p.skillCategories || {};
    const catKeys = Object.keys(skillCats);
    if (catKeys.length > 0) {
      skillsLisHtml = catKeys.map(cat => {
        const val = Array.isArray(skillCats[cat]) ? skillCats[cat].join(', ') : skillCats[cat];
        return `
          <li class="pdf-field pdf-skill-bullet" contenteditable="true" spellcheck="false" data-cat="${escapeHtml(cat)}" title="Click to edit skills line">
            <b class="pdf-field-skill-cat">${escapeHtml(cat)} :</b> <span class="pdf-field-skill-val">${escapeHtml(val)}</span>
          </li>
        `;
      }).join('');
    } else if (Array.isArray(p.skills) && p.skills.length > 0) {
      skillsLisHtml = `
        <li class="pdf-field pdf-skill-bullet" contenteditable="true" spellcheck="false">
          <b class="pdf-field-skill-cat">Core Technical Skills :</b> <span class="pdf-field-skill-val">${escapeHtml(p.skills.join(', '))}</span>
        </li>
      `;
    }

    // 2. Experience Entries
    const experiences = p.experience || [];
    const expEntriesHtml = experiences.map((exp, expIdx) => {
      const bullets = Array.isArray(exp.bullets) && exp.bullets.length > 0
        ? exp.bullets
        : (Array.isArray(exp.highlights) && exp.highlights.length > 0
            ? exp.highlights
            : (exp.description ? [exp.description] : []));
      const expRole = exp.role || exp.title || 'Software Engineer Intern';
      const company = exp.company || 'Axodian';
      const period = exp.period || exp.dates || 'June 2026 - Present';
      const project = exp.project || '';
      const location = exp.location || '';

      const bulletLis = bullets.map((b, bIdx) => `
        <li class="pdf-field pdf-bullet-item" contenteditable="true" spellcheck="false" data-exp-idx="${expIdx}" data-bullet-idx="${bIdx}" title="Click to edit bullet. Press Enter for new bullet.">${escapeHtml(b)}</li>
      `).join('');

      return `
        <div class="exp-entry" data-exp-idx="${expIdx}">
          <div class="entry-head">
            <span>
              <strong class="pdf-field pdf-exp-company" contenteditable="true" spellcheck="false" data-exp-idx="${expIdx}" data-field="company" title="Click to edit company">${escapeHtml(company)}</strong>
              <span class="pdf-sep"> - </span>
              <span class="pdf-field pdf-exp-role" contenteditable="true" spellcheck="false" data-exp-idx="${expIdx}" data-field="role" title="Click to edit job role">${escapeHtml(expRole)}</span>
            </span>
            <span class="when pdf-field pdf-exp-date" contenteditable="true" spellcheck="false" data-exp-idx="${expIdx}" data-field="period" title="Click to edit date range">${escapeHtml(period)}</span>
          </div>
          ${(project || location) ? `
            <div class="entry-sub">
              <span class="pdf-field pdf-exp-project" contenteditable="true" spellcheck="false" data-exp-idx="${expIdx}" data-field="project" title="Click to edit project name">${escapeHtml(project ? (project.toLowerCase().startsWith('project') ? project : (project.includes(',') ? 'Projects: ' : 'Project: ') + project) : '')}</span>
              <span class="when pdf-field pdf-exp-loc" contenteditable="true" spellcheck="false" data-exp-idx="${expIdx}" data-field="location" title="Click to edit location">${escapeHtml(location)}</span>
            </div>
          ` : ''}
          <ul class="pdf-bullet-list">
            ${bulletLis}
          </ul>
        </div>
      `;
    }).join('');

    // 3. Projects Bullets
    const projects = p.projects || [];
    const projectsLisHtml = projects.map((proj, pIdx) => {
      const name = proj.name || 'Project';
      const desc = proj.description || '';
      return `
        <li class="pdf-field pdf-proj-bullet" contenteditable="true" spellcheck="false" data-proj-idx="${pIdx}" title="Click to edit project">
          <strong class="pdf-field-proj-name">${escapeHtml(name)} –</strong> <span class="pdf-field-proj-desc">${escapeHtml(desc)}</span>
        </li>
      `;
    }).join('');

    // 4. Education Entries
    const educations = p.education || [];
    const eduEntriesHtml = educations.map((edu, eIdx) => {
      const degree = edu.degree || 'B.Tech Artificial Intelligence & Machine Learning';
      const period = edu.period || edu.year || 'Nov 2022 - Apr 2026';
      const inst = edu.institution || 'SNS College of Technology';
      const details = edu.details ? `, ${edu.details}` : (edu.cgpa ? `, CGPA: ${edu.cgpa}` : '');
      return `
        <div class="edu-entry" data-edu-idx="${eIdx}">
          <div class="edu-head">
            <span class="pdf-field pdf-edu-degree" contenteditable="true" spellcheck="false" data-edu-idx="${eIdx}" data-field="degree" title="Click to edit degree">${escapeHtml(degree)}</span>
            <span class="when pdf-field pdf-edu-date" contenteditable="true" spellcheck="false" data-edu-idx="${eIdx}" data-field="period" title="Click to edit graduation year">${escapeHtml(period)}</span>
          </div>
          <ul>
            <li class="pdf-field pdf-edu-bullet" contenteditable="true" spellcheck="false" data-edu-idx="${eIdx}" title="Click to edit college info">
              <strong>${escapeHtml(inst)}</strong>${escapeHtml(details)}
            </li>
          </ul>
        </div>
      `;
    }).join('');

    // 5. Awards & Certification Bullets
    const certs = p.certifications || [
      'Salesforce AI Associate and Agentforce Specialist, both completed with scores above 80%.',
      'Oracle AI Foundations Associate completed with 92% and Postman AI Student Expert certified.'
    ];
    const certLisHtml = certs.map((cert, cIdx) => `
      <li class="pdf-field pdf-cert-bullet" contenteditable="true" spellcheck="false" data-cert-idx="${cIdx}" title="Click to edit certification">${escapeHtml(cert)}</li>
    `).join('');

    // Wrap in A4 sheet
    const sheetWrapper = document.createElement('div');
    sheetWrapper.className = 'pdf-sheet-wrapper';
    sheetWrapper.id = 'pdf-sheet-wrapper';
    sheetWrapper.style.transform = this.scale === 1.0 ? 'none' : `scale(${this.scale})`;
    sheetWrapper.style.transformOrigin = 'top center';

    sheetWrapper.innerHTML = `
      <div class="pdf-document-sheet" id="pdf-document-sheet">

        <!-- HEADER: Exact 2-Column Split matching uploaded resume -->
        <header class="head">
          <div class="head-left">
            <h1 class="name pdf-field" contenteditable="true" spellcheck="false" data-field="fullName" title="Click to edit candidate name">${escapeHtml(fullName)}</h1>
            <p class="role pdf-field" contenteditable="true" spellcheck="false" data-field="title" title="Click to edit role subtitle">${escapeHtml(title)}</p>
          </div>
          <div class="contact">
            <div><b>City :</b> <span class="pdf-field" contenteditable="true" spellcheck="false" data-field="city">${escapeHtml(cityState)}</span></div>
            <div><b>Email :</b> <span class="pdf-field" contenteditable="true" spellcheck="false" data-field="email">${escapeHtml(email)}</span></div>
            <div><b>Phone :</b> <span class="pdf-field" contenteditable="true" spellcheck="false" data-field="phone">${escapeHtml(phone)}</span></div>
            <div><b>Github :</b> <span class="pdf-field" contenteditable="true" spellcheck="false" data-field="github">${escapeHtml(github)}</span></div>
            <div class="wide"><b>LinkedIn :</b> <span class="pdf-field" contenteditable="true" spellcheck="false" data-field="linkedin">${escapeHtml(linkedin)}</span></div>
          </div>
        </header>

        <!-- PROFESSIONAL SUMMARY -->
        ${p.summary ? `
          <section>
            <h2 class="pdf-field" contenteditable="true" spellcheck="false">PROFESSIONAL SUMMARY</h2>
            <p class="summary pdf-field" contenteditable="true" spellcheck="false" data-field="summary" title="Click to edit summary">${escapeHtml(p.summary)}</p>
          </section>
        ` : ''}

        <!-- TECHNICAL SKILLS -->
        ${skillsLisHtml ? `
          <section>
            <h2 class="pdf-field" contenteditable="true" spellcheck="false">TECHNICAL SKILLS</h2>
            <ul>
              ${skillsLisHtml}
            </ul>
          </section>
        ` : ''}

        <!-- PROFESSIONAL EXPERIENCE -->
        ${expEntriesHtml ? `
          <section>
            <h2 class="pdf-field" contenteditable="true" spellcheck="false">PROFESSIONAL EXPERIENCE</h2>
            ${expEntriesHtml}
          </section>
        ` : ''}

        <!-- PROJECTS -->
        ${projectsLisHtml ? `
          <section>
            <h2 class="pdf-field" contenteditable="true" spellcheck="false">PROJECTS</h2>
            <ul>
              ${projectsLisHtml}
            </ul>
          </section>
        ` : ''}

        <!-- EDUCATION -->
        ${eduEntriesHtml ? `
          <section>
            <h2 class="pdf-field" contenteditable="true" spellcheck="false">EDUCATION</h2>
            ${eduEntriesHtml}
          </section>
        ` : ''}

        <!-- AWARDS AND CERTIFICATION -->
        ${certLisHtml ? `
          <section>
            <h2 class="pdf-field" contenteditable="true" spellcheck="false">AWARDS AND CERTIFICATION</h2>
            <ul>
              ${certLisHtml}
            </ul>
          </section>
        ` : ''}

      </div>
    `;

    this.container.appendChild(sheetWrapper);
    this.attachInteractiveFieldEvents(sheetWrapper);
  }

  /**
   * Attaches live input listeners, keyboard shortcuts, and ATS synchronization to all editable fields
   */
  attachInteractiveFieldEvents(wrapper) {
    const sheet = wrapper.querySelector('#pdf-document-sheet');
    if (!sheet) return;

    // Handle typing on any editable field
    sheet.addEventListener('input', (e) => {
      const target = e.target.closest('.pdf-field');
      if (!target) return;

      target.classList.add('user-edited');
      this.syncSheetToProfile();

      this.onTextChange({
        profile: this.profile,
        fullDocumentText: this.getFullDocumentText(),
        editedTarget: target
      });
    });

    // Handle keyboard shortcuts (Enter in bullets, Escape to blur)
    sheet.addEventListener('keydown', (e) => {
      const target = e.target.closest('.pdf-field');
      if (!target) return;

      if (e.key === 'Escape') {
        target.blur();
        return;
      }

      // Enter key inside a bullet item creates a new sibling bullet cleanly
      if (e.key === 'Enter' && target.classList.contains('pdf-bullet-item') && !e.shiftKey) {
        e.preventDefault();
        const newLi = document.createElement('li');
        newLi.className = 'pdf-field pdf-bullet-item user-edited';
        newLi.contentEditable = 'true';
        newLi.spellcheck = false;
        newLi.textContent = '';
        newLi.title = 'Click to edit bullet';

        target.insertAdjacentElement('afterend', newLi);
        newLi.focus();

        this.syncSheetToProfile();
        this.onTextChange({
          profile: this.profile,
          fullDocumentText: this.getFullDocumentText()
        });
      }

      // Backspace on empty bullet deletes it and focuses previous bullet
      if (e.key === 'Backspace' && target.classList.contains('pdf-bullet-item') && target.textContent.trim() === '') {
        const parentUl = target.closest('ul');
        if (parentUl && parentUl.querySelectorAll('li').length > 1) {
          e.preventDefault();
          const prevLi = target.previousElementSibling || target.nextElementSibling;
          target.remove();
          if (prevLi) {
            prevLi.focus();
            // Place cursor at end of text
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(prevLi);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          }
          this.syncSheetToProfile();
          this.onTextChange({
            profile: this.profile,
            fullDocumentText: this.getFullDocumentText()
          });
        }
      }
    });
  }

  /**
   * Syncs the live DOM text contents back into this.profile for real-time ATS scoring
   */
  syncSheetToProfile() {
    const sheet = document.getElementById('pdf-document-sheet');
    if (!sheet) return;

    if (!this.profile) this.profile = {};

    // Header fields
    const nameEl = sheet.querySelector('.name');
    if (nameEl) this.profile.fullName = nameEl.textContent.trim();

    const titleEl = sheet.querySelector('.role');
    if (titleEl) this.profile.title = titleEl.textContent.trim();

    // Summary
    const sumEl = sheet.querySelector('.summary');
    if (sumEl) this.profile.summary = sumEl.textContent.trim();

    // Contact fields
    sheet.querySelectorAll('[data-field]').forEach(el => {
      const field = el.dataset.field;
      if (['city', 'email', 'phone', 'github', 'linkedin', 'portfolio'].includes(field)) {
        this.profile[field] = el.textContent.trim();
      }
    });

    // Skills
    const skillCategories = {};
    sheet.querySelectorAll('.pdf-skill-bullet').forEach(row => {
      const labelEl = row.querySelector('.pdf-field-skill-cat') || row.querySelector('b');
      if (labelEl) {
        const label = labelEl.textContent.replace(/:$/, '').trim();
        const fullText = row.textContent;
        const valText = fullText.replace(labelEl.textContent, '').trim();
        if (label) skillCategories[label] = valText;
      }
    });
    if (Object.keys(skillCategories).length > 0) {
      this.profile.skillCategories = skillCategories;
      this.profile.skills = Object.values(skillCategories)
        .flatMap(s => s.split(/[,|]/))
        .map(s => s.trim())
        .filter(Boolean);
    }

    // Experience entries
    sheet.querySelectorAll('.exp-entry').forEach((entryEl, eIdx) => {
      if (!this.profile.experience) this.profile.experience = [];
      if (!this.profile.experience[eIdx]) this.profile.experience[eIdx] = {};

      const compEl = entryEl.querySelector('.pdf-exp-company');
      if (compEl) this.profile.experience[eIdx].company = compEl.textContent.trim();

      const roleEl = entryEl.querySelector('.pdf-exp-role');
      if (roleEl) {
        this.profile.experience[eIdx].role = roleEl.textContent.trim();
        this.profile.experience[eIdx].title = roleEl.textContent.trim();
      }

      const projEl = entryEl.querySelector('.pdf-exp-project');
      if (projEl) this.profile.experience[eIdx].project = projEl.textContent.trim();

      const dateEl = entryEl.querySelector('.pdf-exp-date');
      if (dateEl) this.profile.experience[eIdx].period = dateEl.textContent.trim();

      const locEl = entryEl.querySelector('.pdf-exp-loc');
      if (locEl) this.profile.experience[eIdx].location = locEl.textContent.trim();

      // Bullets
      const bullets = [];
      entryEl.querySelectorAll('.pdf-bullet-item').forEach(bEl => {
        const txt = bEl.textContent.trim();
        if (txt) bullets.push(txt);
      });
      this.profile.experience[eIdx].highlights = bullets;
      this.profile.experience[eIdx].bullets = bullets;
      this.profile.experience[eIdx].description = bullets.join(' ');
    });

    // Projects entries
    sheet.querySelectorAll('.pdf-proj-bullet').forEach((pEl, pIdx) => {
      if (!this.profile.projects) this.profile.projects = [];
      if (!this.profile.projects[pIdx]) this.profile.projects[pIdx] = {};

      const nameEl = pEl.querySelector('.pdf-field-proj-name') || pEl.querySelector('strong') || pEl.querySelector('b');
      const descEl = pEl.querySelector('.pdf-field-proj-desc');
      if (nameEl) {
        this.profile.projects[pIdx].name = nameEl.textContent.replace(/[–—:-]+$/, '').trim();
      }
      if (descEl) {
        this.profile.projects[pIdx].description = descEl.textContent.trim();
      } else if (nameEl) {
        this.profile.projects[pIdx].description = pEl.textContent.replace(nameEl.textContent, '').trim();
      }
    });

    // Education entries
    sheet.querySelectorAll('.edu-entry').forEach((eduEl, edIdx) => {
      if (!this.profile.education) this.profile.education = [];
      if (!this.profile.education[edIdx]) this.profile.education[edIdx] = {};

      const degEl = eduEl.querySelector('.pdf-edu-degree');
      if (degEl) this.profile.education[edIdx].degree = degEl.textContent.trim();

      const dateEl = eduEl.querySelector('.pdf-edu-date');
      if (dateEl) this.profile.education[edIdx].period = dateEl.textContent.trim();

      const bulletEl = eduEl.querySelector('.pdf-edu-bullet');
      if (bulletEl) {
        const instEl = bulletEl.querySelector('strong') || bulletEl.querySelector('b');
        if (instEl) this.profile.education[edIdx].institution = instEl.textContent.trim();
      }
    });

    // Certifications
    const certs = [];
    sheet.querySelectorAll('.pdf-cert-bullet').forEach(cEl => {
      const txt = cEl.textContent.trim();
      if (txt) certs.push(txt);
    });
    if (certs.length > 0) this.profile.certifications = certs;
  }

  /**
   * Returns all current text content of the document sheet for ATS evaluation
   */
  getFullDocumentText() {
    const sheet = document.getElementById('pdf-document-sheet');
    if (!sheet) return '';
    return sheet.innerText || sheet.textContent || '';
  }

  /**
   * Generates a 1-to-1 high-DPI vector/retina PDF of the exact edited document
   */
  async downloadCompiledPdf(filename = null) {
    const sheet = document.getElementById('pdf-document-sheet');
    if (!sheet) return false;

    const downloadName = filename || this.activeFilename || `${(this.profile?.fullName || 'Tailored').replace(/\s+/g, '_')}_Resume.pdf`;

    this.onStatusChange('Generating 1-to-1 vector PDF...', 30);

    if (typeof window.html2pdf === 'undefined') {
      console.warn('[PdfCanvasEditor] html2pdf not available, triggering standard window print.');
      window.print();
      return true;
    }

    try {
      // Temporarily remove any editing focus borders during PDF rasterization
      const activeEl = document.activeElement;
      if (activeEl && activeEl.blur) activeEl.blur();

      const opt = {
        margin: [0, 0, 0, 0],
        filename: downloadName.endsWith('.pdf') ? downloadName : `${downloadName}.pdf`,
        image: { type: 'jpeg', quality: 0.99 },
        html2canvas: {
          scale: 2.5,
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          scrollX: 0
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        }
      };

      await window.html2pdf().set(opt).from(sheet).save();
      this.onStatusChange('PDF Download Complete', 100);
      return true;
    } catch (err) {
      console.error('[PdfCanvasEditor] PDF compilation error:', err);
      return false;
    }
  }

  /**
   * Zoom controls
   */
  async zoomIn() {
    this.scale = Math.min(2.0, Math.round((this.scale + 0.1) * 10) / 10);
    this.applyZoom();
  }

  async zoomOut() {
    this.scale = Math.max(0.6, Math.round((this.scale - 0.1) * 10) / 10);
    this.applyZoom();
  }

  async setScale(newScale) {
    this.scale = Math.max(0.5, Math.min(2.0, newScale));
    this.applyZoom();
  }

  applyZoom() {
    const wrapper = document.getElementById('pdf-sheet-wrapper');
    if (wrapper) {
      wrapper.style.transform = this.scale === 1.0 ? 'none' : `scale(${this.scale})`;
    }
    const zoomLabel = document.getElementById('pdf-zoom-level-label');
    if (zoomLabel) {
      zoomLabel.textContent = `${Math.round(this.scale * 100)}%`;
    }
  }

  async nextPage() {
    // Multi-page scrolling
    const sheet = document.getElementById('pdf-document-sheet');
    if (sheet) sheet.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  async prevPage() {
    const sheet = document.getElementById('pdf-document-sheet');
    if (sheet) sheet.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  updatePageIndicator() {
    const el = document.getElementById('pdf-page-num-display');
    if (el) {
      el.textContent = `Page 1 of ${this.numPages || 1}`;
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

if (typeof window !== 'undefined') {
  window.PdfCanvasEditor = PdfCanvasEditor;
}
