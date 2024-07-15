import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';
import https from 'https';
import fs from 'fs';

dotenv.config();

const app = express();

// Configuración de seguridad básica
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100
});
app.use(limiter);

interface EmailRequest {
	name: string;
	email: string;
	subject: string;
	message: string;
}

async function sendEmail(data: EmailRequest): Promise<void> {
	const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS
		}
	});

	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: process.env.RECIPIENT_EMAIL,
		subject: `Nuevo mensaje de ${data.name}: ${data.subject}`,
		text: `
      Nombre: ${data.name}
      Email: ${data.email}
      Asunto: ${data.subject}
      Mensaje: ${data.message}
    `
	};

	await transporter.sendMail(mailOptions);
}

const validateEmailRequest = [
	body('name').trim().isLength({ min: 1 }).escape(),
	body('email').isEmail().normalizeEmail(),
	body('subject').trim().isLength({ min: 1 }).escape(),
	body('message').trim().isLength({ min: 1 }).escape(),
];

app.post('/send-email', validateEmailRequest, async (req: Request<{}, {}, EmailRequest>, res: Response) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		await sendEmail(req.body);
		res.status(200).send('Email sent successfully');
	} catch (error) {
		console.error('Error sending email:', error);
		res.status(500).send('Error sending email');
	}
});

const PORT = process.env.PORT || 8000;

if (process.env.NODE_ENV === 'production') {
	const privateKey = fs.readFileSync('/path/to/privkey.pem', 'utf8');
	const certificate = fs.readFileSync('/path/to/cert.pem', 'utf8');
	const ca = fs.readFileSync('/path/to/chain.pem', 'utf8');

	const credentials = {
		key: privateKey,
		cert: certificate,
		ca: ca
	};

	const httpsServer = https.createServer(credentials, app);

	httpsServer.listen(PORT, () => {
		console.log(`HTTPS Server running on port ${PORT}`);
	});
} else {
	app.listen(PORT, () => {
		console.log(`HTTP Server running on port ${PORT}`);
	});
}