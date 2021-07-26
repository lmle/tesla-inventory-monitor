const express = require('express');
const sgMail = require('@sendgrid/mail');
const axios = require('axios');
const modelNameMap = require('./constants/modelNameMap');
const query = require('./constants/teslaAPIQuery');
const sendEmail = require('./utils/sendEmail');
const getSendgridEmails = require('./utils/getSendgridEmails');
const getRandomInt = require('./utils/getRandomInt');

const app = express();
const vins = [];
let retryCount = 0;

app.get('/', (req, res) => {
  res.send('tesla-inventory-monitor is running');
});

app.listen(process.env.PORT, () => {
  console.log(`tesla-inventory-monitor port ${process.env.PORT}`); // eslint-disable-line no-console
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const monitorTeslaInventory = async () => {
  console.log('monitorTeslaInventory'); // eslint-disable-line no-console

  try {
    const url = `https://www.tesla.com/inventory/api/v1/inventory-results?query=${JSON.stringify(query)}`;
    const { data: { results } } = await axios.get(url);

    // reset retryCount on API request success
    retryCount = 0;

    const newResults = Array
      .from(results)
      .filter((r) => !vins.includes(r.VIN));

    if (!newResults.length) {
      console.log('no new results'); // eslint-disable-line no-console
      return;
    }

    vins.push(...newResults.map((r) => r.VIN));

    /* eslint-disable indent */
    const html = `
      <ol>
        ${
          newResults
            .map((result) => (`
              <li>
                <a href='https://www.tesla.com/${result.Model}/order/${result.VIN}?token=${result.token}'>
                  ${modelNameMap[result.Model]} ${result.TrimName} (${result.Year})
                </a>
                <ul>
                  ${
                    [
                      'VIN',
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

    sendEmail({
      prependedConsoleInfo: 'monitorTeslaInventory success',
      to: getSendgridEmails(process.env.SENDGRID_MONITOR_TO_EMAILS),
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'Peanut\'s New Tesla Inventory',
      html,
    });
  } catch (monitorError) {
    console.log('monitorTeslaInventory - error', monitorError); // eslint-disable-line no-console
    retryCount += 1;

    sendEmail({
      prependedConsoleInfo: `monitorTeslaInventory error - retry count ${retryCount}`,
      to: getSendgridEmails(process.env.SENDGRID_APP_HEALTH_TO_EMAILS),
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'Error - Tesla New Inventory',
    });
  }
};

/* eslint-disable max-len */
const sendAppHealthEmail = async () => {
  sendEmail({
    prependedConsoleInfo: 'sendAppHealthEmail',
    to: getSendgridEmails(process.env.SENDGRID_APP_HEALTH_TO_EMAILS),
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'tesla-inventory-monitor is running',
  });
};
/* eslint-enable max-len */

monitorTeslaInventory();

(function loop() {
  if (retryCount >= process.env.MONITOR_RETRIES_MAX) return;

  let minMs = process.env.MONITOR_INTERVAL_MIN_MILLISECONDS;
  let maxMs = process.env.MONITOR_INTERVAL_MAX_MILLISECONDS;

  if (retryCount > 0 && retryCount < process.env.MONITOR_RETRIES_MAX) {
    minMs = process.env.MONITOR_RETRY_MIN_MILLISECONDS;
    maxMs = process.env.MONITOR_RETRY_MAX_MILLISECONDS;
  }

  setTimeout(() => {
    monitorTeslaInventory();
    loop();
  }, getRandomInt(minMs, maxMs));
}());

setInterval(sendAppHealthEmail, process.env.APP_HEALTH_EMAIL_INTERVAL_MILLISECONDS);
