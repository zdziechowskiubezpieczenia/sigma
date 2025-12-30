import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    // Tylko metoda POST jest dozwolona
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Tylko metoda POST jest dozwolona' });
    }

    try {
        const { name, phone, email, insuranceType, message } = req.body;

        // Walidacja danych
        if (!name || !phone || !email) {
            return res.status(400).json({
                message: 'Imię, telefon i email są wymagane'
            });
        }

        // Konfiguracja transportera email (przykład dla Gmail)
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false, // true dla portu 465, false dla innych
            auth: {
                user: process.env.SMTP_USER, // Twój email
                pass: process.env.SMTP_PASS, // Hasło aplikacji Gmail lub hasło SMTP
            },
        });

        // Treść emaila
        const insuranceTypeNames = {
            'majatkowe': 'Ubezpieczenie majątkowe',
            'komunikacyjne': 'Ubezpieczenie komunikacyjne',
            'zycie': 'Ubezpieczenie na życie',
            'zdrowotne': 'Ubezpieczenie zdrowotne',
            'firmowe': 'Ubezpieczenie firmowe',
            'turystyczne': 'Ubezpieczenie turystyczne',
            'inne': 'Inne'
        };

        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: process.env.CONTACT_EMAIL || 'zdziechowski.ubezpieczenia@gmail.com',
            subject: `Nowe zapytanie o ubezpieczenie - ${name}`,
            html: `
                <h2>Nowe zapytanie ze strony internetowej</h2>
                <p><strong>Imię i nazwisko:</strong> ${name}</p>
                <p><strong>Telefon:</strong> ${phone}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Rodzaj ubezpieczenia:</strong> ${insuranceType ? insuranceTypeNames[insuranceType] || insuranceType : 'Nie wybrano'}</p>
                <p><strong>Wiadomość:</strong></p>
                <p>${message || 'Brak wiadomości'}</p>
                <hr>
                <p style="color: #666; font-size: 12px;">Wysłano: ${new Date().toLocaleString('pl-PL')}</p>
            `,
            replyTo: email
        };

        // Wyślij email
        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            message: 'Wiadomość została wysłana pomyślnie'
        });

    } catch (error) {
        console.error('Błąd wysyłania emaila:', error);
        return res.status(500).json({
            message: 'Wystąpił błąd podczas wysyłania wiadomości',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
