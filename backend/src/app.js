import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { Server } from 'socket.io';
import {createServer} from 'node:http';
import { connectToSocket } from './controllers/socketManager.js';
import userRoutes from './routes/user.routes.js';

const app = express();
const server= createServer(app); // htttp server create
const io = connectToSocket(server); // socket connection

//Socket.IO needs the HTTP server to attach itself.
//Without the HTTP server, Socket.IO has nowhere to listen.

const allowedOrigins = [
  'http://localhost:5173',
  'https://zoom-clone-frontend-g30n.onrender.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin is not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json({limit:'50kb'}));
app.use(express.urlencoded({limit:'50kb',extended:true}));
app.use('/api/v1/user',userRoutes);

const PORT = process.env.PORT || 5000;

app.set('PORT', PORT);

app.get('/',(req,res)=>{
    res.send('Hello World kya bolti public');
});

const start = async()=>{
    const connectdb = await mongoose.connect('mongodb+srv://rajsingh9244547714_db_user:Abcd%40123@cluster0.guyrj6h.mongodb.net/zoom');
    console.log(`Mongodb connected: ${connectdb.connection.host}`);
    server.listen(app.get('PORT'),()=>{
    console.log(`Server is running on port ${PORT}`);
});

}

start();