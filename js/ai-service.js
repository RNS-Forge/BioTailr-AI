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
  return {
    geminiKey: localStorage.getItem('biotailr_gemini_key') || envKeys.geminiKey || '',
    groqKey: localStorage.getItem('biotailr_groq_key') || envKeys.groqKey || ''
  };
}

export function saveApiKeys(geminiKey, groqKey) {
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
  
  // 1. Manufacturing & Quality Control
  if (roleLower.includes('quality') || roleLower.includes('qc') || 
      roleLower.includes('qa') || roleLower.includes('manufacturing') || 
      roleLower.includes('inspection') || roleLower.includes('cnc') || 
      roleLower.includes('mechanical') || roleLower.includes('checker') || 
      roleLower.includes('production') || roleLower.includes('caliper') ||
      roleLower.includes('ppap') || roleLower.includes('machining')) {
    return 'manufacturing';
  }

  // 2. Business Analyst, Communication & Client Handling
  if (roleLower.includes('business analyst') || roleLower.includes('client') || 
      roleLower.includes('communication') || roleLower.includes('account manager') || 
      roleLower.includes('support') || roleLower.includes('sales') || 
      roleLower.includes('relationship') || roleLower.includes('market analysis') || 
      roleLower.includes('customer') || roleLower.includes('operations')) {
    return 'communication';
  }

  // 3. Full Stack & Frontend Web Development
  if (roleLower.includes('full stack') || roleLower.includes('fullstack') || 
      roleLower.includes('fsd') || roleLower.includes('frontend') || 
      roleLower.includes('front-end') || roleLower.includes('web developer') || 
      roleLower.includes('react') || roleLower.includes('node') || 
      roleLower.includes('ui developer') || roleLower.includes('web engineer') || 
      roleLower.includes('angular') || roleLower.includes('vue') ||
      roleLower.includes('django')) {
    return 'fsd';
  }

  // 4. Default: AI Engineer & Software Developer
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
  let modelUsed = 'BioTailr Neural Synthesizer';

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
      console.warn('Groq API failed, initiating Smart Neural Engine fallback:', groqError.message);
    }
  }

  // 3. Guaranteed Local Smart Neural Synthesizer
  if (!tailoredProfile) {
    console.log('Engaging built-in BioTailr Neural Synthesizer...');
    tailoredProfile = generateLocalSmartTailoring(baseProfile, targetRole, userRefinements);
    modelUsed = 'BioTailr Neural Engine';
  }

  // Preserve core facts: Name is always Sanjay N, contact info is preserved
  tailoredProfile.fullName = 'SANJAY N';
  tailoredProfile.email = baseProfile.email;
  tailoredProfile.phone = baseProfile.phone;
  tailoredProfile.location = baseProfile.location;
  tailoredProfile.github = baseProfile.github;
  tailoredProfile.linkedin = baseProfile.linkedin;

  return {
    archetypeId,
    profile: tailoredProfile,
    modelUsed
  };
}

/**
 * Google Gemini API Client
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
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
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
 * Groq OpenAI-Compatible Chat Completions Client
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
      temperature: 0.2
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
 * Local Smart Synthesizer: Runs 100% client-side with zero external API dependency
 */
function generateLocalSmartTailoring(baseProfile, targetRole, refinements) {
  const profile = JSON.parse(JSON.stringify(baseProfile));

  // 1. Update Title to Target Role
  profile.title = targetRole;

  // 2. Synthesize Role-Specific Summary based on Sanjay N's real strengths
  const roleLower = (targetRole || '').toLowerCase();
  if (roleLower.includes('quality') || roleLower.includes('manufactur') || roleLower.includes('inspection') || roleLower.includes('qc') || roleLower.includes('qa')) {
    profile.summary = `Detail-oriented Quality Control & Inspection Specialist with hands-on experience in incoming, in-process, patrol, and final inspection of CNC-turned precision steel bar components at Anvil Automation (ISO 9001:2015 precision unit). Skilled in precision metrology utilizing vernier calipers, micrometers, height gauges, bore gauges, and digital air gauges to verify close-tolerance dimensions. Experienced in Cpk process capability monitoring (1.66+ target), non-conformance containment, PPAP documentation, and internal audits. B.Tech graduate in Artificial Intelligence & Machine Learning (CGPA 8.38/10).`;
  } else if (roleLower.includes('analyst') || roleLower.includes('client') || roleLower.includes('business') || roleLower.includes('communication') || roleLower.includes('account')) {
    profile.summary = `Customer-focused and detail-oriented professional with comprehensive experience in client communication, requirement gathering, and business analysis at SNS Square. Skilled in managing client relationships, understanding business needs, and coordinating with cross-functional technical teams to deliver effective solutions. Strong track record of translating complex client requirements into clear functional specifications, resolving queries, and ensuring high customer satisfaction.`;
  } else if (roleLower.includes('full stack') || roleLower.includes('frontend') || roleLower.includes('web developer') || roleLower.includes('react') || roleLower.includes('node') || roleLower.includes('fsd')) {
    profile.summary = `Full Stack Developer skilled in React.js, Node.js, TypeScript, and Django, building scalable web applications with integrated AI-powered features — from responsive UI to backend architecture. Experienced in delivering enterprise platforms at Axodian and Nexus Horizon, integrating RESTful APIs, optimizing frontend workflows, and reducing API response handling errors by 30%.`;
  } else {
    profile.summary = `AI Engineer & Software Developer specializing in Agentic AI, RAG architectures, LLM automation, document intelligence, and scalable enterprise systems. Experienced in building multi-service platforms across Axodian, Nexus Horizon, and SNS Square, integrating real-time banking APIs and machine learning models to boost assessment accuracy by 15% and reduce development time by 55%.`;
  }

  // 3. If user added custom refinements, incorporate them
  if (refinements && refinements.trim().length > 0) {
    const keywords = refinements.split(/[,;\n]/).map(k => k.trim()).filter(Boolean);
    keywords.forEach(kw => {
      if (!profile.skills.includes(kw)) {
        profile.skills.unshift(kw);
      }
    });
    profile.summary += ` Specialized focus on ${refinements.trim()}.`;
  }

  return profile;
}

function buildPrompt(targetRole, baseProfile, refinements) {
  return `
You are BioTailr AI, a world-class professional resume optimization and ATS engine.
Tailor Sanjay N's resume profile specifically for the target job role: "${targetRole}".

User corrections/refinements (if any): "${refinements || 'None'}"

Strict Guidelines:
1. Rephrase the title and summary to directly match the target role "${targetRole}" while reflecting Sanjay N's background.
2. Prioritize skills and tools relevant to "${targetRole}".
3. Keep real experience companies (Axodian, Nexus Horizon, SNS Square, Anvil Automation) and education (SNS College of Technology) intact.
4. Enhance experience bullet points with strong power action verbs (Spearheaded, Architected, Engineered, Inspected, Optimized) and quantified metrics (%, $, scale).
5. Return ONLY a valid JSON object matching the exact schema below:

${JSON.stringify(baseProfile, null, 2)}
`;
}
