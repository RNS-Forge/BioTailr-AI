/**
 * BioTailr AI - Authentic Resumes of Sanjay N
 * 4 Real Archetypes: AI Engineer, Full Stack Developer, Business Analyst, Quality Control Inspector.
 * Standard ATS Single-Column Layout, 100% Semantic HTML, Zero Emojis.
 */

export const RESUME_ARCHETYPES = {
  // 1. AI Engineer & Software Engineer Archetype (from Developer Resume.html)
  developer: {
    id: 'developer',
    name: 'AI Engineer & Software Engineer',
    category: 'AI / Machine Learning / Agentic Systems',
    description: 'Specialized in Agentic AI, LLMs, RAG pipelines, document intelligence, Python, LangChain, PyTorch, and distributed software systems.',
    defaultRole: 'AI Engineer / Software Engineer',
    baseFile: 'Developer Resume.html',
    profile: {
      fullName: 'SANJAY N',
      title: 'AI Engineer | Software Engineer',
      email: '2005sanjaynrs@gmail.com',
      phone: '+91 93615 99018',
      location: 'Coimbatore, Tamil Nadu',
      portfolio: 'https://rns-forge.github.io/RNS_Professional_Profile/',
      github: 'https://github.com/RNS-Forge',
      linkedin: 'www.linkedin.com/in/sanjay--n',
      summary: 'AI Engineer & Software Engineer specializing in Agentic AI, RAG, LLM automation, document intelligence, and scalable enterprise systems.',
      skills: [
        'Python', 'LangChain', 'LangGraph', 'Crew AI', 'AutoGen',
        'TensorFlow', 'PyTorch', 'C#', 'JavaScript', 'TypeScript',
        'Node.js', 'React.js', 'MySQL', 'MongoDB', 'RESTful APIs',
        'Git', 'CI/CD', 'GenAI', 'Agentic AI', 'DBMS'
      ],
      skillCategories: {
        'Programming Languages': 'Python, C#, JavaScript, HTML/CSS, SQL, Java',
        'Frameworks & Libraries': 'LangChain, LangGraph, Crew AI, AutoGen, NumPy, Pandas, OpenCV, Scikit-learn, TensorFlow, PyTorch, Matplotlib, Node.js, React.js, TypeScript',
        'Tools & Technologies': 'MySQL, Git, RESTful APIs, MongoDB, Postman API, JMeter, ZAP, Lighthouse',
        'Additional Skills': 'GenAI, Agentic AI, DBMS, CI/CD'
      },
      experience: [
        {
          id: 'dev_exp_1',
          role: 'Software Engineer Intern',
          company: 'Axodian',
          project: 'OneDoc, OneCompliance',
          companyUrl: 'https://axodian.com/',
          period: 'June 2026 - Present',
          location: 'On-Site',
          relevant: true,
          highlights: [
            'Collaborated with the IBDIC team and government ecosystem to develop enterprise solutions for Import & Export Trade Finance, Documentation, and Compliance.',
            'Developed multi-service architecture integrating EDPMS, IDPMS, real-time banking connectivity, SAP, and Tally for financial and document workflows.',
            'Applied AI-driven document intelligence for document matching, validation, classification, and data extraction, improving automation across import/export and compliance processes.'
          ]
        },
        {
          id: 'dev_exp_2',
          role: 'Front-end Developer Intern',
          company: 'Nexus Horizon',
          project: 'Faculties.ai',
          companyUrl: 'https://nexushorizon.ltd/#about',
          period: 'Sep 2025 - Apr 2026',
          location: 'Remote',
          relevant: true,
          highlights: [
            'Developed scalable and responsive frontend interfaces for AI-driven academic workflows at Faculties.ai.',
            'Built user-friendly web interfaces and integrated frontend components with backend and AI services, reducing API response handling errors by 30%.',
            'Developed responsive applications using modern frontend technologies and integrated REST APIs and AI-powered features.'
          ]
        },
        {
          id: 'dev_exp_3',
          role: 'AI Developer Intern',
          company: 'SNS Square',
          project: 'AI Exam Analyzer, Gen AI Suite, Aggregator',
          companyUrl: 'https://www.snssquare.com/',
          period: 'Aug 2024 - Sep 2025',
          location: 'On-Site',
          relevant: true,
          highlights: [
            'Engineered full-stack modules and implemented AI logic across multiple enterprise assessment platforms.',
            'Developed, tested, and analyzed requirements for automated assessment and document processing platforms.',
            'Increased assessment accuracy by 15% and improved project delivery success rate by 10% through end-to-end testing.'
          ]
        }
      ],
      projects: [
        {
          name: 'Loan Eligibility Checker',
          url: 'https://github.com/RNSsanjay/Loan-Eligible-Domestic.git',
          tech: 'Python, ML, Scikit-learn, REST API',
          description: 'AI-based loan approval system that reduced manual verification by 12% and improved screening accuracy by 15%.'
        },
        {
          name: 'DocuMirror',
          url: 'https://github.com/RNSsanjay/Loan-Eligible-Domestic.git',
          tech: 'LLM, LangChain, Python, PDF Extraction',
          description: 'AI document platform for document Q&A, management, image-to-HTML conversion, and editable PDF generation.'
        },
        {
          name: 'Exam Paper Analyzer',
          url: 'https://github.com/RNSsanjay/Loan-Eligible-Domestic.git',
          tech: 'Computer Vision, OCR, LLM, Python',
          description: 'AI-powered exam evaluation system that reduced evaluation time by 30%.'
        },
        {
          name: 'AgriBridge',
          url: 'https://github.com/RNSsanjay/Loan-Eligible-Domestic.git',
          tech: 'Full-Stack Web, Node.js, Express, MongoDB',
          description: 'Global agri-trade platform connecting farmers, suppliers, exporters, and importers for international business.'
        },
        {
          name: 'Agentium',
          url: 'https://pypi.org/project/agentium/',
          tech: 'Python, Agentic AI, PyPI Package',
          description: 'Open-source Python library for building multi-agent AI systems, reducing agent orchestration development time by 55%.'
        }
      ],
      education: [
        {
          degree: 'B.Tech in Artificial Intelligence & Machine Learning',
          institution: 'SNS College of Technology',
          year: 'Nov 2022 - Apr 2026',
          details: 'CGPA: 8.38 / 10 • Relevant Coursework: Deep Learning, Natural Language Processing, Algorithms, DBMS'
        }
      ],
      certifications: [
        'Salesforce AI Associate and Agentforce Specialist, completed with scores above 80%.',
        'Oracle AI Foundations Associate completed with 92% and Postman AI Student Expert certified.',
        'NPTEL IoT 4.0 Certification, NASSCOM Digital Edge completed with a score of 81%.'
      ]
    }
  },

  // 2. Full Stack Developer Archetype (from FSD Resume.html)
  fsd: {
    id: 'fsd',
    name: 'Full Stack Web Developer',
    category: 'Full Stack / React / Node.js / TypeScript',
    description: 'Specialized in modern responsive UI, React.js, TypeScript, Node.js, Express, Django, databases, and RESTful API integrations.',
    defaultRole: 'Full Stack Web Developer',
    baseFile: 'FSD Resume.html',
    profile: {
      fullName: 'SANJAY N',
      title: 'Full Stack Developer',
      email: '2005sanjaynrs@gmail.com',
      phone: '+91 93615 99018',
      location: 'Coimbatore, Tamil Nadu',
      portfolio: 'https://rns-forge.github.io/RNS_Professional_Profile/',
      github: 'https://github.com/RNS-Forge',
      linkedin: 'www.linkedin.com/in/sanjay--n',
      summary: 'Full Stack Developer skilled in React, Node.js, and Django, building scalable web applications with integrated AI-powered features — from responsive UI to backend architecture.',
      skills: [
        'React.js', 'TypeScript', 'JavaScript (ES6+)', 'HTML5', 'CSS3', 'Tailwind CSS', 'Shadcn/UI',
        'Node.js', 'Express.js', 'Python', 'Django', 'RESTful APIs',
        'MongoDB', 'PostgreSQL', 'MySQL', 'SQL',
        'Responsive Web Design', 'API Integration', 'Performance Optimization', 'Agile Development'
      ],
      skillCategories: {
        'Frontend': 'React.js, TypeScript, JavaScript (ES6+), HTML5, CSS3, Tailwind CSS, Shadcn/UI',
        'Backend': 'Node.js, Express.js, Python, Django, RESTful APIs',
        'Databases': 'MongoDB, PostgreSQL, MySQL, SQL',
        'Additional Skills': 'Responsive Web Design, API Integration, Performance Optimization, Agile Development'
      },
      experience: [
        {
          id: 'fsd_exp_1',
          role: 'Software Engineer Intern (On-Site)',
          company: 'Axodian',
          project: 'OneCompliance, LeDoc',
          companyUrl: 'https://www.axodian.com/',
          period: 'June 2026 - Present',
          location: 'Coimbatore, TN',
          relevant: true,
          highlights: [
            'Developed and integrated responsive frontend features with backend APIs for the OneCompliance enterprise platform.',
            'Built and integrated web application modules for OneDoc document and remittance workflows, prioritizing responsive UI and seamless API integration.',
            'Optimized data exchange pipelines between client-facing interfaces and enterprise services.'
          ]
        },
        {
          id: 'fsd_exp_2',
          role: 'Front-end Developer Intern (Remote)',
          company: 'Nexus Horizon',
          project: 'Faculties.ai',
          companyUrl: 'https://nexushorizon.ltd/#about',
          period: 'Sep 2025 - Apr 2026',
          location: 'Remote',
          relevant: true,
          highlights: [
            'Architected scalable and responsive AI-driven academic workflow interfaces at Faculties.ai.',
            'Built user-friendly interfaces and integrated them with backend and AI services, reducing API response handling errors by 30%.',
            'Developed and integrated feature-driven applications using Python workflows, collaborating closely with UI/UX and backend engineers.'
          ]
        },
        {
          id: 'fsd_exp_3',
          role: 'AI Developer Intern (On-Site)',
          company: 'SNS Square',
          project: 'Exam Analyzer, Gen AI Suite, Aggregator',
          companyUrl: 'https://www.snssquare.com/',
          period: 'Aug 2024 - Sep 2025',
          location: 'Coimbatore, TN',
          relevant: true,
          highlights: [
            'Developed full-stack modules and performed accurate requirement analysis across multiple enterprise platforms.',
            'Built test suites and aligned technical features with client operational specifications.',
            'Increased assessment workflow accuracy by 15% and improved overall project success metrics by 10%.'
          ]
        }
      ],
      projects: [
        {
          name: 'Loan Eligibility Checker',
          url: 'https://github.com/RNSsanjay/Loan-Eligible-Domestic.git',
          tech: 'React, Node.js, Express, Machine Learning',
          description: 'Loan approval web system that reduced manual verification by 12% and improved screening accuracy by 15%.'
        },
        {
          name: 'DocuMirror',
          url: 'https://github.com/RNSsanjay/Loan-Eligible-Domestic.git',
          tech: 'Full-Stack Web, AI Document Q&A, PDF Generation',
          description: 'AI document platform for document Q&A, image-to-HTML conversion, and editable PDF generation.'
        },
        {
          name: 'AgriBridge',
          url: 'https://github.com/RNSsanjay/Loan-Eligible-Domestic.git',
          tech: 'React, Node.js, Express, MongoDB',
          description: 'Global agri-trade platform connecting farmers, exporters, and importers with responsive dashboards.'
        },
        {
          name: 'Exam Paper Analyzer',
          url: 'https://github.com/ProductFactory-01/COE-AI_Exam_Analyzer',
          tech: 'React, Python, Fast API',
          description: 'User-friendly exam evaluation system that reduced evaluation turnaround time by 30%.'
        },
        {
          name: 'Agentium',
          url: 'https://pypi.org/project/agentium/',
          tech: 'Python, Multi-Agent Architecture',
          description: 'Python library for agentic architecture systems, reducing development time by 55%.'
        }
      ],
      education: [
        {
          degree: 'B.Tech in Artificial Intelligence & Machine Learning',
          institution: 'SNS College of Technology',
          year: 'Nov 2022 - Jun 2026',
          details: 'CGPA: 8.38 / 10'
        }
      ],
      certifications: [
        'Salesforce AI Associate and Agentforce Specialist (scores above 80%).',
        'Oracle AI Foundations Associate (92%) and Postman AI Student Expert certified.',
        'NPTEL IoT 4.0 Certification, NASSCOM Digital Edge (81%).'
      ]
    }
  },

  // 3. Business Analyst & Client Handling Archetype (from Communication Resume.html)
  communication: {
    id: 'communication',
    name: 'Business Analyst & Client Handling',
    category: 'Business Analysis / Client Relations / Operations',
    description: 'Specialized in client acquisition, requirement gathering, functional specifications, stakeholder management, and cross-functional coordination.',
    defaultRole: 'Business Analyst & Client Relations Specialist',
    baseFile: 'Communication Resume.html',
    profile: {
      fullName: 'SANJAY N',
      title: 'Business Analyst | Client Handling',
      email: '2005sanjaynrs@gmail.com',
      phone: '+91 93615 99018',
      location: 'Coimbatore, Tamil Nadu',
      portfolio: 'https://rns-forge.github.io/RNS_Professional_Profile/',
      linkedin: 'www.linkedin.com/in/sanjay--n',
      summary: 'Customer-focused and detail-oriented professional with experience in client communication, requirement gathering, and business analysis. Skilled in managing client relationships, understanding business needs, and coordinating with technical teams to deliver effective solutions. Strong ability to handle queries, resolve issues, and ensure customer satisfaction in fast-paced environments.',
      skills: [
        'Client Acquisition', 'Requirement Gathering', 'Functional Specifications', 'Client Handling',
        'Active Listening & Problem Solving', 'Relationship Management', 'Market Analysis',
        'Time Management', 'Stakeholder Communication', 'Cross-Functional Coordination'
      ],
      skillCategories: {
        'Tools & Technologies': 'MS Office (Excel, Word, PowerPoint), Basic CRM Tools, Email & Chat Support Systems, Internet & Data Handling',
        'Key Skills': 'Client Acquisition, Active Listening & Problem Solving, Communication, Client Handling, Time Management, Relationship Management, Market Analysis'
      },
      experience: [
        {
          id: 'comm_exp_1',
          role: 'Business Analyst | Client Handling',
          company: 'SNS Square',
          period: 'Aug 2024 - Sep 2025',
          location: 'Coimbatore, TN',
          relevant: true,
          highlights: [
            'Managed client relationships by acting as the primary point of contact for daily project communication and client support.',
            'Gathered and analyzed client requirements and translated complex business needs into clear functional specifications for engineering squads.',
            'Coordinated with developers and technical teams to ensure 100% accurate implementation of client business objectives.',
            'Handled client inquiries, provided structured status updates, and resolved issues to ensure high customer satisfaction.'
          ]
        }
      ],
      education: [
        {
          degree: 'B.Tech in Artificial Intelligence & Machine Learning',
          institution: 'SNS College of Technology',
          year: 'Nov 2022 - Jun 2026',
          details: 'CGPA: 8.38 / 10'
        },
        {
          degree: 'HSC & SSLC Schooling',
          institution: 'S.R.C Memorial Matric Higher Secondary School',
          year: 'Jun 2020 - May 2022',
          details: 'HSC (Computer Science): 79% • SSLC: 60%'
        }
      ],
      languages: 'English (Fluent) • Tamil (Native)',
      certifications: [
        'Salesforce AI Associate & Agentforce Specialist',
        'Oracle AI Foundations Associate (92%)',
        'NASSCOM Digital Edge Certification (81%)'
      ]
    }
  },

  // 4. Quality Control & Precision Manufacturing Archetype (from Manufacturing.html)
  manufacturing: {
    id: 'manufacturing',
    name: 'Quality Checker & Inspection',
    category: 'Quality Assurance / ISO 9001:2015 / Manufacturing',
    description: 'Specialized in incoming, in-process, and final inspection of CNC-turned components, close-tolerance metrology, Cpk monitoring, and PPAP documentation.',
    defaultRole: 'Quality Inspector / Quality Control Specialist',
    baseFile: 'Manufacturing.html',
    profile: {
      fullName: 'SANJAY N',
      title: 'Quality Checker | Quality Control & Inspection | Steel Bar Components',
      email: '2005sanjaynrs@gmail.com',
      phone: '+91 93615 99018',
      location: 'Coimbatore, Tamil Nadu',
      portfolio: 'https://rns-forge.github.io/RNS_Professional_Profile/',
      linkedin: 'www.linkedin.com/in/sanjay--n',
      summary: 'Detail-oriented Quality Checker with 6 months of hands-on experience in incoming, in-process, patrol and final inspection of CNC-turned steel bar components at Anvil Automation, an ISO 9001:2015 precision manufacturing unit running 3 shifts. Skilled in using vernier calipers, micrometers, height gauges, bore gauges and air gauges to verify close-tolerance dimensions, recording defects, supporting corrective actions and maintaining quality documentation. B.Tech graduate in Artificial Intelligence & Machine Learning (CGPA 8.38). Seeking a Quality Inspector / Quality Control role in a precision manufacturing company.',
      skills: [
        'Incoming & In-Process Inspection', 'Final Outgoing Inspection', 'Vernier Calipers (Digital & Dial)',
        'Micrometers', 'Height Gauges', 'Bore Gauge Sets', 'Digital Air Gauges',
        'ISO 9001:2015 Procedures', 'PPAP Documentation', 'Process Capability (Cpk) Monitoring',
        'Non-Conformance Reporting (NCR)', 'Root Cause Analysis', 'Blueprint / Drawing Reading',
        'CNC Turning Inspection', 'MS Excel & Quality Logs'
      ],
      skillCategories: {
        'Inspection Types': 'Incoming material inspection, in-process inspection, patrol inspection, final outgoing inspection',
        'Instruments': 'Vernier caliper (digital & dial), micrometer, height gauge (digital & dial), bore gauge set, digital air gauge',
        'Quality Tools & Systems': 'ISO 9001:2015, PPAP documentation support, process capability (Cpk) monitoring, non-conformance reporting, root cause analysis, internal audits',
        'Manufacturing Knowledge': 'CNC turning (turning, grooving, threading, boring, facing), steel bar stock, close-tolerance machining, blueprint reading'
      },
      experience: [
        {
          id: 'mfg_exp_1',
          role: 'Quality Checker',
          company: 'Anvil Automation Pvt Ltd',
          companyNote: 'Precision manufacturer of CNC-turned, VMC-machined and die-cast components | ISO 9001:2015 | Coimbatore',
          period: 'Dec 2025 - May 2026',
          location: 'Coimbatore, TN',
          relevant: true,
          highlights: [
            'Checked steel bar stock for size, length, and surface condition against technical specifications prior to release to CNC turning stations.',
            'Verified critical dimensions, grooves, threads, bores, facing, and surface finish on CNC-turned steel bar components across 3 continuous shifts.',
            'Performed rigorous final outgoing quality checks on finished steel bar components, releasing only 100% conforming lots for dispatch.',
            'Operated precision digital and dial vernier calipers, micrometers, height gauges, bore gauges, and digital air gauge units calibrated to NABL standards.',
            'Monitored inspection data and Cpk process capability trends against plant targets (minimum 1.66, target 1.70), flagging drift immediately to production leads.',
            'Identified, tagged, and segregated non-conforming parts, logged defects in NCR registers, and collaborated on corrective action plans.',
            'Maintained comprehensive inspection reports, defect logs, and audit checklists in MS Excel; supported PPAP documentation and ISO 9001:2015 internal audits.'
          ]
        }
      ],
      education: [
        {
          degree: 'B.Tech in Artificial Intelligence & Machine Learning',
          institution: 'SNS College of Technology',
          year: 'Nov 2022 - Jun 2026',
          details: 'CGPA: 8.38 / 10'
        },
        {
          degree: 'HSC & SSLC Schooling',
          institution: 'S.R.C Memorial Matric Higher Secondary School',
          year: 'Jun 2020 - May 2022',
          details: 'HSC (Computer Science): 79% • SSLC: 60%'
        }
      ],
      languages: 'English (Fluent) • Tamil (Native)'
    }
  }
};

/**
 * Render complete, clean, ATS-compliant HTML for Sanjay N's tailored profile
 * Single column, standard semantic hierarchy, zero emojis, exact A4 layout.
 */
export function generateResumeHtml(profile, archetypeId = 'developer') {
  const visibleExperiences = (profile.experience || []).filter(e => e.relevant !== false);
  const hiddenCount = (profile.experience || []).filter(e => e.relevant === false).length;

  return `
  <div class="resume-sheet archetype-${archetypeId}" id="resume-document">
    <!-- ===== HEADER ===== -->
    <header class="head">
      <div>
        <h1 class="name"><a href="https://rns-forge.github.io/RNS_Professional_Profile/" target="_blank">${escapeHtml(profile.fullName || 'SANJAY N')}</a></h1>
        <p class="role">${escapeHtml(profile.title)}</p>
      </div>
      <div class="contact">
        <div><b>City :</b> ${escapeHtml(profile.location || 'Coimbatore , TN')}</div>
        <div><b>Email :</b> <a class="u" href="mailto:${escapeHtml(profile.email || '2005sanjaynrs@gmail.com')}">${escapeHtml(profile.email || '2005sanjaynrs@gmail.com')}</a></div>
        <div><b>Phone :</b> ${escapeHtml(profile.phone || '+91 93615 99018')}</div>
        <div><b>Github :</b> <a class="u" href="${escapeHtml(profile.github || 'https://github.com/RNS-Forge')}" target="_blank">${escapeHtml((profile.github || 'https://github.com/RNS-Forge').replace('https://', ''))}</a></div>
        <div class="wide"><b>LinkedIn :</b> <a class="u" href="https://${escapeHtml(profile.linkedin || 'www.linkedin.com/in/sanjay--n')}" target="_blank">${escapeHtml(profile.linkedin || 'www.linkedin.com/in/sanjay--n')}</a></div>
      </div>
    </header>

    <!-- ===== PROFESSIONAL SUMMARY ===== -->
    <section>
      <h2>${archetypeId === 'communication' ? 'SUMMARY' : 'PROFESSIONAL SUMMARY'}</h2>
      <p class="summary">${escapeHtml(profile.summary)}</p>
    </section>

    <!-- ===== SKILLS / TOOLS ===== -->
    <section>
      <h2>${archetypeId === 'manufacturing' ? 'INSPECTION &amp; QUALITY SKILLS' : (archetypeId === 'communication' ? 'KEY SKILLS &amp; TOOLS' : 'TECHNICAL SKILLS')}</h2>
      ${profile.skillCategories ? `
        <ul class="skills-cat-list">
          ${Object.entries(profile.skillCategories).map(([cat, list]) => `
            <li><b>${escapeHtml(cat)} :</b> ${escapeHtml(list)}</li>
          `).join('')}
        </ul>
      ` : `
        <ul>
          ${(profile.skills || []).map(skill => `<li>${escapeHtml(skill)}</li>`).join('')}
        </ul>
      `}
    </section>

    <!-- ===== PROFESSIONAL EXPERIENCE ===== -->
    <section>
      <h2>${archetypeId === 'communication' ? 'WORK EXPERIENCE' : 'PROFESSIONAL EXPERIENCE'}</h2>

      ${hiddenCount > 0 ? `
        <div class="ats-pruning-notice" data-html2canvas-ignore="true">
          <span><strong>BioTailr AI Pruning Active:</strong> ${hiddenCount} non-matching position(s) automatically suppressed to guarantee 100% role relevance.</span>
        </div>
      ` : ''}

      ${visibleExperiences.map(exp => `
        <div class="exp-entry">
          <div class="entry-head">
            <span>
              ${exp.companyUrl ? `<a class="plain" href="${escapeHtml(exp.companyUrl)}" target="_blank"><b>${escapeHtml(exp.company)}</b></a>` : `<b>${escapeHtml(exp.company)}</b>`}
              - ${escapeHtml(exp.role)}
              ${exp.project ? ` | Project: <em>${escapeHtml(exp.project)}</em>` : ''}
            </span>
            <span class="when">${escapeHtml(exp.period)}</span>
          </div>
          ${exp.companyNote ? `<p class="company-note">${escapeHtml(exp.companyNote)}</p>` : ''}
          <ul>
            ${(exp.highlights || []).map(bullet => `
              <li>${escapeHtml(bullet)}</li>
            `).join('')}
          </ul>
        </div>
      `).join('')}
    </section>

    <!-- ===== PROJECTS ===== -->
    ${profile.projects && profile.projects.length > 0 ? `
    <section>
      <h2>PROJECTS</h2>
      <ul class="projects-list">
        ${profile.projects.map(proj => `
          <li>
            ${proj.url ? `<a class="plain" href="${escapeHtml(proj.url)}" target="_blank"><b>${escapeHtml(proj.name)} –</b></a>` : `<b>${escapeHtml(proj.name)} –</b>`}
            ${escapeHtml(proj.description)}
          </li>
        `).join('')}
      </ul>
    </section>
    ` : ''}

    <!-- ===== EDUCATION ===== -->
    <section>
      <h2>EDUCATION</h2>
      ${(profile.education || []).map(edu => `
        <div class="edu-head">
          <span><b>${escapeHtml(edu.degree || edu.institution)}</b>${edu.degree && edu.institution ? `, ${escapeHtml(edu.institution)}` : ''}</span>
          <span class="when">${escapeHtml(edu.year)}</span>
        </div>
        ${edu.details ? `
          <ul>
            <li>${escapeHtml(edu.details)}</li>
          </ul>
        ` : ''}
      `).join('')}
    </section>

    <!-- ===== AWARDS AND CERTIFICATION ===== -->
    ${profile.certifications && profile.certifications.length > 0 ? `
    <section>
      <h2>AWARDS AND CERTIFICATION</h2>
      <ul>
        ${profile.certifications.map(cert => `
          <li>${escapeHtml(cert)}</li>
        `).join('')}
      </ul>
    </section>
    ` : ''}

    <!-- ===== LANGUAGES ===== -->
    ${profile.languages ? `
    <section>
      <h2>LANGUAGES</h2>
      <p class="summary">${escapeHtml(profile.languages)}</p>
    </section>
    ` : ''}
  </div>
  `;
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
