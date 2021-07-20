const express = require('express');
const sgMail = require('@sendgrid/mail');
const axios = require('axios');
const modelMap = require('./constants/modelMap');
const getCurrentISO = require('./utils/getCurrentISO');
const getSendgridEmails = require('./utils/getSendgridEmails');
const getRandomInt = require('./utils/getRandomInt');

const app = express();
const vins = [];

app.get('/', (req, res) => {
  res.send('tesla-inventory-monitor is running');
});

app.listen(process.env.PORT, () => {
  console.log(`tesla-inventory-monitor port ${process.env.PORT}`); // eslint-disable-line no-console
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const monitorTeslaInventory = async () => {
  console.log('monitorTeslaInventory'); // eslint-disable-line no-console

  const query = {
    query: {
      model: 'my', // my, mx
      condition: 'new', // new, used
      options: {
      },
      arrangeby: 'Price',
      order: 'asc',
      market: 'US',
      language: 'en',
      super_region: 'north america',
      lng: -121.685341,
      lat: 37.2751505,
      zip: '95135',
      range: 200,
      region: 'CA',
    },
    offset: 0,
    count: 50,
    outsideOffset: 0,
    outsideSearch: false,
  };

  try {
    const url = `https://www.tesla.com/inventory/api/v1/inventory-results?query=${JSON.stringify(query)}`;
    const { data: { results } } = await axios.get(url);

    const latestResults = Array
      .from(results)
      .filter((r) => !vins.includes(r.VIN));

    if (!latestResults.length) {
      console.log('no new results'); // eslint-disable-line no-console
      return;
    }

    vins.push(...latestResults.map((r) => r.VIN));

    /* eslint-disable indent */
    const html = `
      <ol>
        ${
          latestResults
            .map((result) => (`
              <li>
                <a href='https://www.tesla.com/${result.Model}/order/${result.VIN}?token=${result.token}'>
                  ${modelMap[result.Model]} ${result.TrimName} (${result.Year})
                </a>
                <ul>
                  ${
                    [
                      'PAINT',
                      'INTERIOR',
                      'WHEELS',
                    ].map((key) => {
                      let value = result[key];

                      if (Array.isArray(result[key])) {
                        value = value.join(', ');
                      }

                      return `<li>${key}: ${value}</li>`;
                    })
                    .join('')
                  }
                </ul>
              </li>
            `))
            .join('')
        }
      </ol>
    `;
    /* eslint-enable indent */

    const msg = {
      to: getSendgridEmails(process.env.SENDGRID_MONITOR_TO_EMAILS),
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'Peanut\'s New Tesla Inventory',
      html,
    };

    try {
      await sgMail.send(msg);
      console.info(`${getCurrentISO()} - monitor - email sent`); // eslint-disable-line no-console
    } catch (error) {
      console.error(`${getCurrentISO()} - monitor - email error`); // eslint-disable-line no-console
      console.error(error); // eslint-disable-line no-console
    }
  } catch (monitorError) {
    console.log('monitor - error', monitorError); // eslint-disable-line no-console

    const msg = {
      to: getSendgridEmails(process.env.SENDGRID_APP_HEALTH_TO_EMAILS),
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'Error - Tesla New Inventory',
      html: monitorError,
    };

    try {
      await sgMail.send(msg);
      console.info(`${getCurrentISO()} - monitor - error - email sent`); // eslint-disable-line no-console
    } catch (sendgridError) {
      console.error(`${getCurrentISO()} - monitor - error - email error`); // eslint-disable-line no-console
      console.error(sendgridError); // eslint-disable-line no-console
    }
  }
};

/* eslint-disable max-len */
const sendAppHealthEmail = async () => {
  const msg = {
    to: getSendgridEmails(process.env.SENDGRID_APP_HEALTH_TO_EMAILS),
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'tesla-inventory-monitor is running',
    text: 'EOM',
    html: 'EOM',
  };

  try {
    await sgMail.send(msg);
    console.info(`${getCurrentISO()} - sendAppHealthEmail - email sent`); // eslint-disable-line no-console
  } catch (error) {
    console.error(`${getCurrentISO()} - sendAppHealthEmail - email error`); // eslint-disable-line no-console
    console.error(error); // eslint-disable-line no-console
  }
};
/* eslint-enable max-len */

monitorTeslaInventory();

(function loop() {
  const randomMs = getRandomInt(
    process.env.MONITOR_EMAIL_INTERVAL_MIN_MILLISECONDS,
    process.env.MONITOR_EMAIL_INTERVAL_MAX_MILLISECONDS,
  );

  setTimeout(() => {
    monitorTeslaInventory();
    loop();
  }, randomMs);
}());

setInterval(sendAppHealthEmail, process.env.APP_HEALTH_EMAIL_INTERVAL_MILLISECONDS);
