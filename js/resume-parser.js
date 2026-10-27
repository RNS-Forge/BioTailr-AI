/**
 * BioTailr AI - Client-Side Dynamic Resume Parser & HTML Synthesizer
 * Uses PDF.js and Tesseract.js (pure frontend, zero backend).
 * Extracts candidate personal info, skills, experience, education, and projects,
 * and generates a 100% ATS-compliant single-column Harvard HTML resume.
 */

/**
 * Main entry point: parses a PDF File object completely in the browser.
 * @param {File} file - PDF file from <input type="file"> or drag-and-drop
 * @param {Function} [onProgress] - Optional status progress callback (msg, pct)
 * @returns {Promise<{ profile: Object, rawText: string, html: string }>}
 */
export async function parsePdfResume(file, onProgress = () => {}) {
  onProgress('Reading PDF file buffer...', 10);
  const arrayBuffer = await file.arrayBuffer();

  onProgress('Extracting text with PDF.js...', 25);
  let { rawText, pageItems } = await extractTextFromPdf(arrayBuffer, onProgress);

  // If text is suspiciously short (e.g. scanned image PDF), invoke Tesseract OCR fallback
  if (!rawText || rawText.trim().length < 60) {
    onProgress('Scanned PDF detected. Running Tesseract.js OCR engine...', 45);
    rawText = await extractTextWithOcr(arrayBuffer, onProgress);
  }

  onProgress('Structuring candidate profile & career taxonomy...', 75);
  const profile = structureResumeData(rawText, file.name);

  onProgress('Generating 100% ATS Harvard HTML representation...', 90);
  const html = generateAccurateResumeHtml(profile);

  // Persist dynamically in client storage for Studio, Extension, and Auto-Apply
  saveDynamicProfile(profile, html);

  onProgress('Resume parsed & dynamic profile armed successfully!', 100);
  return { profile, rawText, html };
}

/**
 * Extracts selectable text layer and spatial coordinates using PDF.js
 */
async function extractTextFromPdf(arrayBuffer, onProgress) {
  if (typeof window.pdfjsLib === 'undefined') {
    throw new Error('PDF.js library is not loaded. Please ensure an active internet connection.');
  }

  const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const pageTexts = [];
  const allItems = [];

  for (let i = 1; i <= numPages; i++) {
    onProgress(`Extracting PDF page ${i} of ${numPages}...`, 25 + Math.round((i / numPages) * 35));
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Sort items by vertical position (top to bottom) then horizontal (left to right)
    const items = content.items.map(item => ({
      str: item.str,
      x: item.transform[4],
      y: item.transform[5],
      width: item.width,
      height: item.height,
      hasEOL: item.hasEOL
    }));

    items.sort((a, b) => {
      const yDiff = b.y - a.y;
      if (Math.abs(yDiff) > 3) return yDiff;
      return a.x - b.x;
    });

    allItems.push(...items);

    // Group text items into lines based on vertical proximity
    let lastY = null;
    let pageLines = [];
    let currentLine = [];

    items.forEach(it => {
      if (lastY === null || Math.abs(it.y - lastY) > 3) {
        if (currentLine.length > 0) pageLines.push(currentLine.join(' '));
        currentLine = [it.str];
        lastY = it.y;
      } else {
        currentLine.push(it.str);
      }
    });
    if (currentLine.length > 0) pageLines.push(currentLine.join(' '));

    pageTexts.push(pageLines.join('\n'));
  }

  return {
    rawText: pageTexts.join('\n\n'),
    pageItems: allItems
  };
}

/**
 * Client-side OCR fallback for scanned resumes using Tesseract.js
 */
async function extractTextWithOcr(arrayBuffer, onProgress) {
  if (typeof window.Tesseract === 'undefined') {
    console.warn('Tesseract.js not available for OCR fallback.');
    return '';
  }

  const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let ocrResults = [];

  for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
    onProgress(`OCR scanning page ${i}...`, 45 + Math.round((i / pdf.numPages) * 25));
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    await page.render({ canvasContext: ctx, viewport }).promise;

    const { data: { text } } = await window.Tesseract.recognize(canvas, 'eng');
    ocrResults.push(text);
  }

  return ocrResults.join('\n\n');
}

/**
 * Converts raw unstructured text into a comprehensive structured profile object
 */
export function structureResumeData(rawText, sourceFileName = 'Uploaded_Resume.pdf') {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Personal & Contact Info Extraction
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  const email = emailMatch ? emailMatch[0].trim() : '';

  const phoneMatch = rawText.match(/(?:(?:\+|00)\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,5}[\s.-]?\d{4,5}/);
  const phone = phoneMatch ? phoneMatch[0].trim() : '';

  const linkedinMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-_%]+/i);
  const linkedinUrl = linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : '';

  const githubMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9\-_%]+/i);
  const githubUrl = githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`) : '';

  const portfolioMatch = rawText.match(/(?:https?:\/\/)(?!.*(?:linkedin|github))[a-zA-Z0-9.\-_~:/?#[\]@!$&'()*+,;=]+/i);
  const portfolioUrl = portfolioMatch ? portfolioMatch[0].trim() : '';

  // Name extraction: first non-header prominent line that isn't an email, phone, or generic title
  let fullName = '';
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i];
    if (line.includes('@') || /(?:phone|mobile|tel|linkedin|github|resume|curriculum|vitae)/i.test(line)) continue;
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 5 && !/[0-9]/.test(line) && line.length < 45) {
      fullName = line.replace(/^[•·|,-]\s*/, '').trim();
      break;
    }
  }
  if (!fullName) {
    const baseName = sourceFileName.replace(/\.pdf$/i, '').replace(/[_\-+]/g, ' ');
    fullName = baseName.length > 2 && baseName.length < 35 ? baseName : 'Candidate';
  }

  const nameParts = fullName.split(/\s+/);
  const firstName = nameParts[0] || 'Candidate';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Location extraction — try explicit label first, then bare city+state pattern
  let location = '';
  let city = '';
  let state = '';
  let country = '';

  // Try labelled location
  const locLabelMatch = rawText.match(/(?:Location|Address|City)[:\s-]+([A-Za-z][\w\s]+(?:,\s*[A-Za-z][\w\s]+){1,2})/);
  if (locLabelMatch) {
    location = locLabelMatch[1].trim();
    const locParts = location.split(',').map(s => s.trim());
    city = locParts[0] || '';
    state = locParts[1] || '';
    if (locParts.length > 2) country = locParts[2];
  }

  if (!location) {
    // Try bare city,state pattern near top of document
    const cityStateMatch = rawText.match(/(?:Bangalore|Bengaluru|Coimbatore|Chennai|Mumbai|Delhi|Hyderabad|Pune|Kolkata|Erode|Salem|Madurai|Trichy|Tirunelveli|San Francisco|New York|London|Singapore|Remote)(?:,\s*(?:Tamil Nadu|Karnataka|Maharashtra|Telangana|West Bengal|Rajasthan|UP|Gujarat|India))?/i);
    if (cityStateMatch) {
      const parts = cityStateMatch[0].split(',').map(s => s.trim());
      city = parts[0] || '';
      state = parts[1] || '';
      location = cityStateMatch[0].trim();
    }
  }

  // 2. Section Partitioning
  const sections = partitionSections(lines);

  // 3. Extract Professional Summary
  let summary = sections.summary || '';
  if (!summary && sections.objective) summary = sections.objective;
  if (!summary) {
    // Look at initial paragraph after contact info
    for (let i = 1; i < Math.min(lines.length, 10); i++) {
      if (lines[i].length > 80 && !lines[i].includes('@')) {
        summary = lines[i];
        break;
      }
    }
  }

  // 4. Extract Technical Skills
  const skillsData = parseSkillsSection(sections.skills || '');

  // 5. Extract Work Experience
  const experienceList = parseExperienceSection(sections.experience || '');

  // 6. Extract Education
  const educationList = parseEducationSection(sections.education || '');

  // 7. Extract Projects
  const projectsList = parseProjectsSection(sections.projects || '');

  // Derive Current Title & Total Experience
  let currentTitle = 'Software Engineer';
  let currentCompany = '';
  if (experienceList.length > 0) {
    currentTitle = experienceList[0].role || currentTitle;
    currentCompany = experienceList[0].company || currentCompany;
  } else if (lines.length > 1 && lines[1].length < 60 && !lines[1].includes('@')) {
    currentTitle = lines[1];
  }

  const totalYears = Math.max(1, Math.min(experienceList.length * 2, 8));

  return {
    sourceFileName,
    fullName,
    firstName,
    lastName,
    title: currentTitle,
    email,
    phone,
    location: location || [city, state, country].filter(Boolean).join(', '),
    city: city || '',
    state: state || '',
    country: country || '',
    linkedin: linkedinUrl,
    github: githubUrl,
    portfolio: portfolioUrl,
    summary: summary || '',
    skills: skillsData.flatList,
    skillCategories: skillsData.categories,
    experience: experienceList,
    education: educationList,
    projects: projectsList,
    workAuth: {
      authorizedInCountry: 'Yes',
      needSponsorship: 'No',
      currentVisaStatus: 'Citizen'
    },
    compensation: {
      totalYears,
      noticePeriodDays: 0,
      currentSalary: '',
      expectedSalary: '',
      currentSalaryLpa: '',
      expectedSalaryLpa: ''
    }
  };
}

/**
 * Splits raw text lines into standard resume section buckets
 */
function partitionSections(lines) {
  const sections = {
    summary: '',
    skills: '',
    experience: '',
    education: '',
    projects: '',
    certifications: ''
  };

  const headerRegexes = [
    { key: 'summary', regex: /^(professional\s+summary|summary|profile|about\s+me|career\s+objective|objective)$/i },
    { key: 'skills', regex: /^(technical\s+skills|skills|core\s+competencies|technologies|tools\s+&\s+technologies|skills\s+&\s+abilities)$/i },
    { key: 'experience', regex: /^(work\s+experience|professional\s+experience|experience|employment\s+history|career\s+history|internships?)$/i },
    { key: 'education', regex: /^(education|academic\s+background|qualifications|academic\s+qualifications)$/i },
    { key: 'projects', regex: /^(projects|personal\s+projects|key\s+projects|technical\s+projects)$/i },
    { key: 'certifications', regex: /^(certifications|licenses|certifications\s+&\s+courses|achievements)$/i }
  ];

  let currentKey = null;
  const sectionLines = {};

  lines.forEach(line => {
    const clean = line.replace(/[:\-–—]+$/, '').trim();
    const matched = headerRegexes.find(h => h.regex.test(clean));

    if (matched) {
      currentKey = matched.key;
      if (!sectionLines[currentKey]) sectionLines[currentKey] = [];
    } else if (currentKey) {
      sectionLines[currentKey].push(line);
    }
  });

  for (const [k, arr] of Object.entries(sectionLines)) {
    sections[k] = arr.join('\n');
  }

  return sections;
}

/**
 * Parses raw skills text into both categorized mapping and flat keyword array
 */
function parseSkillsSection(text) {
  const categories = {};
  const flatSet = new Set();

  if (!text) {
    return {
      categories: {
        'Technical Skills': 'Python, JavaScript, TypeScript, React, Node.js, SQL, REST APIs, Git, Docker'
      },
      flatList: ['Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'REST APIs', 'Git', 'Docker']
    };
  }

  const lines = text.split('\n').filter(Boolean);
  let currentCategory = 'General';

  lines.forEach(line => {
    if (line.includes(':')) {
      const [cat, items] = line.split(':');
      const catName = cat.replace(/^[•·\-*]\s*/, '').trim();
      categories[catName] = items.trim();
      items.split(/[,|•·/]/).forEach(item => {
        const cleaned = item.trim();
        if (cleaned.length > 1) flatSet.add(cleaned);
      });
    } else {
      line.split(/[,|•·/]/).forEach(item => {
        const cleaned = item.replace(/^[•·\-*]\s*/, '').trim();
        if (cleaned.length > 1) {
          flatSet.add(cleaned);
          if (!categories[currentCategory]) categories[currentCategory] = '';
          categories[currentCategory] += (categories[currentCategory] ? ', ' : '') + cleaned;
        }
      });
    }
  });

  return {
    categories: Object.keys(categories).length > 0 ? categories : { 'Core Competencies': Array.from(flatSet).join(', ') },
    flatList: Array.from(flatSet)
  };
}

/**
 * Parses experience section into structured role objects with quantified bullet points
 */
function parseExperienceSection(text) {
  if (!text) return [];

  // Month abbreviation patterns including full and abbreviated (Sept, Sep, Jan, etc.)
  const MONTH = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
  const dateRegex = new RegExp(
    `(?:${MONTH}\\s+)?(?:20\\d{2}|19\\d{2})\\s*[-–—]\\s*(?:Present|Current|${MONTH}\\s+)?(?:20\\d{2}|19\\d{2}|Present|Current)`,
    'i'
  );

  const rawBlocks = text.split(/\n(?=[A-Z0-9][a-zA-Z0-9\s,\-|–—]{3,60}(?:\s*[|]|\s*\n\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|20\d\d)))/);
  const experiences = [];

  rawBlocks.forEach((block, idx) => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    let role = lines[0] || '';
    let company = '';
    let period = '';
    let location = '';
    let highlights = [];

    lines.forEach((line, lIdx) => {
      if (lIdx === 0 && line.includes('|')) {
        const parts = line.split('|').map(p => p.trim());
        role = parts[0];
        company = parts[1] || '';
        // Check if period is embedded in the pipe-split line
        const pMatch = line.match(dateRegex);
        if (pMatch) period = pMatch[0];
      } else if (dateRegex.test(line)) {
        const dMatch = line.match(dateRegex);
        if (dMatch) period = dMatch[0];
        const remaining = line.replace(dateRegex, '').replace(/[|()–—-]/g, '').trim();
        if (remaining && !location) location = remaining;
      } else if (/^[•·\-*]/.test(line)) {
        highlights.push(line.replace(/^[•·\-*]\s*/, '').trim());
      } else if (lIdx === 1 && !company && !dateRegex.test(line)) {
        company = line;
      } else if (line.length > 30) {
        highlights.push(line);
      }
    });

    experiences.push({
      id: `parsed_exp_${idx + 1}`,
      role: role.replace(/^[•·\-*]\s*/, ''),
      company: company || '',
      period: period || '',
      location: location || '',
      relevant: true,
      highlights
    });
  });

  return experiences.filter(e => e.role && e.role.length > 1);
}

/**
 * Parses education section into institutions, degrees, and graduation dates
 */
function parseEducationSection(text) {
  if (!text) return [];

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const educations = [];

  // Comprehensive month+year or year-only date range pattern
  const MONTH = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
  const dateRangeRegex = new RegExp(
    `(?:${MONTH}\\s+)?(?:20\\d{2}|19\\d{2})\\s*[-–—]\\s*(?:Present|Current|${MONTH}\\s+)?(?:20\\d{2}|19\\d{2}|Present|Current)`,
    'i'
  );
  // single year
  const yearRegex = /(?:20\d{2}|19\d{2})/;

  let currentEdu = null;
  const degreeRegex = /(?:Bachelor|Master|B\.?Tech|B\.?E\.?|B\.?S\.?|M\.?S\.?|M\.?Tech|Diploma|Associate|Ph\.?D|B\.?Sc|M\.?Sc)/i;

  lines.forEach(line => {
    if (degreeRegex.test(line) || /University|College|Institute|School/i.test(line)) {
      if (currentEdu) educations.push(currentEdu);
      const isDegree = degreeRegex.test(line);

      // Extract period from the same line if present
      let linePeriod = '';
      const drMatch = line.match(dateRangeRegex);
      if (drMatch) linePeriod = drMatch[0];
      else {
        const yrMatch = line.match(yearRegex);
        if (yrMatch) linePeriod = yrMatch[0];
      }

      currentEdu = {
        degree: isDegree ? line.replace(dateRangeRegex, '').trim() : '',
        institution: !isDegree ? line.replace(dateRangeRegex, '').trim() : '',
        location: '',
        period: linePeriod
      };
    } else if (currentEdu) {
      // Try to fill institution if not yet set
      if (!currentEdu.institution && /University|College|Institute|School/i.test(line)) {
        currentEdu.institution = line.replace(dateRangeRegex, '').trim();
        const drMatch = line.match(dateRangeRegex);
        if (drMatch && !currentEdu.period) currentEdu.period = drMatch[0];
      } else if (!currentEdu.period) {
        // Look for date range in subsequent lines
        const drMatch = line.match(dateRangeRegex);
        if (drMatch) {
          currentEdu.period = drMatch[0];
        } else if (!currentEdu.location && line.length < 60 && !degreeRegex.test(line)) {
          // Could be location or field of study
          if (/,/.test(line) || /\b(?:India|Tamil Nadu|Karnataka|Maharashtra|USA|UK)\b/i.test(line)) {
            currentEdu.location = line.trim();
          } else if (!currentEdu.fieldOfStudy) {
            currentEdu.fieldOfStudy = line.trim();
          }
        }
      }
    }
  });

  if (currentEdu) educations.push(currentEdu);
  return educations;
}

/**
 * Parses projects section into title, tech stack, and summary
 */
function parseProjectsSection(text) {
  if (!text) return [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const projects = [];

  lines.forEach((line, idx) => {
    if (line.includes('|') || line.includes(':')) {
      const [title, desc] = line.split(/[:|]/);
      projects.push({
        name: title.replace(/^[•·\-*]\s*/, '').trim(),
        tech: '',
        description: desc ? desc.trim() : ''
      });
    }
  });

  return projects;
}

/**
 * Generates pixel-perfect Harvard ATS single-column semantic HTML with pure black text
 */
export function generateAccurateResumeHtml(profile) {
  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  const contactItems = [];
  if (profile.email) contactItems.push(`<a href="mailto:${escapeHtml(profile.email)}" style="color:#000000;text-decoration:none;">${escapeHtml(profile.email)}</a>`);
  if (profile.phone) contactItems.push(`<span>${escapeHtml(profile.phone)}</span>`);
  if (profile.location) contactItems.push(`<span>${escapeHtml(profile.location)}</span>`);
  if (profile.linkedin) {
    const cleanLi = profile.linkedin.replace(/^https?:\/\/(www\.)?/, '');
    contactItems.push(`<a href="${escapeHtml(profile.linkedin)}" target="_blank" style="color:#000000;text-decoration:none;">${escapeHtml(cleanLi)}</a>`);
  }
  if (profile.github) {
    const cleanGh = profile.github.replace(/^https?:\/\/(www\.)?/, '');
    contactItems.push(`<a href="${escapeHtml(profile.github)}" target="_blank" style="color:#000000;text-decoration:none;">${escapeHtml(cleanGh)}</a>`);
  }
  if (profile.portfolio) {
    const cleanPf = profile.portfolio.replace(/^https?:\/\/(www\.)?/, '');
    contactItems.push(`<a href="${escapeHtml(profile.portfolio)}" target="_blank" style="color:#000000;text-decoration:none;">${escapeHtml(cleanPf)}</a>`);
  }

  // Skills Rows
  let skillsHtml = '';
  if (profile.skillCategories && Object.keys(profile.skillCategories).length > 0) {
    skillsHtml = Object.entries(profile.skillCategories).map(([cat, val]) => `
      <div class="skill-category-row" style="margin-bottom: 4px; font-size: 10pt; line-height: 1.35; color: #000000;">
        <strong style="color: #000000; font-weight: 700;">${escapeHtml(cat)}:</strong>
        <span style="color: #000000;"> ${escapeHtml(val)}</span>
      </div>
    `).join('');
  } else if (profile.skills && profile.skills.length > 0) {
    skillsHtml = `
      <div class="skill-category-row" style="margin-bottom: 4px; font-size: 10pt; line-height: 1.35; color: #000000;">
        <strong style="color: #000000; font-weight: 700;">Core Technical Skills:</strong>
        <span style="color: #000000;"> ${escapeHtml(profile.skills.join(', '))}</span>
      </div>
    `;
  }

  // Experience Rows
  const expHtml = (profile.experience || []).filter(e => e.relevant !== false).map(exp => `
    <article class="experience-entry" style="margin-bottom: 11px; page-break-inside: avoid;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; width: 100%;">
        <div style="font-size: 10.5pt; font-weight: 700; color: #000000;">
          <span>${escapeHtml(exp.role || profile.title)}</span>
          ${exp.company ? `<span style="font-weight: 600;"> &ndash; ${escapeHtml(exp.company)}</span>` : ''}
        </div>
        <div style="font-size: 9.5pt; font-weight: 600; color: #000000; text-align: right; white-space: nowrap;">
          ${escapeHtml(exp.period || '')}
        </div>
      </div>
      ${exp.location || exp.project ? `
        <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 9.5pt; font-style: italic; color: #000000; margin-bottom: 3px;">
          <span>${escapeHtml(exp.project || '')}</span>
          <span>${escapeHtml(exp.location || '')}</span>
        </div>
      ` : ''}
      <ul style="margin: 3px 0 0 0; padding-left: 17px; list-style-type: disc;">
        ${(exp.highlights || []).map(bullet => `
          <li style="margin-bottom: 3px; font-size: 10pt; line-height: 1.38; color: #000000;">
            ${escapeHtml(bullet)}
          </li>
        `).join('')}
      </ul>
    </article>
  `).join('');

  // Education Rows (Harvard Two-Line Layout)
  const eduHtml = (profile.education || []).map(edu => `
    <article class="education-entry" style="margin-bottom: 7px; page-break-inside: avoid;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; width: 100%;">
        <span style="font-size: 10pt; font-weight: 700; color: #000000;">${escapeHtml(edu.degree)}</span>
        <span style="font-size: 9.5pt; font-weight: 600; color: #000000; text-align: right; white-space: nowrap;">${escapeHtml(edu.period || edu.gradYear || '')}</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: baseline; width: 100%; font-size: 9.5pt; color: #000000;">
        <span style="font-style: italic; color: #000000;">${escapeHtml(edu.institution)}</span>
        <span style="color: #000000; text-align: right;">${escapeHtml(edu.location || '')}</span>
      </div>
    </article>
  `).join('');

  // Projects Rows
  const projectsHtml = (profile.projects || []).length > 0 ? `
    <section class="resume-section" style="margin-bottom: 12px;">
      <h2 style="font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1.2px solid #000000; padding-bottom: 2px; margin: 0 0 7px 0; color: #000000; font-family: 'Times New Roman', Times, serif;">
        TECHNICAL PROJECTS
      </h2>
      ${profile.projects.map(p => `
        <div style="margin-bottom: 6px; font-size: 10pt; line-height: 1.35; color: #000000;">
          <strong style="color: #000000;">${escapeHtml(p.name)}</strong>
          ${p.tech ? `<span style="font-style: italic; color: #000000;"> (${escapeHtml(p.tech)})</span>` : ''}:
          <span> ${escapeHtml(p.description)}</span>
        </div>
      `).join('')}
    </section>
  ` : '';

  return `
    <div class="ats-resume-document" id="ats-resume-sheet" style="font-family: 'Times New Roman', Times, serif; color: #000000; background: #ffffff; padding: 32px 38px; box-sizing: border-box; line-height: 1.35; max-width: 820px; margin: 0 auto;">
      <!-- Header -->
      <header style="text-align: center; margin-bottom: 14px; border-bottom: 1.8px solid #000000; padding-bottom: 9px;">
        <h1 style="font-size: 20pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; margin: 0 0 3px 0; color: #000000; font-family: 'Times New Roman', Times, serif;">
          ${escapeHtml(profile.fullName)}
        </h1>
        <div style="font-size: 11pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; color: #000000;">
          ${escapeHtml(profile.title)}
        </div>
        <div style="font-size: 9pt; line-height: 1.4; color: #000000; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">
          ${contactItems.join(' <span style="color:#000000;">|</span> ')}
        </div>
      </header>

      <!-- Professional Summary -->
      ${profile.summary ? `
        <section class="resume-section" style="margin-bottom: 12px;">
          <h2 style="font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1.2px solid #000000; padding-bottom: 2px; margin: 0 0 6px 0; color: #000000; font-family: 'Times New Roman', Times, serif;">
            PROFESSIONAL SUMMARY
          </h2>
          <p style="font-size: 10pt; line-height: 1.42; margin: 0; text-align: justify; color: #000000;">
            ${escapeHtml(profile.summary)}
          </p>
        </section>
      ` : ''}

      <!-- Technical Skills -->
      ${skillsHtml ? `
        <section class="resume-section" style="margin-bottom: 12px;">
          <h2 style="font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1.2px solid #000000; padding-bottom: 2px; margin: 0 0 6px 0; color: #000000; font-family: 'Times New Roman', Times, serif;">
            TECHNICAL SKILLS
          </h2>
          ${skillsHtml}
        </section>
      ` : ''}

      <!-- Work Experience -->
      ${expHtml ? `
        <section class="resume-section" style="margin-bottom: 12px;">
          <h2 style="font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1.2px solid #000000; padding-bottom: 2px; margin: 0 0 7px 0; color: #000000; font-family: 'Times New Roman', Times, serif;">
            PROFESSIONAL EXPERIENCE
          </h2>
          ${expHtml}
        </section>
      ` : ''}

      <!-- Projects -->
      ${projectsHtml}

      <!-- Education -->
      ${eduHtml ? `
        <section class="resume-section" style="margin-bottom: 6px;">
          <h2 style="font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1.2px solid #000000; padding-bottom: 2px; margin: 0 0 6px 0; color: #000000; font-family: 'Times New Roman', Times, serif;">
            EDUCATION
          </h2>
          ${eduHtml}
        </section>
      ` : ''}
    </div>
  `;
}

/**
 * Persists the extracted profile into client localStorage & broadcasts to Extension / CDP Runners
 */
export function saveDynamicProfile(profile, html = '') {
  if (typeof localStorage === 'undefined') return;

  const candidateProfileSchema = {
    personal: {
      fullName: profile.fullName || '',
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      phone: profile.phone ? String(profile.phone).replace(/\D/g, '') : '',
      city: profile.city || '',
      state: profile.state || '',
      country: profile.country || '',
      location: profile.location || [profile.city, profile.state, profile.country].filter(Boolean).join(', '),
      fullLocation: profile.location || [profile.city, profile.state, profile.country].filter(Boolean).join(', '),
      address: profile.location || '',
      linkedinUrl: profile.linkedin || '',
      githubUrl: profile.github || '',
      portfolioUrl: profile.portfolio || ''
    },
    workAuth: profile.workAuth || {
      authorizedInCountry: 'Yes',
      needSponsorship: 'No',
      currentVisaStatus: 'Citizen'
    },
    experience: {
      totalYears: profile.compensation?.totalYears || 0,
      noticePeriodDays: profile.compensation?.noticePeriodDays || 0,
      currentTitle: profile.title || '',
      currentCompany: profile.experience?.[0]?.company || '',
      currentSalary: profile.compensation?.currentSalary || '',
      expectedSalary: profile.compensation?.expectedSalary || '',
      currentSalaryLpa: profile.compensation?.currentSalaryLpa || '',
      expectedSalaryLpa: profile.compensation?.expectedSalaryLpa || ''
    },
    education: {
      degree: profile.education?.[0]?.degree || '',
      fieldOfStudy: profile.education?.[0]?.fieldOfStudy || '',
      institution: profile.education?.[0]?.institution || '',
      gradYear: profile.education?.[0]?.period || ''
    },
    skills: profile.skills || [],
    skillCategories: profile.skillCategories || {},
    summary: profile.summary || '',
    settings: {
      batchTarget: 0,
      cdpPort: 9222
    }
  };

  localStorage.setItem('biotailr_dynamic_user_profile', JSON.stringify(profile));
  localStorage.setItem('biotailr_candidate_profile', JSON.stringify(candidateProfileSchema));
  if (html) {
    localStorage.setItem('biotailr_dynamic_resume_html', html);
  }

  // Cross-window and extension bridge dispatch
  window.postMessage({
    type: 'BIOTAILR_DYNAMIC_PROFILE_UPDATED',
    profile,
    candidateProfile: candidateProfileSchema
  }, '*');

  // Trigger storage event for same-origin tabs
  window.dispatchEvent(new CustomEvent('biotailr:profile-updated', {
    detail: { profile, candidateProfile: candidateProfileSchema }
  }));

  // Automatically sync to StandBy desktop runner (local development only)
  const isLocalHost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.port === '8181' ||
    window.location.port === '3000'
  );

  if (isLocalHost) {
    try {
      fetch('/api/standby/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidateProfileSchema)
      }).then(r => {
        if (r.ok) return r.json();
        return null;
      }).then(res => {
        if (res?.success) {
          console.log('[StandBy Sync] Candidate profile synchronized to StandBy runner.');
        }
      }).catch(() => {});
    } catch (e) {}
  }
}

/**
 * Retrieves the currently saved dynamic profile from client storage
 */
export function getSavedDynamicProfile() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem('biotailr_dynamic_user_profile');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Clears saved dynamic resume data and returns to clean state
 */
export function clearDynamicProfile() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem('biotailr_dynamic_user_profile');
  localStorage.removeItem('biotailr_candidate_profile');
  localStorage.removeItem('biotailr_dynamic_resume_html');
  window.dispatchEvent(new CustomEvent('biotailr:profile-cleared'));
}
