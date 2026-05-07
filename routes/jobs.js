const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');
const { calculateMatch } = require('../utils/aiMatcher');
const router = express.Router();

// Post a Job (Employer only)
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'employer') return res.status(403).json({ message: 'Only employers can post jobs' });
    
    const { title, company, location, salary, description, requirements } = req.body;
    try {
        await db.execute(
            'INSERT INTO jobs (employer_id, title, company, location, salary, description, requirements) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, title, company, location, salary, description, requirements]
        );
        res.status(201).json({ message: 'Job posted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const axios = require('axios');

// Get all jobs with optional filtering, AI matching, and Live API integration
router.get('/', async (req, res) => {
    const { search, location, userId } = req.query;
    try {
        // 1. Fetch from Local Database
        let query = 'SELECT * FROM jobs';
        let params = [];

        if (search || location) {
            query += ' WHERE';
            if (search) {
                query += ' (title LIKE ? OR description LIKE ? OR requirements LIKE ?)';
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }
            if (location) {
                if (search) query += ' AND';
                query += ' location LIKE ?';
                params.push(`%${location}%`);
            }
        }
        query += ' ORDER BY created_at DESC';
        const [localJobs] = await db.execute(query, params);

        // 2. Fetch from Live External API (Arbeitnow)
        let liveJobs = [];
        try {
            // Only fetch from API if search or location is provided
            if (search || location) {
                const apiRes = await axios.get(`https://www.arbeitnow.com/api/job-board-api`);
                const allLiveJobs = apiRes.data.data || [];
                
                // Filter API results based on user query (simple client-side filter for the demo)
                liveJobs = allLiveJobs.filter(job => {
                    const matchSearch = !search || 
                        job.title.toLowerCase().includes(search.toLowerCase()) || 
                        job.description.toLowerCase().includes(search.toLowerCase());
                    const matchLocation = !location || 
                        job.location.toLowerCase().includes(location.toLowerCase());
                    return matchSearch && matchLocation;
                }).map(job => ({
                    id: `live-${job.slug}`,
                    title: job.title,
                    company: job.company_name,
                    location: job.location,
                    salary: 'Competitive',
                    description: job.description,
                    requirements: 'See description',
                    isLive: true
                }));
            }
        } catch (apiErr) {
            console.error('External API failed, falling back to local only:', apiErr.message);
        }

        // 3. Combine Results
        const combinedJobs = [...localJobs, ...liveJobs.slice(0, 10)]; // Limit live jobs to 10 for performance

        // 4. Calculate AI Match Score for all combined jobs
        if (userId) {
            const [skills] = await db.execute('SELECT skill_name FROM skills WHERE user_id = ?', [userId]);
            const userSkillList = skills.map(s => s.skill_name);
            
            // Use Promise.all for parallel AI processing
            await Promise.all(combinedJobs.map(async (job) => {
                const reqsToMatch = job.isLive ? job.description : job.requirements;
                const result = await calculateMatch(userSkillList, reqsToMatch);
                job.matchScore = result.percentage;
                job.matchReason = result.reasoning;
            }));
        }

        res.json(combinedJobs);
    } catch (err) {
        console.error('Jobs Search Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get single job (Support Local & Live)
router.get('/:id', async (req, res) => {
    const { userId } = req.query;
    const { id } = req.params;
    try {
        let job;
        if (id.startsWith('live-')) {
            // Fetch from API to get details
            const apiRes = await axios.get(`https://www.arbeitnow.com/api/job-board-api`);
            const slug = id.replace('live-', '');
            const found = apiRes.data.data.find(j => j.slug === slug);
            if (!found) return res.status(404).json({ message: 'Live job not found' });
            
            job = {
                id: id,
                title: found.title,
                company: found.company_name,
                location: found.location,
                salary: 'Competitive',
                description: found.description,
                requirements: 'Check description',
                isLive: true
            };
        } else {
            const [jobs] = await db.execute('SELECT * FROM jobs WHERE id = ?', [id]);
            if (jobs.length === 0) return res.status(404).json({ message: 'Job not found' });
            job = jobs[0];
        }

        if (userId) {
            const [skills] = await db.execute('SELECT skill_name FROM skills WHERE user_id = ?', [userId]);
            const userSkillList = skills.map(s => s.skill_name);
            const result = await calculateMatch(userSkillList, job.isLive ? job.description : job.requirements);
            job.matchScore = result.percentage;
            job.matchReason = result.reasoning;
        }

        res.json(job);
    } catch (err) {
        console.error('Get Job Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Apply for a job (Applicant only)
router.post('/:id/apply', auth, async (req, res) => {
    if (req.user.role !== 'applicant') return res.status(403).json({ message: 'Only applicants can apply' });

    const { id } = req.params;
    let finalJobId = id;

    try {
        // If it's a Live job, we must ensure it exists in our local jobs table first
        if (id.toString().startsWith('live-')) {
            const [existing] = await db.execute('SELECT id FROM jobs WHERE live_id = ?', [id]);
            if (existing.length > 0) {
                finalJobId = existing[0].id;
            } else {
                // Fetch details from API to create local shadow job
                const apiRes = await axios.get(`https://www.arbeitnow.com/api/job-board-api`);
                const slug = id.replace('live-', '');
                const found = apiRes.data.data.find(j => j.slug === slug);
                
                if (found) {
                    const [result] = await db.execute(
                        'INSERT INTO jobs (title, company, location, salary, description, requirements, live_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [found.title, found.company_name, found.location, 'Competitive', found.description, 'Remote API Job', id]
                    );
                    finalJobId = result.insertId;
                } else {
                    return res.status(404).json({ message: 'Cannot apply: Live job data missing' });
                }
            }
        }

        const [existingApp] = await db.execute('SELECT * FROM applications WHERE applicant_id = ? AND job_id = ?', [req.user.id, finalJobId]);
        if (existingApp.length > 0) return res.status(400).json({ message: 'Already applied' });

        await db.execute('INSERT INTO applications (applicant_id, job_id) VALUES (?, ?)', [req.user.id, finalJobId]);
        res.json({ message: 'Applied successfully' });
    } catch (err) {
        console.error('Apply Error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
