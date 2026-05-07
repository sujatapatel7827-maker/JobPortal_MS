const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedMassiveRealJobs() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    console.log('Populating database with 20+ real jobs across India...');

    await connection.query('DELETE FROM jobs');
    
    const [rows] = await connection.query('SELECT id FROM users WHERE role = ? LIMIT 1', ['employer']);
    const employerId = rows[0].id;

    const jobData = [
        // Delhi / NCR
        ['Web Developer', 'Tech Solutions', 'New Delhi', '₹8L - ₹15L', 'Looking for a passionate Web Developer to join our Delhi team. Full stack Web Development experience is required.', 'React, Node.js, MongoDB'],
        ['Frontend Developer', 'Zomato', 'New Delhi (HQ)', '₹15L - ₹25L', 'Building the next generation of food tech. Role involves Web Development using React and Next.js.', 'React, Next.js, TypeScript, CSS'],
        ['Backend Engineer', 'Paytm', 'Noida, Delhi NCR', '₹12L - ₹22L', 'Scale the largest payment network in India. Focus on Web Development APIs and security.', 'Node.js, Express, MySQL, Redis'],
        ['Full Stack Developer', 'MakeMyTrip', 'Gurugram, Delhi NCR', '₹18L - ₹30L', 'Join the travel tech revolution. End-to-end Web Development for our booking platform.', 'React, Node.js, MongoDB, AWS'],
        ['Software Engineer', 'Adobe', 'Noida', '₹25L - ₹40L', 'Work on world-class creative tools. High-performance Web Development using modern frameworks.', 'JavaScript, C++, WebAssembly, React'],
        ['UI/UX Developer', 'PolicyBazaar', 'Delhi', '₹10L - ₹18L', 'Creating seamless insurance journeys. Focus on Frontend and Web Development.', 'Figma, HTML, CSS, JavaScript, React'],

        // Bangalore (Bengaluru)
        ['Software Engineer III', 'Google India', 'Bengaluru', '₹40L - ₹70L', 'Work on Google Search and Cloud. Advanced Web Development at scale.', 'Java, Go, Python, React, System Design'],
        ['SDE 2', 'Amazon', 'Bengaluru', '₹35L - ₹60L', 'Building AWS services and e-commerce platforms. Complex Backend and Web Development.', 'Java, Spring Boot, DynamoDB, AWS'],
        ['Frontend Engineer', 'Flipkart', 'Bengaluru', '₹20L - ₹35L', 'Optimizing the e-commerce experience for millions. Core Web Development role.', 'React, Redux, Performance, Mobile-Web'],
        ['Backend Developer', 'Swiggy', 'Bengaluru', '₹18L - ₹32L', 'Real-time tracking and order management systems. Scalable Web Development.', 'Node.js, Go, Microservices, Kafka'],
        ['Full Stack Developer', 'Cure.fit', 'Bengaluru', '₹15L - ₹25L', 'Building health and fitness platforms. Agile Web Development.', 'React, Node.js, PostgreSQL'],

        // Mumbai
        ['Full Stack Web Developer', 'BookMyShow', 'Mumbai', '₹12L - ₹22L', 'The entertainment destination for India. Full stack Web Development.', 'React, PHP, Laravel, MySQL'],
        ['Backend Engineer', 'Nykaa', 'Mumbai', '₹14L - ₹24L', 'Scaling the beauty and fashion platform. Focus on APIs and Web Development.', 'Node.js, Python, MongoDB'],
        ['Frontend Developer', 'Dream11', 'Mumbai', '₹20L - ₹35L', 'Building the worlds largest fantasy sports platform. Web Development at peak load.', 'React, TypeScript, Canvas, WebGL'],
        ['Software Engineer', 'Jio', 'Mumbai', '₹10L - ₹20L', 'Digital transformation for India. Massive scale Web Development.', 'Java, Spring, Angular, SQL'],

        // General / Remote
        ['Senior Web Developer', 'StartUp Inc', 'Delhi / Remote', '₹20L - ₹35L', 'Join a fast growing startup. Lead our Web Development efforts.', 'React, Node.js, AWS'],
        ['React Developer', 'Infosys', 'Pune', '₹6L - ₹12L', 'Client projects for global brands. Enterprise Web Development.', 'React, JavaScript, CSS, Unit Testing'],
        ['Java Backend Dev', 'TCS', 'Chennai', '₹5L - ₹10L', 'Support and development for banking clients. Backend Web Development.', 'Java, Spring, Oracle, REST'],
        ['Node.js Developer', 'Wipro', 'Hyderabad', '₹7L - ₹14L', 'Modernizing legacy systems. Node.js based Web Development.', 'Node.js, Express, SQL, Docker']
    ];

    for (const [title, company, location, salary, description, requirements] of jobData) {
        await connection.query(
            'INSERT INTO jobs (employer_id, title, company, location, salary, description, requirements) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [employerId, title, company, location, salary, description, requirements]
        );
    }

    console.log(`Successfully added ${jobData.length} diverse real-world jobs!`);
    await connection.end();
}

seedMassiveRealJobs().catch(console.error);
