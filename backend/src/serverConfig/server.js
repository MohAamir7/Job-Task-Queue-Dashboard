// import {dotenv} from "dotenv"
import express from "express"
// import {cors} from "cors"
import Job from "../models/jobs.js";

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(
      jobs.map((job) => ({
        id: job._id.toString(),
        title: job.title,
        type: job.type,
        status: job.status,
        createdAt: job.createdAt,
      }))
    );
  } catch {
    res.status(500).json({ message: 'Could not load jobs' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, type } = req.body;

    if (!title?.trim() || !type?.trim()) {
      return res.status(400).json({
        message: 'Title and type are required',
      });
    }

    const job = await Job.create({
      title: title.trim(),
      type: type.trim(),
    });

    res.status(201).json({
      id: job._id.toString(),
      title: job.title,
      type: job.type,
      status: job.status,
      createdAt: job.createdAt,
    });
  } catch {
    res.status(500).json({ message: 'Could not create job' });
  }
});


export default router;




