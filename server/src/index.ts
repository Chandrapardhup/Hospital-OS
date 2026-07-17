import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import callRoutes from './routes/call.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Needed for Twilio Webhooks

app.use('/api/call', callRoutes);

app.get('/health', (req, res) => {
  res.send('HospitalOS Call Service is running.');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Expose this server using ngrok to allow Twilio webhooks: ngrok http ${PORT}`);
});
