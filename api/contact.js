import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Tylko metoda POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metoda niedozwolona' });
  }

  const { name, phone, email, insuranceType, message } = req.body;

  // Walidacja podstawowa
  if (!name || !phone || !email) {
    return res.status(400).json({ message: 'Wypełnij wszystkie wymagane pola' });
  }

  // Mapowanie typów ubezpieczeń
  const insuranceTypes = {
    'majatkowe': 'Ubezpieczenie majątkowe',
    'komunikacyjne': 'Ubezpieczenie komunikacyjne',
    'zycie': 'Ubezpieczenie na życie',
    'zdrowotne': 'Ubezpieczenie zdrowotne',
    'firmowe': 'Ubezpieczenie firmowe',
    'turystyczne': 'Ubezpieczenie turystyczne',
    'inne': 'Inne'
  };

  const insuranceTypeLabel = insuranceTypes[insuranceType] || 'Nie wybrano';

  try {
    // Debug - sprawdź czy zmienne są dostępne (usuń po naprawieniu)
    console.log('SMTP Config:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      hasPassword: !!process.env.SMTP_PASSWORD,
      from: process.env.SMTP_FROM
    });

    // Sprawdź czy wszystkie zmienne są ustawione
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      throw new Error('Brak wymaganych zmiennych środowiskowych SMTP');
    }

    // Konfiguracja transportera SMTP
    const port = parseInt(process.env.SMTP_PORT) || 587;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: port === 465, // true dla 465 (SSL), false dla 587 (STARTTLS)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Treść maila HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-top: none;
            border-radius: 0 0 10px 10px;
          }
          .field {
            margin-bottom: 20px;
            padding: 15px;
            background: white;
            border-radius: 5px;
            border-left: 4px solid #0066cc;
          }
          .field-label {
            font-weight: bold;
            color: #0066cc;
            margin-bottom: 5px;
            font-size: 12px;
            text-transform: uppercase;
          }
          .field-value {
            color: #333;
            font-size: 16px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0;">Nowe zapytanie z formularza kontaktowego</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">sigmaubezpieczenia.pl</p>
        </div>
        <div class="content">
          <div class="field">
            <div class="field-label">Imię i nazwisko</div>
            <div class="field-value">${name}</div>
          </div>

          <div class="field">
            <div class="field-label">Numer telefonu</div>
            <div class="field-value"><a href="tel:${phone}">${phone}</a></div>
          </div>

          <div class="field">
            <div class="field-label">Adres email</div>
            <div class="field-value"><a href="mailto:${email}">${email}</a></div>
          </div>

          <div class="field">
            <div class="field-label">Rodzaj ubezpieczenia</div>
            <div class="field-value">${insuranceTypeLabel}</div>
          </div>

          ${message ? `
          <div class="field">
            <div class="field-label">Wiadomość</div>
            <div class="field-value">${message.replace(/\n/g, '<br>')}</div>
          </div>
          ` : ''}

          <div class="footer">
            <p>To zapytanie zostało wysłane automatycznie z formularza kontaktowego na stronie sigmaubezpieczenia.pl</p>
            <p>Data wysłania: ${new Date().toLocaleString('pl-PL')}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Wersja tekstowa jako fallback
    const textContent = `
Nowe zapytanie z formularza kontaktowego - sigmaubezpieczenia.pl

Imię i nazwisko: ${name}
Numer telefonu: ${phone}
Adres email: ${email}
Rodzaj ubezpieczenia: ${insuranceTypeLabel}
${message ? `Wiadomość: ${message}` : ''}

Data wysłania: ${new Date().toLocaleString('pl-PL')}
    `;

    // Wysłanie maila
    await transporter.sendMail({
      from: `"Formularz kontaktowy Sigma" <${process.env.SMTP_FROM}>`,
      to: process.env.SMTP_TO || process.env.SMTP_FROM,
      replyTo: email,
      subject: `Nowe zapytanie: ${insuranceTypeLabel} - ${name}`,
      text: textContent,
      html: htmlContent,
    });

    return res.status(200).json({
      message: 'Wiadomość została wysłana pomyślnie',
      success: true
    });

  } catch (error) {
    console.error('Błąd wysyłania maila:', error);
    return res.status(500).json({
      message: 'Wystąpił błąd podczas wysyłania wiadomości',
      error: error.message
    });
  }
}
