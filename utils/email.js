const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Michel Gimenez <${process.env.EMAIL_FROM}>`;
  }

  // Este metodo crea el transporter
  newTransport() {
    // A) SENDGRID: Si estoy en produccion voy a dar como retorno el transporter usando el servicio de SENDGRID
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'Gmail',
        // service: '',  ** Gmail **, aunque es solo conveniente por ejemplo en formularios de contacto donde me envio mensaje a mi gmail
        auth: {
          user: process.env.GMAIL_EMAIL,
          pass: process.env.GMAIL_PASSWORD,
        },
      });
    }

    // B) MAILSAC: Si me encuentro en development, doy como retorno el resultado de llamar a createTransport sobre la libreria de nodemailer, esto lo que ace es crear el transporter usando el servicio de MAILSAC, que es donde defino el servicio que va a enviar el email y los detalles del puesto y host que voy a usar y paso el usuario y clave que me dieron en MAILSAC
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      // service: '',  ** Gmail **, aunque es solo conveniente por ejemplo en formularios de contacto donde me envio mensaje a mi gmail
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Este metodo es el que envia el email. Recibiendo el template y el motivo, el motivo me detalla si el email que voy a enviar va a ser para resetear la clave o para enviar la bienvenida.
  async send(template, subject) {
    // 1) Creo el html del email para enviarlo en las opciones en el paso siguiente usando la libreria de pug, le paso el template en el metodo de renderFile colocando su ubicacion, primero uso dirname que comienza desde donde se ejecuta este script, dentro de UTILS, y desde ahi bajo una carpeta, voy a VIEWS/EMAILS y dentro selecciono de forma finamica el template que quiero usando template string y colocando el nombre del template que recibi en el metodo, despues procedo a pasarle al template informacion como el nombre, url que puede ser para restaurar la clave o para redireccionar a la tienda y el motivo para utilizarlo dentro del template. Y finalmente almaceno en HTML el resultado que va a ser el template pasado a HTML.
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      { firstName: this.firstName, url: this.url, subject: subject }
    );

    // 2) Defino las opciones del email, de donde viene, el mensaje, autor, etc. El autor lo recibo de la class que al ser iniciada establece varias variables en el constructor al igual que el destinatario. El motivo lo recibo del llamado a este metodo, el html que voy a enviar lo recibo de la variable de arriba. Y en TEXT voy a pasar el email en texto plano sin usar un template ya que mucha gente prefiere el email sin tanto decorado. Para esto utilizo la libreria de htmlToText y el metodo de fromString y le paso el template en html.
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html: html,
      text: htmlToText.fromString(html),
    };

    // 3) Creo el transport llamando al metodo de la class, esto me va a dar como retorno el transporter con el servicio para enviar el email preparado para enviarlo y a este retorno del transporter le puedo encadenar el metodo que se utiliza sobre el transporter llamado sendMail() que es donde paso las opciones del email detallando hacia donde lo mando, el template que voy a usar, el motivo, autor, etc y como esto retorna una promesa, uso AWAIT.
    await this.newTransport().sendMail(mailOptions);
  }

  // Aca es donde llamo al metodo que envia el mensaje, y le envio el template que en este caso va a ser 'WELCOME' de esa forma en el metodo de SEND va a seleccionar ese template dentro de VIEWS/EMAILS y le paso el motivo del mensaje que en este caso va a ser dar la bienvenida. SEND es ASYNC asi que uso AWAIT y por lo tanto para usar AWAIT, hago que sendWelcome sea ASYNC.
  async sendWelcome() {
    await this.send('welcome', 'Bienvenido a la familia Nexus!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Tu token para restuar tu clave(valido solo por 10 minutos)'
    );
  }
};
