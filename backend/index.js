import 'dotenv/config';
import express from 'express';
// import {cors} from 'cors';
import mongoose from 'mongoose';
import { Router } from 'express';
import server from "./src/serverConfig/server.js"


const app = express();
const port = process.env.PORT || 3000;
const MONGODB_URL = process.env.MONGODB_URL;

// app.use(cors());
app.use(express.json());

app.use('/jobs',server)

mongoose.connect(MONGODB_URL)
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
  });