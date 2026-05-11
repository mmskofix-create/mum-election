Create a professional web-based voting system for a school/madrasa election with the following requirements:
GENERAL SYSTEM:

* The system must work on mobile phones, tablets, laptops, and desktops.
* Use a clean, modern, responsive, student-friendly UI.
* Use Firebase Firestore as the backend database.
* All data updates must happen in real time without refreshing.
ELECTION STRUCTURE:

* There are:
   * 2 Boy candidates
   * 2 Girl candidates
* Every student must cast:
   * 1 vote for a Boy candidate
   * 1 vote for a Girl candidate
* Final result should determine:
   * 1 Boy winner
   * 1 Girl winner
IMPORTANT SYSTEM LOGIC: Students should ONLY vote.
Students should NOT enter:

* Class
* Gender
* Roll Number
* Section
* Any personal details
All student details must already be managed from the Admin/Control Room side.
ADMIN CONTROL SYSTEM: The admin panel must allow admins to:

* Add students
* Edit student details
* Delete students
* Assign:
   * Roll Number
   * Name
   * Class
   * Section
   * Gender
Each student should have a unique voting access.
STUDENT VOTING SYSTEM:

* The student voting interface must be extremely simple.
* After opening the voting page, the student should directly see:
   * Boy candidate section
   * Girl candidate section
The student must:

* Select ONE boy candidate
* Select ONE girl candidate
* Click “Submit Vote”
After submission: Show: “Your vote has been submitted successfully.”
DUPLICATE VOTING PREVENTION:

* Each student can vote ONLY ONCE.
* The system must prevent duplicate voting using admin-assigned student records.
* If a student has already voted: Show: “You have already voted.”
DATABASE STRUCTURE: Store:

* Student ID
* Name
* Class
* Section
* Gender
* Selected Boy Candidate
* Selected Girl Candidate
* Timestamp
LIVE POLLING SCREEN: Create a separate live polling display screen for projector/TV use.
IMPORTANT:

* Do NOT show candidate-wise results publicly.
Show only:

* Total polling percentage
* Total students voted
* Class-wise participation percentage
* Gender-wise participation percentage
* Section-wise participation percentage
Add:

* Live progress bars
* Real-time charts/graphs
* Automatic live updates
ADMIN PANEL: Create a secure admin dashboard with authentication.
Admin features:

* Add/Edit/Delete students
* Add/Edit/Delete candidates
* View total votes
* View candidate-wise results
* View participation analytics
* Automatically determine:
   * Boy Winner
   * Girl Winner
Admin controls:

* Start Voting
* Stop Voting
* Reset Election
* Export results to PDF/Excel
TECHNOLOGY: Frontend:

* HTML
* CSS
* JavaScript
Backend:

* Firebase Firestore
OPTIONAL FEATURES:

* Dark mode
* Countdown timer
* Live admin analytics
* Fully mobile responsive design
SECURITY:

* Use Firestore security rules
* Prevent unauthorized admin access
* Prevent duplicate voting
* Support simultaneous voting from multiple devices
The final system should look like a professional digital election platform suitable for schools and madrasas.

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBX4yg4feUeDM-5519AF45qc2vg5phRtZ8",
  authDomain: "election-madrsa.firebaseapp.com",
  projectId: "election-madrsa",
  storageBucket: "election-madrsa.firebasestorage.app",
  messagingSenderId: "764714650183",
  appId: "1:764714650183:web:105111b3fff92d3f933f62",
  measurementId: "G-FC5894S63V"
};
