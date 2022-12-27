# Migrate Google Calendar Reminders -> Google Tasks

This project allows you to migrate your existing old Reminders in
Google Calendar into the new Google Tasks.

Even though the official Android application
[Google Tasks](https://play.google.com/store/apps/details?id=com.google.android.apps.tasks)
provides an option to migrate Reminders, it severely lacks flexibility. In fact,
it simply migrates **every** Reminder into a single (though selected by the end
user) Tasks list, not giving you much choice.

Unlike that officially provided migration way, this project grants you much
more control on what Reminders you'd like to migrate, and to what Tasks lists.
And it still provides you a flexible automation for batch processes!

## Installation

1. Clone this repo.
2. Being inside the cloned repo directory run:
   ```
   npm i
   ```
3. Retrieve an OAuth 2.0 application secret from Google:
https://console.cloud.google.com/apis/credentials. You'll have to create 
a new project in the Google Cloud Console. Use `app-secret.sample.json`
file for reference to how your secret JSON file should look like.
4. Put the application secret JSON file got in p. 3 along with
`app-secret.sample.json` file, name it `app-secret.json`.

## Usage

### Authentication

First of all, you need an end-user authentication token.

**NOTE:** you don't *have* to perform this step manually. The application
will invoke this step automatically if the user token is absent or expired.
However, it is advised to perform it manually just to separate possible
authentication errors from errors caused by the principal API calls.

1. Run:
   ```
   npm run main -- auth
   ```
   The application will generate a URL which you have to visit with your
browser (where you are authenticated as the Google user) manually.
2. Proceed with the instructions given by Google Auth page.
3. Once you see the plain text message `You can close this page now, and
return to the console application.` on the web page, follow it :)
4. The application should output `Token has been stored...` message, and
`user-secret.json` file should appear.

**CAUTION:** never share `user-secret.json` with anyone! This is the
password-less key to your Google account! Anyone possessing this file
can destroy or tamper any Google Calendar items and any Google Tasks!

**NOTE:** manually check the expiration of the `user-secret.json` (the
JSON field `expires_at`), UNIX timestamp with milliseconds granularity.
If you just created the project in Google Cloud Console, the granted
authorization is quite short (72 hours or even less).

### Preparation

This step is aimed to prepare *transformations* for each of your
Google Calendar reminders into appropriate Google Tasks.

1. Run:
   ```
   npm run main -- prepare
   ```
2. The application downloads reminders from Google Calendar, matches
a Google Task object to each of them, and serialize the result into
`prepared.json` file.
3. You must copy `prepared.json` to `postpared.json` file, and edit it:
   * Delete all reminders which you don't want to migrate yet.
   * For every reminder which you leave, you must fill in its `tasksList`
     JSON key. See `src/_prepared-type.ts` to find out the schema.
     Indeed, for every `tasksList` JSON key the value is a JSON object
     with mandatory `id` key (ID of the Google Tasks list) and optional
     `title` key (the exact title of the Google Tasks list, may be validated
     during migration process).

**NOTES:**

* In `prepared.json` file, you will see `normal` and `recurring`
  reminders. The `normal` array contains non-recurring reminders only.
  Unfortunately, this application does not yet support migration of
  recurring Calendar reminders into recurring Tasks, but the preparation
  process still writes them down for possible migration in a future version
  of this application. You can safely leave `recurring` stuff in the
  `postpared.json` file, it will be ignored by the current version.
* Google Calendar does not provide an official API for downloading
  reminders. Therefore, a hacky approach is utilized, simulating how the
  Google Calendar web app works with reminders.
* The unofficial Google Reminders API does not produce more than 1000
  reminders per request, and it only returns reminders which were set to
  alarm before a specific timestamp. In order to circumvent that, the
  application requests Google Reminders API multiple times with different
  timestamps, by default incrementing the timestamp by 30 days, and
  making this floating window start from January 1st, 2010 till one year
  after the current date. (The application filters duplicates.)
  <br /><br />
  For most users it should be a valid approach. But if you have more than
  1000 reminders in a month, some of them **will be skipped by default**.
  On the other hand, if you definitely have much less than 1000 reminders
  per every month, this approach leads to unnecessary downloading
  the same reminders multiple times.
  <br /><br />
  You can control this behaviour with options. Run
  `npm run main -- prepare --help` to get more details.

### Migration

Once you have prepared your `postpared.json`, run:
```
npm run main -- migrate
```
For every reminder present in `postpared.json` the application will create
a relevant Task in a Tasks List specified in `postpared.json`. By default,
the application checks whether the Task which it is going to create already
exists in the Tasks List, and if so, does not duplicate the Task.

**NOTE:** by default, the application validates the titles of Tasks Lists
specified in `postpared.json`.
* If no `title` presents, **the application
fails**.
* If `title` for a same discovered Tasks List ID mismatches within
`postpared.json`, the application refuses to work even not connecting to
Google API at all.
* Before actually creating any Task on any Tasks List, the application
verifies all Tasks Lists titles received with API against them specified
in `postpared.json`. In case of any mismatch, the application refuses to
work.

Use `--ignore-tasks-list-title` to suppress this validation.

**NOTE:** by default, the reminders are **not** deleted from Google Calendar.
It is highly recommended to manually check the migration result first.
If everything is fine, re-run this command adding the flag
`--delete-reminders`. On the second run, the application detects duplicating
Tasks and will not create them again (by default!), but deletes the relevant
reminders with this flag.

**NOTE:** please see all available options by running
`npm run main -- migrate --help`.

The application will report its result for every transformation in
`result.json` file.
