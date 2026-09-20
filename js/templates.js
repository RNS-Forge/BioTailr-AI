/**
 * BioTailr AI - Authentic Resumes of Sanjay N
 * 4 Real Archetypes: AI Engineer, Full Stack Developer, Business Analyst, Quality Control Inspector.
 * Standard ATS Single-Column Layout, 100% Semantic HTML, Pure Black Ink (#000000), Zero Emojis.
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
      summary: 'Results-driven AI Engineer & Software Engineer specializing in Agentic AI, RAG architectures, LLM automation, document intelligence, and scalable enterprise systems. Proven track record across Axodian, Nexus Horizon, and SNS Square in developing high-throughput microservices, real-time banking integrations, and cutting API error rates by 30%.',
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
        'Core Competencies': 'Agentic AI, RAG Pipelines, Document Intelligence, CI/CD, DBMS, Microservices'
      },
      experience: [
        {
          id: 'dev_exp_1',
          role: 'Software Engineer Intern',
          company: 'Axodian',
          project: 'OneDoc, OneCompliance',
          companyUrl: 'https://axodian.com/',
          period: 'June 2026 - Present',
          location: 'Bangalore, KA (On-Site)',
          relevant: true,
          highlights: [
            'Collaborated with the IBDIC team and government ecosystem to engineer enterprise trade finance solutions, processing 10,000+ import/export transactions with 99.8% compliance accuracy.',
            'Architected multi-service architecture integrating EDPMS, IDPMS, real-time banking connectivity, SAP, and Tally, reducing manual document reconciliation cycle times by 40%.',
            'Deployed AI-driven document intelligence for automated validation, classification, and multi-field data extraction, accelerating compliance clearance throughput by 35%.'
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
            'Architected scalable, responsive frontend interfaces for AI-driven academic workflows at Faculties.ai, serving 5,000+ active faculty members and students.',
            'Integrated frontend client components with backend LLM microservices via REST APIs, reducing API response handling errors by 30% and decreasing latency by 25%.',
            'Engineered responsive, accessible UI modules using React and TypeScript, achieving 95+ Google Lighthouse performance scores across all device viewports.'
          ]
        },
        {
          id: 'dev_exp_3',
          role: 'AI Developer Intern',
          company: 'SNS Square',
          project: 'AI Exam Analyzer, Gen AI Suite, Aggregator',
          companyUrl: 'https://www.snssquare.com/',
          period: 'Aug 2024 - Sep 2025',
          location: 'Coimbatore, TN (On-Site)',
          relevant: true,
          highlights: [
            'Engineered full-stack modules and implemented core AI evaluation logic across 3 enterprise assessment platforms (AI Exam Analyzer, Gen AI Suite, Aggregator).',
            'Designed, tested, and analyzed requirements for automated assessment and document processing platforms, evaluating over 15,000+ exam submissions.',
            'Increased assessment scoring accuracy by 15% and improved project delivery milestone velocity by 10% through end-to-end automated testing.'
          ]
        }
      ],
      projects: [
        {
          name: 'Loan Eligibility Checker',
          url: 'https://github.com/RNSsanjay/Loan-Eligible-Domestic.git',
          tech: 'Python, ML, Scikit-learn, REST API',
          description: 'AI-based loan approval system that reduced manual verification by 12% and improved screening accuracy by 15% across 2,000+ applicants.'
        },
        {
          name: 'DocuMirror',
          url: 'https://github.com/RNSsanjay/Loan-Eligible-Domestic.git',
          tech: 'LLM, LangChain, Python, PDF Extraction',
          description: 'AI document platform for document Q&A, management, image-to-HTML conversion, and editable PDF generation with 99.2% extraction precision.'
        },
        {
          name: 'Exam Paper Analyzer',
          url: 'https://github.com/RNSsanjay/Loan-Eligible-Domestic.git',
          tech: 'Computer Vision, OCR, LLM, Python',
          description: 'AI-powered automated grading and evaluation system that reduced educator grading turnaround times by 30%.'
        },
        {
          name: 'AgriBridge',
          url: 'https://github.com/RNSsanjay/Loan-Eligible-Domestic.git',
          tech: 'Full-Stack Web, Node.js, Express, MongoDB',
          description: 'Global agricultural marketplace platform connecting 500+ farmers, suppliers, exporters, and international importers.'
        },
        {
          name: 'Agentium',
          url: 'https://pypi.org/project/agentium/',
          tech: 'Python, Agentic AI, PyPI Package',
          description: 'Published open-source Python library for building multi-agent AI systems, reducing agent orchestration development time by 55%.'
        }
      ],
      education: [
        {
          degree: 'B.Tech in Artificial Intelligence & Machine Learning',
          institution: 'SNS College of Technology',
          year: 'Nov 2022 - Apr 2026',
          location: 'Coimbatore, Tamil Nadu',
          details: 'CGPA: 8.38 / 10'
        }
      ],
      certifications: [
        'Salesforce AI Associate and Agentforce Specialist, completed with scores above 80%.',
        'Oracle AI Foundations Associate completed with 92% and Postman AI Student Expert certified.',
        'NPTEL IoT 4.0 Certification, NASSCOM Digital Edge completed with a score of 81%.'
      ]
    }
  },

  // 1B. Dedicated Software Development Engineer Archetype (Calibrated for SDE / Backend / WEX)
  sde: {
    id: 'sde',
    name: 'Software Development Engineer',
    category: 'Software Engineering / Microservices / C# & Python',
    description: 'Specialized in C#, Python, ASP.NET Core RESTful APIs, Microservices, RDBMS (PostgreSQL, MySQL, MS SQL), React.js, Docker, CI/CD, and TDD.',
    defaultRole: 'Software Development Engineer',
    baseFile: 'Developer Resume.html',
    profile: {
      fullName: 'SANJAY N',
      title: 'Software Development Engineer',
      email: '2005sanjaynrs@gmail.com',
      phone: '+91 93615 99018',
      location: 'Coimbatore, Tamil Nadu',
      portfolio: 'https://rns-forge.github.io/RNS_Professional_Profile/',
      github: 'https://github.com/RNS-Forge',
      linkedin: 'www.linkedin.com/in/sanjay--n',
      summary: 'Results-driven Software Development Engineer with experience in architecting scalable microservices, RESTful APIs, and enterprise web solutions using C#, Python, and modern RDBMS (PostgreSQL, MySQL, MS SQL). Proven track record across Axodian, Nexus Horizon, and SNS Square in engineering multi-service integrations, enforcing Test-Driven Development (TDD), optimizing database queries, and cutting API error rates by 30%. Adept at collaborating with cross-functional product and engineering teams to deliver high-availability, maintainable software systems.',
      skills: [
        'C#', 'Python', 'SQL', 'JavaScript', 'TypeScript', 'ASP.NET Core',
        'RESTful APIs', 'Microservices', 'PostgreSQL', 'MySQL', 'MS SQL',
        'React.js', 'Node.js', 'Docker', 'Git', 'GitHub Actions', 'CI/CD',
        'TDD / BDD', 'Azure', 'Object-Oriented Design'
      ],
      skillCategories: {
        'Programming Languages': 'C#, Python, SQL, JavaScript, TypeScript, HTML/CSS',
        'Frameworks & Architecture': 'ASP.NET Core, RESTful APIs, Microservices Architecture, TDD / BDD, React.js, Node.js',
        'Databases & Cloud': 'MS SQL Server, PostgreSQL, MySQL, Docker, Azure, Git, GitHub Actions (CI/CD)',
        'Core Competencies': 'Object-Oriented Design (OOD), API Design & Integration, Database Optimization, Agile / Scrum'
      },
      experience: [
        {
          id: 'sde_exp_1',
          role: 'Software Engineer Intern',
          company: 'Axodian',
          project: 'OneDoc, OneCompliance',
          companyUrl: 'https://axodian.com/',
          period: 'June 2026 - Present',
          location: 'Bangalore, KA (On-Site)',
          relevant: true,
          highlights: [
            'Architected enterprise trade finance microservices and secure REST APIs with the IBDIC ecosystem, processing 10,000+ financial transactions with 99.8% compliance accuracy.',
            'Architected multi-service architecture integrating EDPMS, IDPMS, real-time banking connectivity, SAP, and Tally, reducing manual transaction reconciliation cycle times by 40%.',
            'Implemented automated data verification engines and relational database schemas (SQL/PostgreSQL), accelerating transaction clearance throughput by 35%.',
            'Enforced Test-Driven Development (TDD) and CI/CD pipelines with GitHub Actions, maintaining 90%+ automated test coverage and zero critical defect escapes.'
          ]
        },
        {
          id: 'sde_exp_2',
          role: 'Front-end Developer Intern',
          company: 'Nexus Horizon',
          project: 'Faculties.ai',
          companyUrl: 'https://nexushorizon.ltd/#about',
          period: 'Sep 2025 - Apr 2026',
          location: 'Remote',
          relevant: true,
          highlights: [
            'Architected scalable, responsive web interfaces for enterprise academic workflows at Faculties.ai, serving 5,000+ active faculty members and students.',
            'Engineered robust frontend client components and integrated them with backend microservices via REST APIs, reducing API response handling errors by 30% and decreasing latency by 25%.',
            'Developed responsive, accessible UI modules using React and TypeScript, achieving 95+ Google Lighthouse performance scores across all device viewports.'
          ]
        },
        {
          id: 'sde_exp_3',
          role: 'Software Developer Intern',
          company: 'SNS Square',
          project: 'Evaluation Suite, Assessment Platform, Aggregator',
          companyUrl: 'https://www.snssquare.com/',
          period: 'Aug 2024 - Sep 2025',
          location: 'Coimbatore, TN (On-Site)',
          relevant: true,
          highlights: [
            'Engineered full-stack modules and implemented core backend processing logic across 3 enterprise assessment platforms (Evaluation Suite, Assessment Platform, Aggregator).',
            'Designed, tested, and analyzed requirements for automated evaluation platforms, validating over 15,000+ test submissions.',
            'Increased database query throughput and system reliability by 15%, improving project delivery milestone velocity by 10% through end-to-end automated testing.'
          ]
        }
      ],
      projects: [
        {
          name: 'Loan Eligibility Evaluation System',
          url: 'https://github.com/RNSsanjay/Loan-Eligible-Domestic.git',
          tech: 'Python, C#, REST APIs, SQL Database, Scikit-learn',
          description: 'Automated credit evaluation system that reduced manual verification by 12% and improved applicant screening accuracy by 15% across 2,000+ applicant records.'
        },
        {
          name: 'DocuMirror Enterprise Document Processing Platform',
          url: 'https://github.com/RNSsanjay/Loan-Eligible-Domestic.git',
          tech: 'Python, RESTful APIs, PostgreSQL, Document Engine',
          description: 'Scalable document management platform with REST API endpoints, image-to-HTML conversion, and structured PDF generation with 99.2% extraction precision.'
        },
        {
          name: 'AgriBridge B2B Marketplace Platform',
          url: 'https://github.com/RNSsanjay/Loan-Eligible-Domestic.git',
          tech: 'Full-Stack Web, Node.js, Express, MongoDB, REST APIs',
          description: 'Global commercial marketplace platform connecting 500+ agricultural suppliers, exporters, and enterprise buyers with real-time order processing.'
        }
      ],
      education: [
        {
          degree: 'B.Tech in Artificial Intelligence & Machine Learning',
          institution: 'SNS College of Technology',
          year: 'Nov 2022 - Apr 2026',
          location: 'Coimbatore, Tamil Nadu',
          details: 'CGPA: 8.38 / 10'
        }
      ],
      certifications: [
        'Oracle Certified Foundations Associate completed with 92% and Postman API Student Expert certified.',
        'NPTEL Industry 4.0 Certification, NASSCOM Digital Edge completed with an honors score of 81%.',
        'Salesforce Certified Associate completed with scores above 80%.'
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
      summary: 'Dynamic Full Stack Developer skilled in React.js, TypeScript, Node.js, Express, and Django, building high-performance web applications with seamless AI integrations. Experienced in architecting enterprise platforms at Axodian and Nexus Horizon, integrating robust RESTful APIs, optimizing front-end performance by 40%, and cutting error rates by 30%.',
      skills: [
        'React.js', 'TypeScript', 'JavaScript (ES6+)', 'HTML5', 'CSS3', 'Tailwind CSS', 'Shadcn/UI',
        'Node.js', 'Express.js', 'Python', 'Django', 'RESTful APIs',
        'MongoDB', 'PostgreSQL', 'MySQL', 'SQL',
        'Responsive Web Design', 'API Integration', 'Performance Optimization', 'Agile Development'
      ],
      skillCategories: {
        'Frontend': 'React.js, TypeScript, JavaScript (ES6+), HTML5, CSS3, Tailwind CSS, Shadcn/UI',
        'Backend': 'Node.js, Express.js, Python, Django, RESTful APIs, Microservices',
        'Databases': 'MongoDB, PostgreSQL, MySQL, SQL, Redis',
        'Core Strengths': 'Responsive Web Design, API Integration, Performance Optimization, Agile/Scrum'
      },
      experience: [
        {
          id: 'fsd_exp_1',
          role: 'Software Engineer Intern (On-Site)',
          company: 'Axodian',
          project: 'OneCompliance, LeDoc',
          companyUrl: 'https://www.axodian.com/',
          period: 'June 2026 - Present',
          location: 'Bangalore, KA (On-Site)',
          relevant: true,
          highlights: [
            'Engineered responsive frontend features integrated with backend REST APIs for OneCompliance, managing compliance tracking across 1,200+ corporate entities.',
            'Developed core web application modules for OneDoc document and remittance workflows, cutting user transaction friction and manual inputs by 35%.',
            'Optimized data exchange pipelines between client-facing React interfaces and enterprise microservices, boosting page load speeds by 40%.'
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
            'Architected scalable and responsive AI-driven academic workflow interfaces at Faculties.ai, serving 5,000+ active faculty members.',
            'Engineered intuitive user interfaces and integrated frontend components with backend AI services, reducing API response handling errors by 30%.',
            'Developed feature-driven web applications utilizing Python and Node.js microservices, collaborating with cross-functional design and engineering teams.'
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
            'Spearheaded full-stack module engineering and automated requirement analysis across 3 enterprise platforms (Exam Analyzer, Gen AI Suite, Aggregator).',
            'Built comprehensive automated testing suites and aligned technical features with client operational specifications, processing 15,000+ queries.',
            'Increased assessment workflow accuracy by 15% and accelerated project milestone delivery by 10% through end-to-end agile execution.'
          ]
        }
      ],
      projects: [
        {
          name: 'Loan Eligibility Checker',
          url: 'https://github.com/RNSsanjay/Loan-Eligible-Domestic.git',
          tech: 'React, Node.js, Express, Machine Learning',
          description: 'Loan approval web system that reduced manual verification by 12% and improved screening accuracy by 15% across 2,000+ applicants.'
        },
        {
          name: 'DocuMirror',
          url: 'https://github.com/RNSsanjay/Loan-Eligible-Domestic.git',
          tech: 'Full-Stack Web, AI Document Q&A, PDF Generation',
          description: 'AI document platform for document Q&A, image-to-HTML conversion, and editable PDF generation with 99.2% extraction precision.'
        },
        {
          name: 'AgriBridge',
          url: 'https://github.com/RNSsanjay/Loan-Eligible-Domestic.git',
          tech: 'React, Node.js, Express, MongoDB',
          description: 'Global agricultural trade platform connecting 500+ farmers, exporters, and importers with real-time responsive dashboards.'
        },
        {
          name: 'Exam Paper Analyzer',
          url: 'https://github.com/ProductFactory-01/COE-AI_Exam_Analyzer',
          tech: 'React, Python, FastAPI',
          description: 'User-friendly exam evaluation system that reduced evaluation turnaround times by 30% across multiple institutions.'
        },
        {
          name: 'Agentium',
          url: 'https://pypi.org/project/agentium/',
          tech: 'Python, Multi-Agent Architecture',
          description: 'Published Python library for building multi-agent AI architectures, reducing development boilerplate by 55%.'
        }
      ],
      education: [
        {
          degree: 'B.Tech in Artificial Intelligence & Machine Learning',
          institution: 'SNS College of Technology',
          year: 'Nov 2022 - Jun 2026',
          location: 'Coimbatore, Tamil Nadu',
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
      summary: 'Customer-focused and detail-oriented Business Analyst with proven experience in client communication, stakeholder management, requirement engineering, and cross-functional coordination at SNS Square. Skilled in translating complex enterprise business requirements into clear functional specifications, facilitating technical team alignment, resolving queries under 4 hours, and maintaining a 98% client satisfaction rating.',
      skills: [
        'Client Acquisition', 'Requirement Gathering', 'Functional Specifications', 'Client Handling',
        'Active Listening & Problem Solving', 'Relationship Management', 'Market Analysis',
        'Time Management', 'Stakeholder Communication', 'Cross-Functional Coordination'
      ],
      skillCategories: {
        'Tools & Technologies': 'MS Office (Excel, Word, PowerPoint), Basic CRM Tools, Email & Chat Support Systems, Internet & Data Handling',
        'Key Competencies': 'Client Acquisition, Active Listening & Problem Solving, Communication, Client Handling, Time Management, Relationship Management, Market Analysis'
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
            'Orchestrated client relationships as primary point of contact across 12+ enterprise accounts, maintaining a 98% client satisfaction rating.',
            'Gathered and analyzed complex business requirements, authoring 25+ detailed functional specification documents for cross-functional engineering teams.',
            'Coordinated daily sprint standups with developers to ensure 100% on-time milestone delivery and alignment with client business objectives.',
            'Resolved 150+ client technical and workflow queries with an average turnaround time under 4 hours, cutting issue escalation rates by 28%.'
          ]
        }
      ],
      education: [
        {
          degree: 'B.Tech in Artificial Intelligence & Machine Learning',
          institution: 'SNS College of Technology',
          year: 'Nov 2022 - Jun 2026',
          location: 'Coimbatore, Tamil Nadu',
          details: 'CGPA: 8.38 / 10'
        },
        {
          degree: 'HSC & SSLC Schooling',
          institution: 'S.R.C Memorial Matric Higher Secondary School',
          year: 'Jun 2020 - May 2022',
          location: 'Coimbatore, Tamil Nadu',
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
      summary: 'Detail-oriented Quality Checker with 6 months of hands-on precision metrology experience in incoming, in-process, patrol, and final inspection of CNC-turned steel bar components at Anvil Automation (ISO 9001:2015 certified unit running 3 shifts). Skilled in using digital/dial vernier calipers, micrometers, height gauges, bore gauges, and digital air gauges to verify close tolerances, monitoring Cpk capability against 1.66+ plant targets, and executing PPAP/NCR quality documentation.',
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
            'Spearheaded incoming inspection of steel bar stock for size, length, and surface integrity against technical drawings prior to CNC turning release.',
            'Verified critical close-tolerance dimensions, grooves, threads, and surface finishes on CNC-turned components across 3 continuous shifts.',
            'Conducted rigorous final outgoing quality audits on finished steel bar lots, certifying 100% conforming batches for client dispatch.',
            'Operated precision vernier calipers, micrometers, height gauges, bore gauges, and digital air gauges calibrated to NABL standards.',
            'Monitored process capability (Cpk) against plant quality benchmarks (minimum 1.66, target 1.70), reducing dimension drift by 22%.',
            'Identified and quarantined non-conforming parts, logged defects in NCR registers, and executed 8D root cause corrective actions.',
            'Maintained comprehensive inspection logs and defect tracking registers in MS Excel; supported PPAP documentation and ISO 9001:2015 internal audits.'
          ]
        }
      ],
      education: [
        {
          degree: 'B.Tech in Artificial Intelligence & Machine Learning',
          institution: 'SNS College of Technology',
          year: 'Nov 2022 - Jun 2026',
          location: 'Coimbatore, Tamil Nadu',
          details: 'CGPA: 8.38 / 10'
        },
        {
          degree: 'HSC & SSLC Schooling',
          institution: 'S.R.C Memorial Matric Higher Secondary School',
          year: 'Jun 2020 - May 2022',
          location: 'Coimbatore, Tamil Nadu',
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
 * Enforces pure black ink (#000000) and two-line flex layout for Education & Experience.
 */
export function generateResumeHtml(profile, archetypeId = 'developer') {
  const visibleExperiences = (profile.experience || []).filter(e => e.relevant !== false);
  const hiddenCount = (profile.experience || []).filter(e => e.relevant === false).length;

  return `
  <div class="resume-sheet archetype-${archetypeId}" id="resume-document">
    <!-- ===== HEADER ===== -->
    <header class="head">
      <div>
        <h1 class="name" data-editable-field="fullName"><a href="https://rns-forge.github.io/RNS_Professional_Profile/" target="_blank">${escapeHtml(profile.fullName || 'SANJAY N')}</a></h1>
        <p class="role" data-editable-field="title">${escapeHtml(profile.title)}</p>
      </div>
      <div class="contact">
        <div><b>City :</b> <span data-editable-field="location">${escapeHtml(profile.location || 'Coimbatore, Tamil Nadu')}</span></div>
        <div><b>Email :</b> <a class="u" data-editable-field="email" href="mailto:${escapeHtml(profile.email || '2005sanjaynrs@gmail.com')}">${escapeHtml(profile.email || '2005sanjaynrs@gmail.com')}</a></div>
        <div><b>Phone :</b> <span data-editable-field="phone">${escapeHtml(profile.phone || '+91 93615 99018')}</span></div>
        <div><b>Github :</b> <a class="u" href="${escapeHtml(profile.github || 'https://github.com/RNS-Forge')}" target="_blank">${escapeHtml((profile.github || 'https://github.com/RNS-Forge').replace('https://', ''))}</a></div>
        <div class="wide"><b>LinkedIn :</b> <a class="u" href="https://${escapeHtml(profile.linkedin || 'www.linkedin.com/in/sanjay--n')}" target="_blank">${escapeHtml(profile.linkedin || 'www.linkedin.com/in/sanjay--n')}</a></div>
      </div>
    </header>

    <!-- ===== PROFESSIONAL SUMMARY ===== -->
    <section class="sec-summary">
      <h2>${archetypeId === 'communication' ? 'SUMMARY' : 'PROFESSIONAL SUMMARY'}</h2>
      <p class="summary" data-editable-field="summary">${escapeHtml(profile.summary)}</p>
    </section>

    <!-- ===== SKILLS / TOOLS ===== -->
    <section class="sec-skills">
      <h2>${archetypeId === 'manufacturing' ? 'INSPECTION &amp; QUALITY SKILLS' : (archetypeId === 'communication' ? 'KEY SKILLS &amp; TOOLS' : 'TECHNICAL SKILLS')}</h2>
      ${profile.skillCategories ? `
        <ul class="skills-cat-list">
          ${Object.entries(profile.skillCategories).map(([cat, list]) => `
            <li><b>${escapeHtml(cat)} :</b> <span data-editable-skill-cat="${escapeHtml(cat)}">${escapeHtml(list)}</span></li>
          `).join('')}
        </ul>
      ` : `
        <ul>
          ${(profile.skills || []).map(skill => `<li>${escapeHtml(skill)}</li>`).join('')}
        </ul>
      `}
    </section>

    <!-- ===== PROFESSIONAL EXPERIENCE ===== -->
    <section class="sec-experience">
      <h2>${archetypeId === 'communication' ? 'WORK EXPERIENCE' : 'PROFESSIONAL EXPERIENCE'}</h2>

      ${hiddenCount > 0 ? `
        <div class="ats-pruning-notice" data-html2canvas-ignore="true">
          <span><strong>BioTailr AI Pruning Active:</strong> ${hiddenCount} non-matching position(s) automatically suppressed to guarantee 100% role relevance.</span>
        </div>
      ` : ''}

      ${visibleExperiences.map((exp, expIdx) => `
        <div class="exp-entry" data-exp-index="${expIdx}">
          <div class="exp-row-primary">
            <span class="exp-company-role">
              ${exp.companyUrl ? `<a class="plain exp-company" href="${escapeHtml(exp.companyUrl)}" target="_blank"><b>${escapeHtml(exp.company)}</b></a>` : `<b class="exp-company">${escapeHtml(exp.company)}</b>`}
              &ndash; <span class="exp-role">${escapeHtml(exp.role)}</span>
            </span>
            <span class="exp-period when">${escapeHtml(exp.period)}</span>
          </div>
          ${(exp.project || exp.location) ? `
            <div class="exp-row-secondary">
              <span class="exp-project">${exp.project ? `Project: <em>${escapeHtml(exp.project)}</em>` : ''}</span>
              <span class="exp-location">${escapeHtml(
                (exp.company && exp.company.toLowerCase().includes('axodian'))
                  ? (exp.location && !exp.location.toLowerCase().includes('coimbatore') ? exp.location : 'Bangalore, KA (On-Site)')
                  : (exp.location || 'Coimbatore, TN')
              )}</span>
            </div>
          ` : ''}
          ${exp.companyNote ? `<p class="company-note">${escapeHtml(exp.companyNote)}</p>` : ''}
          <ul class="exp-bullets">
            ${(exp.highlights || []).map((bullet, bIdx) => `
              <li data-bullet-index="${bIdx}">${escapeHtml(bullet)}</li>
            `).join('')}
          </ul>
        </div>
      `).join('')}
    </section>

    <!-- ===== PROJECTS ===== -->
    ${profile.projects && profile.projects.length > 0 ? `
    <section class="sec-projects">
      <h2>PROJECTS</h2>
      <ul class="projects-list">
        ${profile.projects.map((proj, pIdx) => `
          <li data-proj-index="${pIdx}">
            ${proj.url ? `<a class="plain proj-name" href="${escapeHtml(proj.url)}" target="_blank"><b>${escapeHtml(proj.name)} &ndash;</b></a>` : `<b class="proj-name">${escapeHtml(proj.name)} &ndash;</b>`}
            <span class="proj-desc">${escapeHtml(proj.description)}</span>
          </li>
        `).join('')}
      </ul>
    </section>
    ` : ''}

    <!-- ===== EDUCATION ===== -->
    <section class="sec-education">
      <h2>EDUCATION</h2>
      ${(profile.education || []).map((edu, eduIdx) => `
        <div class="edu-entry" data-edu-index="${eduIdx}">
          <div class="edu-row-primary">
            <span class="edu-degree"><b>${escapeHtml(edu.degree || 'Degree')}</b></span>
            <span class="edu-year when">${escapeHtml(edu.year)}</span>
          </div>
          <div class="edu-row-secondary">
            <span class="edu-institution">${escapeHtml(edu.institution)}</span>
            <span class="edu-location">${escapeHtml(edu.location || 'Coimbatore, Tamil Nadu')}</span>
          </div>
          ${edu.details ? `
            <ul class="edu-bullets">
              <li>${escapeHtml(edu.details)}</li>
            </ul>
          ` : ''}
        </div>
      `).join('')}
    </section>

    <!-- ===== AWARDS AND CERTIFICATION ===== -->
    ${profile.certifications && profile.certifications.length > 0 ? `
    <section class="sec-certifications">
      <h2>AWARDS AND CERTIFICATION</h2>
      <ul>
        ${profile.certifications.map((cert, cIdx) => `
          <li data-cert-index="${cIdx}">${escapeHtml(cert)}</li>
        `).join('')}
      </ul>
    </section>
    ` : ''}

    <!-- ===== LANGUAGES ===== -->
    ${profile.languages ? `
    <section class="sec-languages">
      <h2>LANGUAGES</h2>
      <p class="summary" data-editable-field="languages">${escapeHtml(profile.languages)}</p>
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
