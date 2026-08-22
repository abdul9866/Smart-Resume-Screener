import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SQLite database with sample data...');

  // 1. Clean existing data
  await prisma.screeningResult.deleteMany({});
  await prisma.candidateSkill.deleteMany({});
  await prisma.skill.deleteMany({});
  await prisma.experience.deleteMany({});
  await prisma.education.deleteMany({});
  await prisma.candidate.deleteMany({});
  await prisma.job.deleteMany({});

  // 2. Create Skills
  const skillNames = [
    'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 
    'Tailwind CSS', 'Python', 'SQL', 'Pandas', 'Docker', 
    'HTML5', 'CSS3', 'REST APIs', 'GraphQL', 'Next.js'
  ];

  const skillMap: Record<string, any> = {};
  for (const name of skillNames) {
    const skill = await prisma.skill.create({
      data: { name },
    });
    skillMap[name] = skill;
  }

  // 3. Create Sample Job Description
  const fullStackJob = await prisma.job.create({
    data: {
      title: 'Senior Full-Stack Engineer (React & Node.js)',
      description: `
We are looking for a Senior Full-Stack Engineer to join our core product team. You will be responsible for building, scaling, and maintaining client-facing web applications and robust backend APIs.

Requirements:
- Strong proficiency in modern React, TypeScript, and Tailwind CSS.
- Proven experience building RESTful backend services using Node.js, Express, and PostgreSQL.
- Experience with cloud architecture, specifically AWS (S3, EC2, RDS).
- Familiarity with containerization using Docker.
- Minimum 3 years of professional software development experience.
- Bachelor's degree in Computer Science, Software Engineering, or a related technical field.

Preferred Qualifications:
- Experience with GraphQL, Next.js, and serverless architectures.
- Active contributor to open-source software or strong portfolio of personal projects.
      `,
      requirements: JSON.stringify({
        title: 'Senior Full-Stack Engineer (React & Node.js)',
        requiredSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'],
        preferredSkills: ['Tailwind CSS', 'Docker', 'GraphQL', 'Next.js'],
        minimumExperience: 3,
        educationRequirements: ["Bachelor's", "Master's"],
        responsibilities: [
          'Develop interactive frontend applications using React',
          'Design and deploy robust RESTful APIs in Node.js',
          'Deploy and manage containerized services on AWS cloud environments'
        ],
        keywords: ['Fullstack', 'Frontend', 'Backend', 'Software Engineer']
      })
    }
  });

  console.log(`Created sample job: ${fullStackJob.title}`);

  // 4. Create Candidate A: Rahul Sharma (Strong Match - 87%)
  const rahul = await prisma.candidate.create({
    data: {
      name: 'Rahul Sharma (Sample Data)',
      email: 'rahul.sharma.sample@gmail.com',
      phone: '+91 98765 43210',
      resumeFileName: 'rahul_sharma_resume_sample.pdf',
      resumeText: `
Rahul Sharma
Mobile: +91 98765 43210 | Email: rahul.sharma.sample@gmail.com
Bangalore, India

SUMMARY
Thoughtful and pragmatic Software Engineer with 3.8 years of hands-on experience building web applications. Highly proficient in JavaScript, React, TypeScript, Node.js, and relational databases. Passioned about building scalable user interfaces and clean REST APIs.

EDUCATION
- Bachelor of Technology in Computer Science
  Visvesvaraya Technological University (2018 - 2022)

TECHNICAL SKILLS
- Languages: TypeScript, JavaScript, SQL, HTML5, CSS3
- Frameworks/Libraries: React, Node.js, Express, Tailwind CSS, Next.js
- Databases: PostgreSQL, MySQL, Redis
- Tools: Git, Docker, Postman, Jest

EXPERIENCE
Software Engineer | Apex Tech Solutions (July 2022 - Present)
- Designed and built user dashboards using React and TypeScript, improving web application load times by 20%.
- Developed high-throughput REST APIs using Express and Node.js. Optimized PostgreSQL database queries to reduce API latency.
- Collaborated closely with product designers to implement responsive layouts using Tailwind CSS.
- Set up automated testing pipelines using Jest.

Associate Software Engineer | CloudCraft Systems (June 2021 - June 2022)
- Assisted in migrating legacy jQuery portals to React components.
- Developed backend routes and database schemas for web portals.
- Managed service deployments using Docker containers locally.
      `,
      summary: 'Experienced Full-Stack Developer with strong expertise in React, TypeScript, Node.js, and PostgreSQL. Competent in modern frontend styling and containerization.',
      education: {
        create: [
          {
            institution: 'Visvesvaraya Technological University',
            degree: "Bachelor's",
            field: 'Computer Science',
            startYear: 2018,
            endYear: 2022
          }
        ]
      },
      experience: {
        create: [
          {
            company: 'Apex Tech Solutions',
            role: 'Software Engineer',
            startDate: 'July 2022',
            endDate: 'Present',
            description: 'Designed and built user dashboards using React and TypeScript. Developed REST APIs using Express and Node.js. Optimized PostgreSQL queries.'
          },
          {
            company: 'CloudCraft Systems',
            role: 'Associate Software Engineer',
            startDate: 'June 2021',
            endDate: 'June 2022',
            description: 'Assisted in migrating legacy portals to React. Developed backend routes and schemas. Managed Docker containers locally.'
          }
        ]
      }
    }
  });

  // Link skills
  const rahulSkills = ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Docker', 'HTML5', 'CSS3', 'REST APIs', 'Next.js'];
  for (const name of rahulSkills) {
    if (skillMap[name]) {
      await prisma.candidateSkill.create({
        data: {
          candidateId: rahul.id,
          skillId: skillMap[name].id,
          proficiency: 'Advanced'
        }
      });
    }
  }

  // Create Screening Result for Rahul
  await prisma.screeningResult.create({
    data: {
      candidateId: rahul.id,
      jobId: fullStackJob.id,
      score: 87,
      recommendation: 'Strong Match',
      summary: 'Rahul shows a strong alignment with the technical requirements of the role. He possesses 3.8 years of relevant full-stack development experience, exceeding the 3-year minimum requirement, and holds a Bachelor\'s degree in Computer Science. Gaps include lack of direct AWS exposure in his career history.',
      strengths: JSON.stringify([
        'Solid experience with the required tech stack: React, TypeScript, Node.js, and PostgreSQL',
        '3.8 years of professional experience, meeting the senior requirements',
        'Strong education credentials with a B.Tech in Computer Science',
        'Hands-on experience with containerization (Docker) and modern styling (Tailwind CSS)'
      ]),
      missingSkills: JSON.stringify(['AWS']),
      relevantExperience: JSON.stringify([
        'Built full-stack React and Node.js services at Apex Tech Solutions',
        'Maintained PostgreSQL database schemas and optimized queries'
      ]),
      concerns: JSON.stringify([
        'Main tech stack gap is hands-on AWS production experience (S3, RDS, EC2), although he has Docker familiarity.'
      ]),
      scoreBreakdown: JSON.stringify({
        skills: 40,
        experience: 30,
        education: 10,
        alignment: 7
      })
    }
  });


  // 5. Create Candidate B: Priya Patel (Good Match - 71%)
  const priya = await prisma.candidate.create({
    data: {
      name: 'Priya Patel (Sample Data)',
      email: 'priya.patel.sample@yahoo.com',
      phone: '+91 99988 77766',
      resumeFileName: 'priya_patel_resume_sample.pdf',
      resumeText: `
Priya Patel
Email: priya.patel.sample@yahoo.com | Phone: +91 99988 77766
Mumbai, India

SUMMARY
Creative Frontend Engineer with 2.2 years of experience specializing in React, HTML5, CSS3, and Tailwind CSS. Focuses on building highly accessible, intuitive user interfaces and interactive dashboards. Eager to expand skills into backend technologies like Node.js and cloud systems.

EDUCATION
- Bachelor of Engineering in Information Technology
  Mumbai University (2019 - 2023)

TECHNICAL SKILLS
- Frontend: React, Redux, JavaScript, HTML5, CSS3, Tailwind CSS, Sass
- Tools & Utilities: Git, Figma, NPM, Webpack, ESLint
- Databases: MongoDB (Basic)

EXPERIENCE
Frontend Developer | Innovate Web Labs (January 2023 - Present)
- Developed responsive web pages using React and Tailwind CSS based on high-fidelity designs.
- Integrated REST APIs with frontend state management (Redux Toolkit).
- Worked closely with UX/UI designers to improve interface accessibility and responsiveness.
      `,
      summary: 'Frontend Engineer focused on React and Tailwind CSS. Possesses strong UI/UX collaboration skills, but has limited backend and cloud experience.',
      education: {
        create: [
          {
            institution: 'Mumbai University',
            degree: "Bachelor's",
            field: 'Information Technology',
            startYear: 2019,
            endYear: 2023
          }
        ]
      },
      experience: {
        create: [
          {
            company: 'Innovate Web Labs',
            role: 'Frontend Developer',
            startDate: 'January 2023',
            endDate: 'Present',
            description: 'Developed responsive web pages in React/Tailwind. Integrated REST APIs. Collaborated with UI/UX designers.'
          }
        ]
      }
    }
  });

  // Link skills
  const priyaSkills = ['React', 'Tailwind CSS', 'HTML5', 'CSS3', 'REST APIs'];
  for (const name of priyaSkills) {
    if (skillMap[name]) {
      await prisma.candidateSkill.create({
        data: {
          candidateId: priya.id,
          skillId: skillMap[name].id,
          proficiency: 'Advanced'
        }
      });
    }
  }

  // Create Screening Result for Priya
  await prisma.screeningResult.create({
    data: {
      candidateId: priya.id,
      jobId: fullStackJob.id,
      score: 71,
      recommendation: 'Good Match',
      summary: 'Priya is a capable Frontend Engineer with solid skills in React and Tailwind CSS. She is a Good Match for the frontend components of the role but lacks the required backend experience (Node.js, PostgreSQL) and cloud knowledge (AWS). She has 2.2 years of experience, which is slightly below the preferred 3-year minimum.',
      strengths: JSON.stringify([
        'Strong expertise in modern frontend technologies: React, HTML5, CSS3, and Tailwind CSS',
        'Experience integrating REST APIs into UI state management systems',
        'Relevant educational background in Information Technology'
      ]),
      missingSkills: JSON.stringify(['TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'Docker']),
      relevantExperience: JSON.stringify([
        'Built reactive and accessible web components at Innovate Web Labs'
      ]),
      concerns: JSON.stringify([
        'No professional experience in backend development (Node.js, Express) or databases (PostgreSQL)',
        'No exposure to cloud services (AWS) or containerization (Docker)',
        'Years of experience (2.2) is slightly below the requested 3-year threshold.'
      ]),
      scoreBreakdown: JSON.stringify({
        skills: 25,
        experience: 22,
        education: 10,
        alignment: 14
      })
    }
  });


  // 6. Create Candidate C: John Doe (Weak Match - 38%)
  const john = await prisma.candidate.create({
    data: {
      name: 'John Doe (Sample Data)',
      email: 'john.doe.sample@gmail.com',
      phone: '+1 555-0199',
      resumeFileName: 'john_doe_resume_sample.pdf',
      resumeText: `
John Doe
Email: john.doe.sample@gmail.com | Phone: +1 555-0199
California, USA

SUMMARY
Data Scientist with 1.5 years of experience building statistical models, analyzing large datasets, and writing Python scripts. Highly skilled in SQL, Pandas, NumPy, and regression models. Seeking a software role to leverage statistical knowledge.

EDUCATION
- Master of Science in Data Analytics
  Stanford University (2021 - 2023)

TECHNICAL SKILLS
- Languages: Python, R, SQL, MATLAB
- Libraries: Pandas, NumPy, Scikit-Learn, Matplotlib
- Databases: MySQL, SQLite

EXPERIENCE
Junior Data Analyst | Insight Data Corp (October 2023 - Present)
- Performed statistical modeling and data cleaning using Python and Pandas.
- Wrote SQL queries to extract data from corporate databases and generate reports.
- Visualized data for executive dashboards.
      `,
      summary: 'Data Scientist with solid Python and statistical modeling experience. Significant technical disconnect from the requested React and Node.js full-stack profile.',
      education: {
        create: [
          {
            institution: 'Stanford University',
            degree: "Master's",
            field: 'Data Analytics',
            startYear: 2021,
            endYear: 2023
          }
        ]
      },
      experience: {
        create: [
          {
            company: 'Insight Data Corp',
            role: 'Junior Data Analyst',
            startDate: 'October 2023',
            endDate: 'Present',
            description: 'Data cleaning with Pandas. SQL query writing and visualization for executive dashboard metrics.'
          }
        ]
      }
    }
  });

  // Link skills
  const johnSkills = ['Python', 'SQL', 'Pandas'];
  for (const name of johnSkills) {
    if (skillMap[name]) {
      await prisma.candidateSkill.create({
        data: {
          candidateId: john.id,
          skillId: skillMap[name].id,
          proficiency: 'Intermediate'
        }
      });
    }
  }

  // Create Screening Result for John
  await prisma.screeningResult.create({
    data: {
      candidateId: john.id,
      jobId: fullStackJob.id,
      score: 38,
      recommendation: 'Weak Match',
      summary: 'John\'s profile is not suited for this full-stack engineering role. He is a Data Analyst / Data Scientist with skills centered on Python, SQL, and data analysis. He has zero experience with modern frontend applications (React, TS) or server development (Node.js, Express), which are core requirements of the job. His experience is also below the 3-year requirement.',
      strengths: JSON.stringify([
        'Advanced SQL knowledge',
        'Strong education credentials with a Master\'s degree from Stanford University'
      ]),
      missingSkills: JSON.stringify(['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'Tailwind CSS', 'Docker']),
      relevantExperience: JSON.stringify([]),
      concerns: JSON.stringify([
        'Complete lack of required client-side React and styling skills',
        'No server development experience with Node.js/Express',
        'Total professional experience is 1.5 years, which is well below the requested 3 years'
      ]),
      scoreBreakdown: JSON.stringify({
        skills: 10,
        experience: 15,
        education: 10,
        alignment: 3
      })
    }
  });

  console.log('SQLite Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
