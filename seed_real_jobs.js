const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedRealJobs() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    console.log('Connected to DB for Real Seeding...');

    // Clear existing dummy jobs to make it clean
    await connection.query('DELETE FROM jobs');
    
    const [rows] = await connection.query('SELECT id FROM users WHERE role = ? LIMIT 1', ['employer']);
    let employerId;
    
    if (rows.length === 0) {
        await connection.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            ['Verified Employer', 'jobs@verified.com', 'hashed', 'employer']
        );
        const [newRows] = await connection.query('SELECT id FROM users WHERE email = ?', ['jobs@verified.com']);
        employerId = newRows[0].id;
    } else {
        employerId = rows[0].id;
    }

    const realJobs = [
        [
            'Software Engineer, Frontend', 
            'Google India', 
            'Bengaluru, Karnataka', 
            '₹25L - ₹45L', 
            'At Google, we strive to build products that help people every day. We are looking for Frontend Engineers to join our core search and ads teams.', 
            'React.js, TypeScript, Web Performance, Unit Testing, GraphQL'
        ],
        [
            'Software Development Engineer II', 
            'Microsoft', 
            'Hyderabad, Telangana', 
            '₹30L - ₹55L', 
            'Join the Azure Cloud team at Microsoft to build scalable backend services that power millions of businesses globally.', 
            'C#, .NET Core, Azure, Microservices, SQL Server, System Design'
        ],
        [
            'Senior Frontend Engineer', 
            'Swiggy', 
            'Remote / Bengaluru', 
            '₹18L - ₹32L', 
            'Help us build the future of food delivery and hyper-local commerce. You will work on high-traffic web platforms used by millions.', 
            'React, Redux, Next.js, Node.js, CSS in JS, Mobile-first design'
        ],
        [
            'Backend Developer (Node.js)', 
            'Zomato', 
            'Gurugram, Haryana', 
            '₹15L - ₹28L', 
            'Zomato is on a mission to ensure nobody has a bad meal. Join our tech team to build robust APIs and server-side logic.', 
            'Node.js, Express, MySQL, Redis, Kafka, Distributed Systems'
        ],
        [
            'Cloud Infrastructure Engineer', 
            'Amazon (AWS)', 
            'Chennai, Tamil Nadu', 
            '₹22L - ₹40L', 
            'Amazon Web Services is looking for engineers to manage and scale global infrastructure. Deep knowledge of networking is required.', 
            'AWS, Python, Linux, Terraform, Docker, Kubernetes, Networking'
        ],
        [
            'Full Stack Developer', 
            'Paytm', 
            'Noida, UP', 
            '₹12L - ₹22L', 
            'Build secure and fast fintech products at Paytm. Experience with both frontend and backend is a must.', 
            'JavaScript, Node.js, React, MongoDB, Payment Gateways'
        ]
    ];

    for (const [title, company, location, salary, description, requirements] of realJobs) {
        await connection.query(
            'INSERT INTO jobs (employer_id, title, company, location, salary, description, requirements) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [employerId, title, company, location, salary, description, requirements]
        );
    }

    console.log('Real company jobs seeded successfully!');
    await connection.end();
}

seedRealJobs().catch(console.error);
