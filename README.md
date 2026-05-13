# Madrasa Election Web App

A professional Firebase Firestore voting platform for school/madrasa elections. It contains:

- `index.html` — simple student voting page.
- `admin.html` — authenticated control-room dashboard.
- `live.html` — projector/TV live polling screen that hides candidate-wise results.
- `firestore.rules` — Firestore rules for admin access and duplicate-vote protection.

## How students vote

Students do not type class, gender, roll number, section, or personal information. Admins create student records first, then copy each student's unique voting link from the dashboard. The link looks like:

```text
https://your-site.example/index.html?student=STUDENT_DOC_ID&access=ME-ABCD-EFGH
```

The student opens the link, selects one boy candidate and one girl candidate, and submits once. The app writes a vote document with student ID, name, class, section, gender, selected boy candidate, selected girl candidate, and timestamp.

## Firebase setup

1. Open the Firebase console for project `election-madrsa`.
2. Enable **Authentication → Email/Password**.
3. Create an admin user.
4. In Firestore, create `admins/{ADMIN_UID}` for that user's UID. Example document:

```json
{ "role": "admin", "name": "Election Admin" }
```

5. Publish `firestore.rules` to Firestore Rules.
6. Host these static files using Firebase Hosting or any static web server.


## Candidate add troubleshooting

If the admin panel shows an error while adding candidates, the most common cause is Firebase permissions, not the candidate form itself:

1. Confirm you are signed in with the same Firebase Auth user whose UID is stored at `admins/{ADMIN_UID}`.
2. Confirm `firestore.rules` has been published in the Firebase console.
3. If the page says `Missing or insufficient permissions`, copy the UID/path shown in the admin warning and create that exact admin document in Firestore.
4. Refresh `admin.html` after creating the admin document, then add the two boy candidates and two girl candidates again.

## Collections

- `settings/election` — `{ status: "open" | "closed", updatedAt }`
- `students/{studentId}` — roll number, name, className, section, gender, accessCode, voted state, selected candidates.
- `candidates/{candidateId}` — name, group (`boy` or `girl`), symbol, description, active state.
- `votes/{studentId}` — immutable vote record, one document per student.
- `admins/{uid}` — allow-listed admin users.

## Recommended candidate setup

Add exactly two active candidates with `group: boy` and two active candidates with `group: girl` from the admin dashboard.

## Security note

This is a static HTML/CSS/JavaScript implementation using Firestore. The included rules prevent unauthenticated admin access and block duplicate vote documents by student ID. For the strongest production-grade secrecy of student details, add a Firebase Cloud Function that accepts only the access code, performs the transaction server-side, and keeps student documents fully private from public clients.
