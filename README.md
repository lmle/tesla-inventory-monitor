# tesla-inventory-monitor
tesla-inventory-monitor sends an email when a new Model Y becomes available in Tesla's deliverable inventory.

## Setup
```
cd tesla-inventory-monitor
touch src/config.env
```

In `config.env`, add the following variables:
| Name | Type | Description |
| --- | --- | --- |
| PORT | Number | Port number that Express will listen to |
| SENDGRID_API_KEY | String | API key for Sendgrid |
| SENDGRID_FROM_EMAIL | String | Email that sends emails. The email must be verified as a Sender Identity in SendGrid. |
| SENDGRID_TO_EMAILS | String | Emails that will receive emails about Tesla inventory. Multiple emails can be separated with a ', ' (e.g. 'a@gmail.com, b@gmail.com'). |
| SENDGRID_APP_HEALTH_TO_EMAILS | String | Emails that will receive emails about the app health. Multiple emails can be separated with a ', '. |
| APP_HEALTH_EMAIL_INTERVAL_MILLISECONDS | Number | Milliseconds between sending an email to say the application is still running. |
| MONITOR_INTERVAL_MIN_MILLISECONDS | Number | Min of a milliseconds range for calling Tesla API. (A randomized interval is used because Tesla API will return a 403 for consistent intervals. |
| MONITOR_INTERVAL_MAX_MILLISECONDS | Number | Max of a milliseconds range for calling Tesla API. |
| MONITOR_RETRIES_MAX | Number | Max number of retries if Tesla API throws an error. |
| MONITOR_RETRY_MIN_MILLISECONDS | Number | Min of a milliseconds range for retrying to call Tesla API. A larger number then `MONITOR_INTERVAL_MIN_MILLISECONDS` is recommended for a better chance of a successful retry. |
| MONITOR_RETRY_MAX_MILLISECONDS | Number | Max of a milliseconds range for retrying to call Tesla API. |

For example,
```
// src/config.env
export PORT=3333
...
```

Then,
```
npm i
source src/config.env
node src/index.js
```
