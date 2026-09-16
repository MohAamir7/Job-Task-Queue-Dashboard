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

router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status: nextStatus } = req.body;
  const allowedTransitions = {
    pending: ['running'],
    running: ['completed', 'failed'],
  };

  try {
    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (!allowedTransitions[job.status]?.includes(nextStatus)) {
      return res.status(409).json({
        message: `Cannot change job from ${job.status} to ${nextStatus}`,
      });
    }
    const updatedJob = await Job.findOneAndUpdate(
      { _id: id, status: job.status },
      { $set: { status: nextStatus } },
      { new: true, runValidators: true }
    );

    if (!updatedJob) {
      return res.status(409).json({
        message: 'Job status changed by another request',
      });
    }

    res.json({
      id: updatedJob._id.toString(),
      title: updatedJob.title,
      type: updatedJob.type,
      status: updatedJob.status,
      createdAt: updatedJob.createdAt,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid job id' });
    }

    res.status(500).json({ message: 'Could not update job status' });
  }
});

router.delete('/:id', async (req,res)=>{
  const {id} = req.params;

  try{
    const Deletedjob = await Job.findByIdAndDelete(id);

    if(!Deletedjob){
      return res.status(404).json({message:"Job not Found"});
    }

    res.json({
      message:"Job deleted successfully",
    })
  }catch(error){
    if(error.name == 'CastError'){
      return res.status(400).json({
        message:"Invalid job id",
      })
    }
    res.status(500).json({
      message:"Could not delete the Job",
    })
  }
});


export default router;




