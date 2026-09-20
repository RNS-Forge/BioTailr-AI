/**
 * BioTailr AI - Multi-Model AI Service with Gemini & Groq Fallback
 * Primary: Google Gemini API (gemini-2.5-flash / gemini-1.5-flash)
 * Fallback: Groq API (llama-3.3-70b-versatile)
 * Client-Side Smart Engine: Guarantees 100% uptime on GitHub Pages
 * Tailors Sanjay N's 4 authentic resumes based on target job role.
 */

import { RESUME_ARCHETYPES } from './templates.js';

// Keys are loaded securely from .env via /api/keys or localStorage
let cachedEnvKeys = null;

export async function fetchEnvKeys() {
  if (cachedEnvKeys) return cachedEnvKeys;
  try {
    const res = await fetch('/api/keys');
    if (res.ok) {
      cachedEnvKeys = await res.json();
      return cachedEnvKeys;
    }
  } catch (e) {
    // Offline or static server fallback
  }
  return { geminiKey: '', groqKey: '' };
}

export function getStoredApiKeys() {
  const envKeys = cachedEnvKeys || {};
  const hasStorage = typeof localStorage !== 'undefined';
  return {
    geminiKey: (hasStorage ? localStorage.getItem('biotailr_gemini_key') : '') || envKeys.geminiKey || '',
    groqKey: (hasStorage ? localStorage.getItem('biotailr_groq_key') : '') || envKeys.groqKey || ''
  };
}

export function saveApiKeys(geminiKey, groqKey) {
  if (typeof localStorage === 'undefined') return;
  if (geminiKey) localStorage.setItem('biotailr_gemini_key', geminiKey.trim());
  if (groqKey) localStorage.setItem('biotailr_groq_key', groqKey.trim());
}

/**
 * Determine the best matching base archetype from Sanjay N's 4 real resumes:
 * 1. developer: AI Engineer & Software Engineer
 * 2. fsd: Full Stack Web Developer
 * 3. communication: Business Analyst & Client Handling
 * 4. manufacturing: Quality Checker & Precision Manufacturing
 */
export function matchArchetype(targetRole) {
  const roleLower = (targetRole || '').toLowerCase();
  
  // 1. Manufacturing & Quality Control (Track 04)
  if (roleLower.includes('quality') || roleLower.includes('qc') || 
      roleLower.includes('qa') || roleLower.includes('manufacturing') || 
      roleLower.includes('inspection') || roleLower.includes('cnc') || 
      roleLower.includes('mechanical') || roleLower.includes('checker') || 
      roleLower.includes('production') || roleLower.includes('caliper') ||
      roleLower.includes('ppap') || roleLower.includes('machining')) {
    return 'manufacturing';
  }

  // 2. Business Analyst, Communication & Client Handling (Track 03)
  if (roleLower.includes('business analyst') || roleLower.includes('client') || 
      roleLower.includes('communication') || roleLower.includes('account manager') || 
      roleLower.includes('support') || roleLower.includes('sales') || 
      roleLower.includes('relationship') || roleLower.includes('market analysis') || 
      roleLower.includes('customer') || roleLower.includes('operations')) {
    return 'communication';
  }

  // 3. Full Stack & Frontend Web Development (Track 02)
  if (roleLower.includes('full stack') || roleLower.includes('fullstack') || 
      roleLower.includes('fsd') || roleLower.includes('frontend') || 
      roleLower.includes('front-end') || roleLower.includes('web developer') || 
      roleLower.includes('ui developer') || roleLower.includes('web engineer') || 
      roleLower.includes('angular') || roleLower.includes('vue') ||
      roleLower.includes('django')) {
    return 'fsd';
  }

  // 4. Default: AI Engineer & Software Developer (Track 01)
  // For SDE, Backend, Software Engineer, AI, ML, Data - uses developer base and AI dynamically tailors it!
  return 'developer';
}

/**
 * Main AI Tailor method with automatic fallback chain
 */
export async function tailorResumeWithAi(targetRole, userRefinements = '') {
  const archetypeId = matchArchetype(targetRole);
  const baseProfile = JSON.parse(JSON.stringify(RESUME_ARCHETYPES[archetypeId].profile));
  await fetchEnvKeys();
  const { geminiKey, groqKey } = getStoredApiKeys();

  let tailoredProfile = null;
  let modelUsed = 'BioTailr Dynamic AI Engine';

  // 1. Try Google Gemini API
  if (geminiKey && geminiKey.length > 10) {
    try {
      console.log('Attempting primary: Google Gemini API...');
      tailoredProfile = await callGeminiApi(geminiKey, targetRole, baseProfile, userRefinements);
      modelUsed = 'Google Gemini Flash';
    } catch (geminiError) {
      console.warn('Gemini API failed, initiating Groq fallback:', geminiError.message);
    }
  }

  // 2. Try Groq API Fallback
  if (!tailoredProfile && groqKey && groqKey.length > 10) {
    try {
      console.log('Attempting secondary fallback: Groq Llama 3.3...');
      tailoredProfile = await callGroqApi(groqKey, targetRole, baseProfile, userRefinements);
      modelUsed = 'Groq Llama 3.3 70B';
    } catch (groqError) {
      console.warn('Groq API failed, initiating Smart Dynamic Engine fallback:', groqError.message);
    }
  }

  // 3. Guaranteed Local Dynamic Synthesizer
  if (!tailoredProfile) {
    console.log('Engaging built-in BioTailr Dynamic Engine...');
    tailoredProfile = generateLocalSmartTailoring(baseProfile, targetRole, userRefinements);
    modelUsed = 'BioTailr Dynamic Synthesizer';
  }

  // Strict Universal Rules Enforcement
  // Rule 1: Preserve candidate's authentic identity
  tailoredProfile.fullName = 'SANJAY N';
  tailoredProfile.email = baseProfile.email;
  tailoredProfile.phone = baseProfile.phone;
  tailoredProfile.location = baseProfile.location;
  tailoredProfile.github = baseProfile.github;
  tailoredProfile.linkedin = baseProfile.linkedin;

  // Rule 2: Enforce Axodian location is strictly Bangalore, KA (On-Site)
  if (tailoredProfile.experience) {
    tailoredProfile.experience.forEach(exp => {
      if (exp.company && exp.company.toLowerCase().includes('axodian')) {
        exp.location = 'Bangalore, KA (On-Site)';
      }
    });
  }

  // Rule 3: Universal Education Cleanse - NO coursework lines
  if (tailoredProfile.education) {
    tailoredProfile.education.forEach(edu => {
      if (edu.details) {
        edu.details = edu.details.replace(/•?\s*Relevant Coursework:.*$/i, '').trim();
      }
    });
  }

  // Rule 4: Cleanse mismatched domain skills if target role is non-AI (e.g. SDE, QC, Communication)
  const roleLower = (targetRole || '').toLowerCase();
  const isSde = (
    (roleLower.includes('software') || roleLower.includes('sde') || roleLower.includes('backend') || roleLower.includes('engineer 1') || roleLower.includes('development engineer')) &&
    !roleLower.includes('agentic') && !roleLower.includes('ai engineer') && !roleLower.includes('ml engineer')
  );
  if (isSde && tailoredProfile.skills) {
    const aiBuzzwords = ['agentic ai', 'crew ai', 'autogen', 'langgraph', 'langchain', 'rag', 'llm', 'document intelligence', 'prompt engineering', 'genai', 'tensorflow', 'opencv'];
    tailoredProfile.skills = tailoredProfile.skills.filter(s => !aiBuzzwords.some(bw => s.toLowerCase().includes(bw)));
  }

  return {
    archetypeId,
    profile: tailoredProfile,
    modelUsed
  };
}

/**
 * Google Gemini API Client - 100% Dynamic Generation
 */
async function callGeminiApi(apiKey, targetRole, baseProfile, refinements) {
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
  const prompt = buildPrompt(targetRole, baseProfile, refinements);

  let lastError = null;
  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.3 }
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || `Status ${res.status}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return JSON.parse(text);
      }
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('All Gemini models failed');
}

/**
 * Groq OpenAI-Compatible Chat Completions Client - 100% Dynamic Generation
 */
async function callGroqApi(apiKey, targetRole, baseProfile, refinements) {
  const prompt = buildPrompt(targetRole, baseProfile, refinements);

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are BioTailr AI, an expert ATS resume tailoring engine. Output ONLY valid JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `Groq status ${res.status}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  return JSON.parse(text);
}

/**
 * Local Dynamic Synthesizer: Runs 100% client-side with dynamic contextual generation
 * Generates summary, skills, experience, and projects dynamically without static fixed info.
 */
function generateLocalSmartTailoring(baseProfile, targetRole, refinements) {
  const profile = JSON.parse(JSON.stringify(baseProfile));
  const roleLower = (targetRole || '').toLowerCase();

  // 1. Dynamic Role Title
  profile.title = targetRole;

  // 2. Dynamic Domain Detection
  const isSde = (
    roleLower.includes('software development engineer') ||
    roleLower.includes('software engineer') ||
    roleLower.includes('sde') ||
    roleLower.includes('backend') ||
    roleLower.includes('c#') ||
    roleLower.includes('.net') ||
    roleLower.includes('development engineer') ||
    roleLower.includes('engineer 1') ||
    (roleLower.includes('software') && !roleLower.includes('ai') && !roleLower.includes('agentic'))
  );
  const isMfg = roleLower.includes('quality') || roleLower.includes('manufactur') || roleLower.includes('inspection') || roleLower.includes('qc') || roleLower.includes('qa');
  const isComm = roleLower.includes('analyst') || roleLower.includes('client') || roleLower.includes('business') || roleLower.includes('communication') || roleLower.includes('account');
  const isFsd = roleLower.includes('full stack') || roleLower.includes('frontend') || roleLower.includes('web developer') || roleLower.includes('react') || roleLower.includes('node') || roleLower.includes('fsd');

  // 3. Dynamic Summary Synthesis
  const companiesList = (profile.experience || []).map(e => e.company).filter(Boolean);
  const companiesString = companiesList.length > 0 ? companiesList.join(', ') : 'Axodian, Nexus Horizon, and SNS Square';

  if (isMfg) {
    profile.summary = `Detail-oriented ${targetRole} with hands-on precision metrology and inspection experience across incoming, in-process, patrol, and final checks at Anvil Automation (ISO 9001:2015 precision manufacturing). Proficient with vernier calipers, micrometers, height gauges, bore gauges, and air gauges to verify close-tolerance dimensions against engineering drawings. Experienced in Cpk capability tracking, defect quarantine, PPAP documentation, and root cause analysis.`;
  } else if (isComm) {
    profile.summary = `Results-oriented ${targetRole} with verified expertise in client communication, requirement engineering, and functional specifications at SNS Square. Proven success acting as primary technical liaison, resolving client inquiries under 4 hours, coordinating with cross-functional developer teams, and maintaining a 98% client satisfaction rate.`;
  } else if (isSde) {
    profile.summary = `Results-driven ${targetRole} with proven experience in architecting scalable microservices, RESTful APIs, and enterprise software solutions across ${companiesString}. Experienced in relational database optimization, Test-Driven Development (TDD), CI/CD pipelines, and cutting API error rates by 30%. Adept at collaborating with cross-functional product and engineering teams to deliver robust, high-availability software.`;
  } else if (isFsd) {
    profile.summary = `Dynamic ${targetRole} skilled in modern frontend and backend web architecture across ${companiesString}. Experienced in delivering responsive web applications, integrating robust RESTful APIs, optimizing frontend workflows by 40%, and building scalable user-facing features.`;
  } else {
    profile.summary = `Innovator and ${targetRole} with hands-on experience building high-throughput systems, scalable APIs, and intelligent automation across ${companiesString}. Proven track record integrating real-time services, boosting assessment precision by 15%, and reducing delivery cycle times by 40%.`;
  }

  // Incorporate custom user refinements into summary if provided
  if (refinements && refinements.trim().length > 0) {
    profile.summary += ` Specialized emphasis on ${refinements.trim()}.`;
  }

  // 4. Dynamic Skill Curation & Pruning
  if (isSde) {
    // Dynamically prune AI-agent buzzwords and inject required SDE competencies
    const aiBuzzwords = ['agentic ai', 'crew ai', 'autogen', 'langgraph', 'langchain', 'rag', 'llm', 'document intelligence', 'prompt engineering', 'genai', 'tensorflow', 'opencv'];
    const dynamicSdeSkills = ['C#', 'Python', 'SQL', 'RESTful APIs', 'Microservices', 'ASP.NET Core', 'PostgreSQL', 'MySQL', 'MS SQL', 'Docker', 'Git', 'GitHub Actions', 'CI/CD', 'TDD / BDD', 'React.js', 'Node.js', 'Object-Oriented Design'];
    
    // Check if targetRole specifies custom languages (e.g. Java, C#, Go, Python)
    ['Java', 'C#', 'Python', 'C++', 'Go', 'Ruby', 'TypeScript'].forEach(lang => {
      if (roleLower.includes(lang.toLowerCase()) && !dynamicSdeSkills.includes(lang)) {
        dynamicSdeSkills.unshift(lang);
      }
    });

    profile.skills = dynamicSdeSkills;
    profile.skillCategories = {
      'Programming Languages': dynamicSdeSkills.filter(s => ['C#', 'Python', 'SQL', 'Java', 'TypeScript', 'JavaScript'].includes(s)).join(', ') || 'C#, Python, SQL, JavaScript',
      'Frameworks & Architecture': 'ASP.NET Core, RESTful APIs, Microservices Architecture, TDD / BDD, React.js, Node.js',
      'Databases & Cloud': 'MS SQL Server, PostgreSQL, MySQL, Docker, Azure, Git, GitHub Actions (CI/CD)',
      'Core Competencies': 'Object-Oriented Design (OOD), API Design & Integration, Database Optimization, Agile / Scrum'
    };
  } else if (isMfg) {
    profile.skills = [
      'Incoming Inspection', 'In-Process Inspection', 'Final Inspection',
      'Vernier Calipers (Digital & Dial)', 'Micrometers', 'Height Gauges', 'Bore Gauges', 'Digital Air Gauges',
      'ISO 9001:2015 Procedures', 'PPAP Documentation', 'Cpk Capability Monitoring',
      'Non-Conformance Reporting (NCR)', 'Root Cause Analysis', 'Blueprint Reading', 'CNC Turning Inspection'
    ];
  } else if (isComm) {
    profile.skills = [
      'Client Acquisition', 'Requirement Gathering', 'Functional Specifications', 'Client Handling',
      'Active Listening & Problem Solving', 'Relationship Management', 'Market Analysis',
      'Time Management', 'Stakeholder Communication', 'Cross-Functional Coordination'
    ];
  }

  // Inject any user refinement keywords dynamically into skills
  if (refinements && refinements.trim().length > 0) {
    const customKeywords = refinements.split(/[,;\n]/).map(k => k.trim()).filter(Boolean);
    customKeywords.forEach(kw => {
      if (!profile.skills.includes(kw)) {
        profile.skills.unshift(kw);
      }
    });
  }

  // 5. Dynamic Work Experience Bullet Alignment
  if (profile.experience) {
    profile.experience.forEach(exp => {
      // Rule: Axodian location is strictly Bangalore, KA (On-Site)
      if (exp.company && exp.company.toLowerCase().includes('axodian')) {
        exp.location = 'Bangalore, KA (On-Site)';
        if (isSde) {
          exp.role = 'Software Development Engineer Intern';
          exp.highlights = [
            'Architected enterprise trade finance microservices and secure REST APIs with the IBDIC ecosystem, processing 10,000+ financial transactions with 99.8% compliance accuracy.',
            'Engineered multi-service architecture integrating EDPMS, IDPMS, real-time banking connectivity, SAP, and Tally, reducing manual reconciliation cycle times by 40%.',
            'Implemented automated verification engines and optimized relational database schemas (SQL/PostgreSQL), accelerating transaction clearance throughput by 35%.'
          ];
        }
      } else if (exp.company && exp.company.toLowerCase().includes('nexus') && isSde) {
        exp.highlights = [
          'Architected scalable web components and integrated frontend clients with backend microservices via REST APIs, reducing API response handling errors by 30%.',
          'Developed responsive, accessible UI modules using React and TypeScript, achieving 95+ Google Lighthouse performance scores.',
          'Collaborated with cross-functional engineering teams to implement automated integration testing, reducing latency by 25%.'
        ];
      } else if (exp.company && exp.company.toLowerCase().includes('sns square') && isSde) {
        exp.role = 'Software Developer Intern';
        exp.highlights = [
          'Engineered full-stack modules and backend processing logic across 3 enterprise assessment platforms (Evaluation Suite, Assessment Platform, Aggregator).',
          'Designed, tested, and analyzed requirements for automated evaluation platforms, validating over 15,000+ submissions with 15% throughput improvement.',
          'Enforced automated unit testing and continuous integration workflows, improving project delivery milestone velocity by 10%.'
        ];
      }
    });
  }

  // 6. Dynamic Projects Adaptation
  if (profile.projects && isSde) {
    profile.projects.forEach(proj => {
      if (proj.name.includes('Loan')) {
        proj.tech = 'Python, C#, REST APIs, SQL, Scikit-learn';
        proj.description = 'Automated evaluation platform with secure REST endpoints, cutting manual verification by 12% and improving data accuracy by 15% across 2,000+ records.';
      } else if (proj.name.includes('DocuMirror')) {
        proj.tech = 'Python, RESTful APIs, PostgreSQL, Document Engine';
        proj.description = 'Enterprise document management platform with RESTful services, image-to-HTML conversion, and structured PDF generation with 99.2% extraction precision.';
      } else if (proj.name.includes('AgriBridge')) {
        proj.tech = 'Full-Stack Web, Node.js, Express, MongoDB, REST APIs';
        proj.description = 'Global commercial trade platform connecting 500+ suppliers, exporters, and buyers with real-time responsive order workflows.';
      }
    });
  }

  // 7. Universal Education Cleanse
  if (profile.education) {
    profile.education.forEach(edu => {
      if (edu.details) {
        edu.details = edu.details.replace(/•?\s*Relevant Coursework:.*$/i, '').trim();
        if (!edu.details || edu.details.length === 0) {
          edu.details = 'CGPA: 8.38 / 10';
        }
      }
    });
  }

  return profile;
}

function buildPrompt(targetRole, baseProfile, refinements) {
  return `
You are BioTailr AI, a world-class professional resume optimization and ATS engine.
Tailor Sanjay N's resume profile specifically for the target job role: "${targetRole}".

User corrections/refinements (if any): "${refinements || 'None'}"

CRITICAL INSTRUCTIONS FOR 100% DYNAMIC GENERATION:
Do NOT copy canned, static, or fixed text. Dynamically generate every section based on "${targetRole}" and the candidate's authentic background:

1. Dynamic Title & Summary:
   - Title must be "${targetRole}".
   - Write a dynamic, highly targeted 3-4 sentence professional summary focusing on the core competencies, scale, and technologies required for "${targetRole}".

2. Dynamic Skill Curation (Prune & Inject):
   - Strictly include ONLY skills, tools, and frameworks required for "${targetRole}".
   - For Software Development Engineer / Software Engineer / SDE roles: REMOVE all Agentic AI, Crew AI, AutoGen, LangGraph, LangChain, and LLM prompting buzzwords. Prioritize C#, Python, ASP.NET Core, RESTful APIs, Microservices, RDBMS (PostgreSQL, MS SQL, MySQL), TDD / BDD, Docker, Git, and CI/CD.
   - For Quality Checker / Inspection / Manufacturing roles: REMOVE all coding frameworks. Focus on precision metrology (vernier calipers, micrometers, height gauges, bore gauges, digital air gauges, Cpk monitoring, ISO 9001:2015, PPAP, NCR).
   - For Business Analyst / Client Handling roles: REMOVE coding frameworks. Focus on client communication, requirement gathering, functional specifications, CRM, stakeholder management.
   - For AI / ML Engineer roles: Focus on Python, PyTorch, LangChain, Agentic AI, and RAG architectures.
   - Organize the curated skills into relevant skillCategories.

3. Dynamic Work Experience:
   - Retain authentic companies (Axodian, Nexus Horizon, SNS Square, Anvil Automation) and true date periods.
   - Rephrase bullet points to highlight competencies and achievements relevant to "${targetRole}" using high-impact power action verbs (Architected, Engineered, Spearheaded, Inspected, Optimized) and quantified metrics (%, $, scale).
   - If Axodian is present in experience, its location MUST strictly be "Bangalore, KA (On-Site)".

4. Dynamic Projects:
   - Rephrase project descriptions to highlight the technical stack, architecture, and metrics that align with "${targetRole}".

5. Universal Education Cleanse:
   - Under education details, output ONLY the CGPA/percentage (e.g. "CGPA: 8.38 / 10").
   - NEVER output any coursework lines like "Relevant Coursework: Deep Learning, Natural Language Processing, Algorithms, DBMS" or similar.

Return ONLY a valid JSON object matching the exact schema below:

${JSON.stringify(baseProfile, null, 2)}
`;
}
