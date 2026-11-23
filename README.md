# Student Project Organizer

A browser-based student task management application that helps students organize subjects, activities, projects, and deadlines in one place. It includes a dashboard, priority list, calendar, in-app reminders, and account settings.

## Features

### Dashboard
- View the total number of subjects, pending tasks, urgent tasks, overdue tasks, and completed tasks.
- Track overall completion progress.
- Preview upcoming deadlines.
- Use shortcuts to add subjects or activities and open other sections.

### Account Management
- Register with a full name, email, username, and password.
- Log in using an email address or username.
- Edit profile information and change a password.
- Switch between accounts saved on the same device.
- Log out.

### Subjects
- Add, view, edit, search, and delete subjects.
- See the activity count and pending activity count for each subject.
- Deleting a subject also deletes its associated activities.

### Activities and Projects
- Add, edit, delete, and mark activities as completed or pending.
- Assign each item to a subject.
- Choose an item type: Activity or Project.
- Add an optional deadline, description/notes, and urgent flag.
- Filter by subject, type, and status.
- Search activity titles and descriptions.

### Top Priorities
- View urgent tasks, upcoming tasks, or all pending tasks.
- Tasks are ordered by deadline priority.
- Expand a task to view its description.
- Mark tasks as completed or delete them.

### Calendar
- View deadlines in monthly or weekly calendar layouts.
- Navigate between dates or return to today.
- Filter calendar events by subject and status.
- Select a date to see its scheduled activities and projects.

### Notifications
- Automatically create in-app reminders for overdue, due-today, and due-soon activities.
- View unread and total reminder counts.
- Mark reminders as read or unread.
- Mark all reminders as read or dismiss all visible reminders.

### Settings and Appearance
- View and edit profile details.
- Switch between dark and light themes.
- Add another account or switch to an existing account on the device.
- Log out of the current account.

## Built With

- HTML5 – Application structure
- CSS3 – Styling, layout, and responsive presentation
- Vanilla JavaScript – Application logic and interactive features
- Browser Local Storage – Saves accounts, sessions, subjects, activities, reminders, and theme preferences on the current device.

The project uses plain HTML, CSS, and JavaScript. No frontend framework or package installation is required.

## Getting Started

### Requirements

- A modern web browser (such as Google Chrome, Microsoft Edge, or Mozilla Firefox).
- Git (optional, if you want to clone the repository).

### Run Locally

1. Clone the repository:

   ```bash
   git clone <repository-url>
   ```

2. Move into the project directory:

   ```bash
   cd <repository-folder>
   ```

3. Locate and open `index.html` in your web browser.

You can also use a local development server, such as the Live Server extension in Visual Studio Code, and open the provided local address in your browser.

There is no build step or dependency installation required.

## Demo Account

The application creates a demo account with sample subjects and activities on the first run, if no accounts have been saved yet.

| Field | Demo value |
|---|---|
| Username | `demo` |
| Password | `demo123` |
| Email | `demo@spo.app` |

## Project Structure

```text
student-project-organizer/
├── README.md
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── app.js
    ├── auth.js
    ├── activities.js
    ├── calendar.js
    ├── dashboard.js
    ├── notifications.js
    ├── priorities.js
    ├── settings.js
    ├── storage.js
    ├── subjects.js
    └── utils.js
```

### JavaScript Modules

| File | Responsibility |
|---|---|
| `app.js` | Application startup, navigation, shared modal, and rendering |
| `auth.js` | Registration, login, validation, account switching, and logout |
| `activities.js` | Activity and project management, searching, and filtering |
| `calendar.js` | Monthly/weekly calendar and deadline event display |
| `dashboard.js` | Dashboard statistics, progress, and upcoming deadline preview |
| `notifications.js` | In-app deadline reminders and read/dismiss actions |
| `priorities.js` | Urgent and upcoming task views and priority ordering |
| `settings.js` | Profile editing, theme preference, and account settings |
| `storage.js` | Local Storage data, user sessions, and initial demo data |
| `subjects.js` | Subject creation, viewing, editing, searching, and deletion |
| `utils.js` | Shared DOM helpers, date utilities, escaping, and deadline status logic |

## Data Storage

The application stores information in the browser's Local Storage. Data is kept separately for each account on the same browser and device.

Because the data is stored locally:

- Clearing browser data may remove saved accounts and project information.
- Data does not automatically synchronize between different devices or browsers.
- The application does not use a remote database or server-side account system.

## Security Note

This project is suitable as a classroom/demo application, not as a production authentication system. The current implementation stores passwords in plain text in Local Storage. Do not use real or sensitive passwords. A production version should use a secure backend, proper password hashing, and server-side authentication.

## Project Status

This is a student project. Features and implementation may be updated as development continues.

## Contributors

- Angela Bangabanga
- Jessa Mae Mansueto
- Loreme Mat-an
- Ronald Obaub