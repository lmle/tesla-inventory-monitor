const sgMail = require('@sendgrid/mail');
const getCurrentISO = require('./getCurrentISO');

module.exports = async ({
  to,
  from,
  subject,
  text = 'EOM',
  html = 'EOM',
  prependedConsoleInfo,
}) => {
  const msg = {
    to,
    from,
    subject,
    text,
    html,
  };

  try {
    await sgMail.send(msg);
    console.info(`${getCurrentISO()} - ${prependedConsoleInfo} - email sent`); // eslint-disable-line no-console
  } catch (error) {
    console.error(`${getCurrentISO()} - ${prependedConsoleInfo} - email error`); // eslint-disable-line no-console
    console.error(error); // eslint-disable-line no-console
  }
};
